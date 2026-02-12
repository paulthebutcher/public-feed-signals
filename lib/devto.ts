export type DevToPost = {
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
};

interface DevToArticle {
  id: number;
  title: string;
  description?: string;
  published_at: string;
  url: string;
  positive_reactions_count?: number;
  public_reactions_count?: number;
  comments_count?: number;
  user?: {
    username?: string;
  };
  tag_list?: string[];
  body_markdown?: string;
}

/**
 * Fetch articles from Dev.to API
 * Docs: https://developers.forem.com/api/v0
 */
export async function fetchDevToArticles(params: {
  tag?: string;
  per_page?: number;
} = {}): Promise<DevToArticle[]> {
  const { tag, per_page = 30 } = params;

  const url = new URL('https://dev.to/api/articles');
  if (tag) url.searchParams.set('tag', tag);
  url.searchParams.set('per_page', per_page.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'ProblemSignalMiner/1.0',
    },
    next: { revalidate: 60 }, // Cache for 1 min
  });

  if (!response.ok) return [];
  return response.json();
}

/**
 * Format Dev.to article to our standard format
 */
function formatPost(article: DevToArticle): DevToPost {
  const pubDate = new Date(article.published_at);
  const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  // Dev.to provides description/body_markdown
  const content = article.description || article.body_markdown || '';

  return {
    id: article.id,
    title: article.title || '',
    content: content.substring(0, 1000), // Limit content length
    url: article.url,
    score: article.public_reactions_count || 0,
    comments: article.comments_count || 0,
    author: article.user?.username || 'unknown',
    published: pubDate.toISOString(),
    age_hours: ageHours,
    tags: article.tag_list || [],
  };
}

/**
 * Fetch recent Dev.to articles (last 30 days with content)
 */
export async function fetchRecentDevToPosts(limit: number = 30): Promise<DevToPost[]> {
  // NO TIME FILTER - pain points are evergreen
  // Let semantic scoring and engagement metrics determine relevance

  // Fetch articles from multiple relevant tags - expanded to 20 tags for more volume
  const tags = [
    'startup', 'entrepreneur', 'business', 'showdev', 'discuss', 'help',
    'productivity', 'career', 'webdev', 'javascript', 'python', 'devops',
    'cloud', 'ai', 'opensource', 'saas', 'indie', 'founder', 'coding', 'tech'
  ];

  const allArticles: DevToArticle[] = [];

  // Fetch from each tag (parallel) - fetch MORE posts per tag
  const postsPerTag = Math.max(100, Math.ceil(limit / tags.length)); // Increased from 50 to 100
  const tagPromises = tags.map((tag) =>
    fetchDevToArticles({ tag, per_page: postsPerTag })
  );

  const results = await Promise.all(tagPromises);
  results.forEach((articles) => allArticles.push(...articles));

  // Filter and format
  const posts = allArticles
    .map(formatPost)
    .filter((post) => {
      // Must have SOME content
      if (!post.content || post.content.trim().length === 0) return false;

      // NO TIME FILTER - removed to maximize volume
      return true;
    })
    // Remove duplicates by ID
    .filter((post, index, self) => self.findIndex((p: DevToPost) => p.id === post.id) === index)
    // Sort by reactions (quality signal)
    .sort((a, b) => b.score - a.score);

  return posts.slice(0, limit);
}

/**
 * Search Dev.to articles by keywords
 */
export async function searchDevToPosts(keywords: string, limit: number = 30): Promise<DevToPost[]> {
  const posts = await fetchRecentDevToPosts(limit * 5); // Fetch 5x to have enough after filtering (increased from 3x)

  // CRITICAL: Actually filter by keywords so different keywords return different posts!
  // Use loose matching: keyword appears in title, content, or tags
  const keywordLower = keywords.toLowerCase();
  const matchedPosts = posts.filter(post => {
    const titleMatch = post.title.toLowerCase().includes(keywordLower);
    const contentMatch = post.content.toLowerCase().includes(keywordLower);
    const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(keywordLower));

    return titleMatch || contentMatch || tagMatch;
  });

  console.log(`[Dev.to] Fetched ${posts.length} recent posts, ${matchedPosts.length} match "${keywords}"`);

  // Return ONLY matched posts, no fallback
  // If 0 matches, return empty array to avoid polluting results with duplicates
  return matchedPosts.slice(0, limit);
}
