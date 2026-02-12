export type SOQuestion = {
  id: number;
  title: string;
  content: string;
  url: string;
  score: number;
  comments: number;
  author: string;
  published: string;
  age_hours: number;
  tags: string[];
  has_accepted_answer: boolean;
};

interface SOAPIQuestion {
  question_id: number;
  title: string;
  body?: string;
  body_markdown?: string;
  link: string;
  score: number;
  answer_count: number;
  comment_count?: number;
  creation_date: number;
  tags?: string[];
  is_answered?: boolean;
  owner?: {
    display_name?: string;
  };
}

/**
 * Search Stack Overflow questions
 *
 * High-voted questions without accepted answers = unsolved pain points
 * Tags provide clear categorization
 */
export async function searchStackOverflow(
  keywords: string,
  limit: number = 30
): Promise<SOQuestion[]> {
  try {
    const url = new URL('https://api.stackexchange.com/2.3/search/advanced');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('sort', 'votes');
    url.searchParams.set('q', keywords);
    url.searchParams.set('site', 'stackoverflow');
    url.searchParams.set('pagesize', limit.toString());
    url.searchParams.set('filter', 'withbody'); // Include question body

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'ProblemSignalMiner/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[StackOverflow] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.error('[StackOverflow] Invalid response format');
      return [];
    }

    const questions = data.items.map((q: SOAPIQuestion) => formatQuestion(q));

    // Filter for recent questions - Stack Overflow questions are evergreen, use longer window
    const oneYearAgo = 365 * 24; // 1 year - SO questions remain relevant longer
    const filtered = questions.filter((q: SOQuestion) =>
      q.age_hours < oneYearAgo // Removed vote requirement - low-vote questions can have great pain points
    );

    console.log(`[StackOverflow] Fetched ${questions.length} questions, ${filtered.length} recent (within 1 year)`);

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('[StackOverflow] Search failed:', error);
    return [];
  }
}

function formatQuestion(question: SOAPIQuestion): SOQuestion {
  const pubDate = new Date(question.creation_date * 1000); // Unix timestamp
  const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  // Combine title and body snippet for content
  const content = `${question.title}\n\n${question.body || question.body_markdown || ''}`.substring(0, 1000);

  return {
    id: question.question_id,
    title: question.title || '',
    content,
    url: question.link,
    score: question.score || 0,
    comments: question.comment_count || 0,
    author: question.owner?.display_name || 'unknown',
    published: pubDate.toISOString(),
    age_hours: ageHours,
    tags: question.tags || [],
    has_accepted_answer: question.is_answered || false,
  };
}
