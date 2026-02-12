export type FailoryPost = {
  id: string;
  title: string;
  content: string;
  url: string;
  score: number;
  comments: number;
  author: string;
  published: string;
  age_hours: number;
  category: string;
};

/**
 * Scrape Failory startup post-mortems
 *
 * Failory publishes detailed failure analyses where founders describe:
 * - What went wrong
 * - Problems they couldn't solve
 * - What they wish existed
 *
 * Example: "We failed because we couldn't figure out paid acquisition"
 */
export async function searchFailory(
  keywords: string,
  limit: number = 30
): Promise<FailoryPost[]> {
  try {
    // Failory has a cemetery section with startup failures
    // We'll fetch the main cemetery page and parse the failure stories
    const response = await fetch('https://www.failory.com/cemetery', {
      headers: {
        'User-Agent': 'ProblemSignalMiner/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[Failory] Fetch error: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Parse failure posts from HTML
    const posts = parseFailoryHTML(html, keywords);

    console.log(`[Failory] Parsed ${posts.length} failure stories matching "${keywords}"`);

    return posts.slice(0, limit);
  } catch (error) {
    console.error('[Failory] Fetch failed:', error);
    return [];
  }
}

function parseFailoryHTML(html: string, keywords: string): FailoryPost[] {
  const posts: FailoryPost[] = [];
  const keywordLower = keywords.toLowerCase();

  // Failory cemetery has cards for each failed startup
  // Pattern: <div class="cemetery-card"> with title, description, tags
  // We'll look for article links and descriptions

  // Match article links and surrounding content
  // Pattern: <a href="/cemetery/[startup-name]">...</a>
  const articleRegex = /<a[^>]*href="\/cemetery\/([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>/gi;

  let match;
  let index = 0;

  while ((match = articleRegex.exec(html)) !== null && index < 100) {
    const slug = match[1];
    const title = match[2].replace(/<[^>]*>/g, '').trim();
    const description = match[3].replace(/<[^>]*>/g, '').trim();

    // Filter by keyword relevance
    const titleMatch = title.toLowerCase().includes(keywordLower);
    const descMatch = description.toLowerCase().includes(keywordLower);

    if ((titleMatch || descMatch) && description.length > 30) {
      posts.push({
        id: `failory-${slug}`,
        title,
        content: description,
        url: `https://www.failory.com/cemetery/${slug}`,
        score: 90, // Failure stories are high-signal for pain points
        comments: 0,
        author: 'Failory',
        published: new Date().toISOString(),
        age_hours: 0, // Evergreen learnings
        category: 'failory'
      });
    }

    index++;
  }

  // Also try alternative pattern for startup cards
  // Some pages use different HTML structure
  const cardRegex = /<div[^>]*class="[^"]*startup-card[^"]*"[^>]*>[\s\S]*?<h[234][^>]*>(.*?)<\/h[234]>[\s\S]*?<p[^>]*>(.*?)<\/p>[\s\S]*?<a[^>]*href="([^"]+)"/gi;

  while ((match = cardRegex.exec(html)) !== null && posts.length < 100) {
    const title = match[1].replace(/<[^>]*>/g, '').trim();
    const description = match[2].replace(/<[^>]*>/g, '').trim();
    const url = match[3].startsWith('http') ? match[3] : `https://www.failory.com${match[3]}`;

    const titleMatch = title.toLowerCase().includes(keywordLower);
    const descMatch = description.toLowerCase().includes(keywordLower);

    // Avoid duplicates
    const alreadyAdded = posts.some(p => p.title === title);

    if ((titleMatch || descMatch) && description.length > 30 && !alreadyAdded) {
      posts.push({
        id: `failory-${posts.length}`,
        title,
        content: description,
        url,
        score: 90,
        comments: 0,
        author: 'Failory',
        published: new Date().toISOString(),
        age_hours: 0,
        category: 'failory'
      });
    }
  }

  return posts;
}
