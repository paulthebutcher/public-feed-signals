export type HNPost = {
  id: number;
  title: string;
  content: string;
  url: string;
  score: number;
  comments: number;
  author: string;
  published: string;
  age_hours: number;
};

interface HNStory {
  id: number;
  title: string;
  text?: string;
  url?: string;
  score: number;
  descendants?: number;
  time: number;
  by?: string;
  type?: string;
}

/**
 * Fetch a single story from HackerNews API
 */
export async function getHNStory(storyId: number): Promise<HNStory | null> {
  const url = `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`;
  const response = await fetch(url, { next: { revalidate: 60 } }); // Cache for 1 min
  if (!response.ok) return null;
  return response.json();
}

/**
 * Fetch Ask HN story IDs
 */
export async function getAskHNStoryIds(limit: number = 50): Promise<number[]> {
  const url = 'https://hacker-news.firebaseio.com/v0/askstories.json';
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) return [];
  const ids = await response.json();
  return ids.slice(0, limit);
}

/**
 * Format HN story to our standard format
 */
function formatPost(story: HNStory): HNPost {
  const timestamp = story.time || 0;
  const pubDate = new Date(timestamp * 1000);
  const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  // Clean HTML tags from content (HN returns HTML)
  const content = (story.text || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/');

  return {
    id: story.id,
    title: story.title || '',
    content,
    url: `https://news.ycombinator.com/item?id=${story.id}`,
    score: story.score || 0,
    comments: story.descendants || 0,
    author: story.by || 'unknown',
    published: pubDate.toISOString(),
    age_hours: ageHours,
  };
}

/**
 * Fetch Ask HN posts (NO time filter - pain points are evergreen)
 */
export async function fetchRecentAskHNPosts(limit: number = 30): Promise<HNPost[]> {
  // NO TIME FILTER - removed to maximize volume

  // Get story IDs - fetch 15x limit to have enough after filtering (increased from 10x)
  const storyIds = await getAskHNStoryIds(Math.max(300, limit * 15));

  // Fetch full story details in parallel - fetch MORE stories (increased from 3x to 5x)
  const fetchLimit = Math.min(storyIds.length, limit * 5);
  const storyPromises = storyIds.slice(0, fetchLimit).map((id) => getHNStory(id));
  const stories = await Promise.all(storyPromises);

  // Filter and format
  const posts = stories
    .filter((story): story is HNStory => story !== null && story.type === 'story')
    .map(formatPost)
    .filter((post) => {
      // Must have SOME content
      if (!post.content || post.content.trim().length === 0) return false;

      // NO TIME FILTER - removed to maximize volume
      return true;
    });

  return posts;
}

/**
 * Search Ask HN posts by keywords
 */
export async function searchAskHNPosts(keywords: string, limit: number = 30): Promise<HNPost[]> {
  // Fetch 5x limit to have enough posts after keyword filtering (increased from 3x)
  const posts = await fetchRecentAskHNPosts(limit * 5);

  // Simple keyword matching (case-insensitive)
  const keywordLower = keywords.toLowerCase();
  const keywordParts = keywordLower.split(/\s+/).filter((k) => k.length > 2);

  if (keywordParts.length === 0) {
    // No valid keywords, return all recent posts
    return posts.slice(0, limit);
  }

  // Score posts by keyword relevance
  const scoredPosts = posts.map((post) => {
    const score = keywordParts.reduce((acc, keyword) => {
      const titleMatches = (post.title.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      const contentMatches = (post.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      return acc + titleMatches * 3 + contentMatches; // Title matches weighted higher
    }, 0);

    return { post, relevance: score };
  });

  // Filter posts with at least one keyword match and sort by relevance
  const matchedPosts = scoredPosts
    .filter((sp) => sp.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .map((sp) => sp.post)
    .slice(0, limit);

  console.log(`[HN] Fetched ${posts.length} posts, ${matchedPosts.length} match "${keywords}"`);

  // Return ONLY matched posts, no fallback
  // If 0 matches, return empty array to avoid polluting results with duplicates
  return matchedPosts;
}
