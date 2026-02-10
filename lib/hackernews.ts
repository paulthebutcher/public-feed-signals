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

/**
 * Fetch a single story from HackerNews API
 */
export async function getHNStory(storyId: number): Promise<any> {
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
function formatPost(story: any): HNPost {
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
 * Fetch recent Ask HN posts (last 7 days with content)
 */
export async function fetchRecentAskHNPosts(limit: number = 30): Promise<HNPost[]> {
  const sevenDaysAgo = 7 * 24; // hours

  // Get story IDs
  const storyIds = await getAskHNStoryIds(limit * 2); // Fetch more to account for filtering

  // Fetch full story details in parallel
  const storyPromises = storyIds.slice(0, limit).map((id) => getHNStory(id));
  const stories = await Promise.all(storyPromises);

  // Filter and format
  const posts = stories
    .filter((story) => story && story.type === 'story')
    .map(formatPost)
    .filter((post) => {
      // Must have content (not just a link)
      if (!post.content || post.content.length < 50) return false;

      // Must be recent (last 7 days)
      if (post.age_hours > sevenDaysAgo) return false;

      return true;
    });

  return posts;
}

/**
 * Search Ask HN posts by keywords
 */
export async function searchAskHNPosts(keywords: string, limit: number = 30): Promise<HNPost[]> {
  const posts = await fetchRecentAskHNPosts(limit);

  // Simple keyword matching (case-insensitive)
  const keywordLower = keywords.toLowerCase();
  const keywordParts = keywordLower.split(/\s+/).filter((k) => k.length > 2);

  if (keywordParts.length === 0) {
    // No valid keywords, return all recent posts
    return posts.slice(0, 20);
  }

  // Score posts by keyword relevance
  const scoredPosts = posts.map((post) => {
    const searchText = `${post.title} ${post.content}`.toLowerCase();
    const score = keywordParts.reduce((acc, keyword) => {
      const titleMatches = (post.title.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      const contentMatches = (post.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      return acc + titleMatches * 3 + contentMatches; // Title matches weighted higher
    }, 0);

    return { post, relevance: score };
  });

  // Filter posts with at least one keyword match and sort by relevance
  return scoredPosts
    .filter((sp) => sp.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .map((sp) => sp.post)
    .slice(0, 20);
}
