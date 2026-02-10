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

/**
 * Fetch articles from Dev.to API
 * Docs: https://developers.forem.com/api/v0
 */
export async function fetchDevToArticles(params: {
  tag?: string;
  per_page?: number;
} = {}): Promise<any[]> {
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
function formatPost(article: any): DevToPost {
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
  const thirtyDaysAgo = 30 * 24; // hours (evergreen pain points)

  // Fetch articles from multiple relevant tags
  const tags = ['startup', 'entrepreneur', 'business', 'showdev', 'discuss', 'help'];

  const allArticles: any[] = [];

  // Fetch from each tag (parallel)
  const tagPromises = tags.map((tag) =>
    fetchDevToArticles({ tag, per_page: Math.ceil(limit / tags.length) })
  );

  const results = await Promise.all(tagPromises);
  results.forEach((articles) => allArticles.push(...articles));

  // Filter and format
  const posts = allArticles
    .map(formatPost)
    .filter((post) => {
      // Must have content (lowered threshold for better coverage)
      if (!post.content || post.content.length < 50) return false;

      // Must be recent (last 30 days)
      if (post.age_hours > thirtyDaysAgo) return false;

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
  const posts = await fetchRecentDevToPosts(limit * 2); // Fetch more to filter

  console.log(`[Dev.to] Fetched ${posts.length} recent posts - returning all for semantic scoring`);

  // NO keyword filtering - let semantic scoring handle relevance
  // This allows "startup" to match "indie maker", "building a product", etc.
  return posts.slice(0, limit);
}
