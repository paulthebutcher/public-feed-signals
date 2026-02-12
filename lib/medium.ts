export type MediumPost = {
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
 * Search Medium articles via RSS feeds
 *
 * Medium has rich startup content:
 * - Failure post-mortems: "Why my startup failed"
 * - Founder lessons: "3 things I learned building X"
 * - Problem discussions: "The hardest part of being a founder"
 * - Solution posts: "I built X to solve Y" (reverse strategy)
 *
 * Uses Medium's public RSS feeds (no API key needed)
 */
export async function searchMedium(
  keywords: string,
  limit: number = 30
): Promise<MediumPost[]> {
  try {
    // Medium RSS feeds by tag
    const tags = ['startup', 'entrepreneurship', 'founder', 'saas', 'business', 'indie-hacker'];

    const allPosts: MediumPost[] = [];

    // Fetch from multiple tags in parallel
    const fetchPromises = tags.map(tag => fetchMediumRSS(tag));
    const results = await Promise.all(fetchPromises);

    results.forEach(posts => allPosts.push(...posts));

    // Filter by keyword relevance
    const keywordLower = keywords.toLowerCase();
    const filtered = allPosts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(keywordLower);
      const contentMatch = post.content.toLowerCase().includes(keywordLower);
      return titleMatch || contentMatch;
    });

    console.log(`[Medium] Fetched ${allPosts.length} articles, ${filtered.length} match "${keywords}"`);

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('[Medium] Search failed:', error);
    return [];
  }
}

async function fetchMediumRSS(tag: string): Promise<MediumPost[]> {
  try {
    const rssUrl = `https://medium.com/feed/tag/${tag}`;

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`[Medium] RSS fetch failed for tag "${tag}": ${response.status}`);
      return [];
    }

    const xml = await response.text();

    // Parse RSS XML
    return parseRSS(xml);
  } catch (error) {
    console.error(`[Medium] Failed to fetch tag "${tag}":`, error);
    return [];
  }
}

function parseRSS(xml: string): MediumPost[] {
  const posts: MediumPost[] = [];

  // Extract items from RSS feed
  // RSS format: <item><title>...</title><link>...</link><description>...</description><pubDate>...</pubDate></item>
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXML = itemMatch[1];

    // Extract fields
    const titleMatch = itemXML.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const linkMatch = itemXML.match(/<link>(.*?)<\/link>/);
    const descMatch = itemXML.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
    const authorMatch = itemXML.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/);
    const pubDateMatch = itemXML.match(/<pubDate>(.*?)<\/pubDate>/);

    if (titleMatch && linkMatch) {
      const title = titleMatch[1];
      const url = linkMatch[1];
      const description = descMatch ? descMatch[1] : '';
      const author = authorMatch ? authorMatch[1] : 'Medium Author';
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

      // Clean HTML from description
      const cleanDesc = description
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .substring(0, 1000);

      const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

      posts.push({
        id: `medium-${url.split('/').pop()}`,
        title,
        content: cleanDesc,
        url,
        score: 50, // Default moderate score
        comments: 0,
        author,
        published: pubDate.toISOString(),
        age_hours: ageHours,
      });
    }
  }

  return posts;
}
