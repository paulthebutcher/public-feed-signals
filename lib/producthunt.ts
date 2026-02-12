export type ProductHuntPost = {
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

interface ProductHuntGraphQLNode {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
  url: string;
  user?: {
    name: string;
  };
  topics?: {
    edges: Array<{
      node: {
        name: string;
      };
    }>;
  };
}

interface ProductHuntGraphQLEdge {
  node: ProductHuntGraphQLNode;
}

interface ProductHuntGraphQLResponse {
  data?: {
    posts?: {
      edges: ProductHuntGraphQLEdge[];
    };
  };
}

/**
 * Search Product Hunt for product launches
 *
 * Product descriptions often mention problems they solve:
 * "We built X because Y was too hard/expensive/slow"
 *
 * Uses Product Hunt API or web scraping
 */
export async function searchProductHunt(
  keywords: string,
  limit: number = 30
): Promise<ProductHuntPost[]> {
  try {
    // Product Hunt GraphQL API endpoint
    const response = await fetch('https://www.producthunt.com/frontend/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProblemSignalMiner/1.0'
      },
      body: JSON.stringify({
        query: `
          query SearchPosts($query: String!, $first: Int!) {
            posts(query: $query, first: $first, order: VOTES) {
              edges {
                node {
                  id
                  name
                  tagline
                  description
                  votesCount
                  commentsCount
                  createdAt
                  url
                  user {
                    name
                  }
                  topics {
                    edges {
                      node {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          query: keywords,
          first: Math.min(limit * 2, 50) // Fetch extra to account for filtering
        }
      })
    });

    if (!response.ok) {
      console.error(`[ProductHunt] API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as ProductHuntGraphQLResponse;

    if (!data.data?.posts?.edges) {
      console.log('[ProductHunt] No results found');
      return [];
    }

    const posts = data.data.posts.edges.map((edge: ProductHuntGraphQLEdge) => formatPost(edge.node));

    // Filter for posts with substantial descriptions (where problems are mentioned)
    const filtered = posts.filter((post: ProductHuntPost) =>
      post.content && post.content.length > 100
    );

    console.log(`[ProductHunt] Fetched ${posts.length} posts, ${filtered.length} with descriptions`);

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('[ProductHunt] Search failed:', error);
    return [];
  }
}

function formatPost(post: ProductHuntGraphQLNode): ProductHuntPost {
  const pubDate = new Date(post.createdAt);
  const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  // Combine tagline and description for content
  const content = [post.tagline, post.description]
    .filter(Boolean)
    .join('\n\n')
    .substring(0, 2000);

  // Extract primary topic/category
  const category = post.topics?.edges?.[0]?.node?.name || 'general';

  return {
    id: post.id,
    title: post.name || '',
    content,
    url: post.url || `https://www.producthunt.com/posts/${post.id}`,
    score: post.votesCount || 0,
    comments: post.commentsCount || 0,
    author: post.user?.name || 'unknown',
    published: pubDate.toISOString(),
    age_hours: ageHours,
    category
  };
}
