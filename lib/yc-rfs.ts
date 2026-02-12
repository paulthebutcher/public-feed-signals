export type YCRFSPost = {
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
 * Parse YC Request for Startups page
 *
 * YC explicitly lists problems they want solved:
 * https://www.ycombinator.com/rfs
 *
 * These are validated, high-value pain points
 */
export async function searchYCRFS(
  keywords: string,
  limit: number = 30
): Promise<YCRFSPost[]> {
  try {
    // Fetch YC RFS page
    const response = await fetch('https://www.ycombinator.com/rfs', {
      headers: {
        'User-Agent': 'ProblemSignalMiner/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[YC RFS] Fetch error: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Parse RFS items from HTML
    // YC RFS page has sections with problem descriptions
    const posts = parseRFSHTML(html, keywords);

    console.log(`[YC RFS] Parsed ${posts.length} problem areas matching "${keywords}"`);

    return posts.slice(0, limit);
  } catch (error) {
    console.error('[YC RFS] Fetch failed:', error);
    return [];
  }
}

function parseRFSHTML(html: string, keywords: string): YCRFSPost[] {
  const posts: YCRFSPost[] = [];
  const keywordLower = keywords.toLowerCase();

  // Simple regex-based parsing for RFS sections
  // Look for heading + paragraph patterns that indicate problem areas
  const sectionRegex = /<h[23][^>]*>(.*?)<\/h[23]>[\s\S]*?<p[^>]*>(.*?)<\/p>/gi;

  let match;
  let index = 0;

  while ((match = sectionRegex.exec(html)) !== null && index < 50) {
    const title = match[1].replace(/<[^>]*>/g, '').trim();
    const content = match[2].replace(/<[^>]*>/g, '').trim();

    // Filter by keyword relevance
    const titleMatch = title.toLowerCase().includes(keywordLower);
    const contentMatch = content.toLowerCase().includes(keywordLower);

    if ((titleMatch || contentMatch) && content.length > 50) {
      posts.push({
        id: `yc-rfs-${index}`,
        title,
        content,
        url: `https://www.ycombinator.com/rfs#${title.toLowerCase().replace(/\s+/g, '-')}`,
        score: 100, // YC-validated problems get high base score
        comments: 0,
        author: 'Y Combinator',
        published: new Date().toISOString(),
        age_hours: 0, // Evergreen problems
        category: 'yc-rfs'
      });
    }

    index++;
  }

  return posts;
}
