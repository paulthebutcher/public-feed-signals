export type IndieHackersPost = {
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

interface RSSPost {
  id?: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  score?: number;
  comments?: number;
}

/**
 * Fetch Indie Hackers posts via unofficial RSS feed
 * Source: https://feed.indiehackers.world/
 * Note: RSS parsing done server-side, simple extraction from XML
 */
export async function fetchIndieHackersRSS(): Promise<RSSPost[]> {
  const url = 'https://feed.indiehackers.world/posts.rss';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ProblemSignalMiner/1.0',
      },
      next: { revalidate: 60 }, // Cache for 1 min
    });

    if (!response.ok) return [];

    const xmlText = await response.text();

    // Simple regex-based RSS parsing (works server-side)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const posts: RSSPost[] = [];

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const title = (itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     itemContent.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const description = (itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                          itemContent.match(/<description>(.*?)<\/description>/))?.[1] || '';
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const author = (itemContent.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/) ||
                     itemContent.match(/<dc:creator>(.*?)<\/dc:creator>/) ||
                     itemContent.match(/<author>(.*?)<\/author>/))?.[1] || 'unknown';

      // Extract ID from URL
      const idMatch = link.match(/\/([^\/]+)$/);
      const id = idMatch ? idMatch[1] : String(Date.now());

      posts.push({
        id,
        title,
        link,
        description,
        pubDate,
        author,
      });
    }

    return posts;
  } catch (error) {
    console.error('Indie Hackers RSS fetch failed:', error);
    return [];
  }
}

/**
 * Format IH post to our standard format
 */
function formatPost(post: RSSPost): IndieHackersPost {
  const pubDate = post.pubDate ? new Date(post.pubDate) : new Date();
  const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  // Clean HTML from description
  const content = (post.description || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&');

  return {
    id: post.id || post.link,
    title: post.title || '',
    content,
    url: post.link,
    score: 0, // RSS doesn't provide scores
    comments: 0, // RSS doesn't provide comment counts
    author: post.author || 'unknown',
    published: pubDate.toISOString(),
    age_hours: ageHours,
  };
}

/**
 * Fetch recent Indie Hackers posts (last 30 days with content)
 * Note: Server-side only (uses DOMParser from Node.js)
 */
export async function fetchRecentIndieHackersPosts(limit: number = 30): Promise<IndieHackersPost[]> {
  const ninetyDaysAgo = 90 * 24; // hours - relaxed from 30 to get more posts

  const posts = await fetchIndieHackersRSS();
  if (!posts) return [];

  // Filter and format
  const formattedPosts = posts
    .map(formatPost)
    .filter((post) => {
      // Must have SOME content (removed strict 50-char threshold)
      if (!post.content || post.content.trim().length === 0) return false;

      // Must be recent (last 90 days)
      if (post.age_hours > ninetyDaysAgo) return false;

      return true;
    });

  return formattedPosts.slice(0, limit);
}

/**
 * Search Indie Hackers posts by keywords
 */
export async function searchIndieHackersPosts(
  keywords: string,
  limit: number = 30
): Promise<IndieHackersPost[]> {
  const posts = await fetchRecentIndieHackersPosts(limit * 3); // Fetch 3x to have enough after filtering

  // CRITICAL: Actually filter by keywords so different keywords return different posts!
  // Use loose matching: keyword appears in title or content
  const keywordLower = keywords.toLowerCase();
  const matchedPosts = posts.filter(post => {
    const titleMatch = post.title.toLowerCase().includes(keywordLower);
    const contentMatch = post.content.toLowerCase().includes(keywordLower);

    return titleMatch || contentMatch;
  });

  console.log(`[IH] Fetched ${posts.length} recent posts, ${matchedPosts.length} match "${keywords}"`);

  // Return ONLY matched posts, no fallback
  // If 0 matches, return empty array to avoid polluting results with duplicates
  return matchedPosts.slice(0, limit);
}
