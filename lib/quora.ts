export type QuoraPost = {
  id: string;
  title: string;
  content: string;
  url: string;
  score: number;
  comments: number;
  author: string;
  published: string;
  age_hours: number;
};

/**
 * Search Quora for questions related to keywords
 *
 * Quora questions ARE pain points expressed as questions:
 * - "How do I find my first customers?" → Pain: Finding first customers
 * - "Why is fundraising so hard?" → Pain: Difficulty fundraising
 * - "What's the best way to validate a startup idea?" → Pain: Idea validation
 *
 * Strategy: Questions are explicit problem statements
 */
export async function searchQuora(
  keywords: string,
  limit: number = 30
): Promise<QuoraPost[]> {
  try {
    // Quora search URL
    const searchUrl = `https://www.quora.com/search?q=${encodeURIComponent(keywords)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      console.error(`[Quora] HTTP ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Parse questions from HTML
    const posts = parseQuoraHTML(html);

    console.log(`[Quora] Fetched ${posts.length} questions for "${keywords}"`);

    return posts.slice(0, limit);
  } catch (error) {
    console.error('[Quora] Search failed:', error);
    return [];
  }
}

function parseQuoraHTML(html: string): QuoraPost[] {
  const posts: QuoraPost[] = [];

  // Quora uses React/Next.js with JSON data embedded in script tags
  // Simple approach: Extract question-like text from the page
  // Look for text ending with "?" that's likely a question
  const textBlocks = html.match(/>([^<]{20,200}\?)</g) || [];

  const seenQuestions = new Set<string>();

  textBlocks.forEach((block, index) => {
    // Clean up the text
    const question = block
      .replace(/^>/, '')
      .replace(/<$/, '')
      .trim();

    // Filter for actual questions
    if (
      question.endsWith('?') &&
      question.length > 20 &&
      question.length < 200 &&
      !seenQuestions.has(question)
    ) {
      seenQuestions.add(question);

      // Create a URL-friendly slug
      const slug = question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);

      posts.push({
        id: `quora-${index}`,
        title: question,
        content: question, // Question itself is the content
        url: `https://www.quora.com/${slug}`,
        score: 50, // Default moderate score
        comments: 0,
        author: 'Quora User',
        published: new Date().toISOString(),
        age_hours: 0, // Questions are evergreen
      });
    }
  });

  return posts;
}
