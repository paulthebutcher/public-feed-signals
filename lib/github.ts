export type GitHubIssue = {
  id: number;
  title: string;
  content: string;
  url: string;
  score: number;
  comments: number;
  author: string;
  published: string;
  age_hours: number;
  labels: string[];
  repository: string;
};

interface GitHubAPIIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  html_url: string;
  created_at: string;
  comments: number;
  user?: {
    login?: string;
  };
  labels?: Array<{
    name: string;
  }>;
  reactions?: {
    total_count?: number;
  };
}

/**
 * Search GitHub issues
 *
 * Issues = explicit pain points!
 * - Open issues with many comments = unsolved problems
 * - Labels like "bug", "enhancement" = clear pain categories
 * - Repository context = specific domain
 */
export async function searchGitHubIssues(
  keywords: string,
  limit: number = 30
): Promise<GitHubIssue[]> {
  try {
    // Search for open issues with comments, sorted by most discussed
    const query = `${keywords} is:issue is:open sort:comments-desc`;

    const url = new URL('https://api.github.com/search/issues');
    url.searchParams.set('q', query);
    url.searchParams.set('per_page', limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ProblemSignalMiner/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[GitHub] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.error('[GitHub] Invalid response format');
      return [];
    }

    const issues = data.items.map((issue: GitHubAPIIssue) => formatIssue(issue));

    // Filter for recent (30 days) and with decent discussion
    const thirtyDaysAgo = 30 * 24;
    const filtered = issues.filter(issue =>
      issue.age_hours < thirtyDaysAgo &&
      issue.comments > 0
    );

    console.log(`[GitHub] Fetched ${issues.length} issues, ${filtered.length} recent with discussion`);

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('[GitHub] Search failed:', error);
    return [];
  }
}

function formatIssue(issue: GitHubAPIIssue): GitHubIssue {
  const pubDate = new Date(issue.created_at);
  const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  // Extract repository from URL
  const repoMatch = issue.html_url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  const repository = repoMatch ? repoMatch[1] : 'unknown';

  // Combine title and body for content
  const content = `${issue.title}\n\n${issue.body || ''}`.substring(0, 1000);

  return {
    id: issue.id,
    title: issue.title || '',
    content,
    url: issue.html_url,
    score: issue.reactions?.total_count || 0,
    comments: issue.comments || 0,
    author: issue.user?.login || 'unknown',
    published: pubDate.toISOString(),
    age_hours: ageHours,
    labels: (issue.labels || []).map((l) => l.name),
    repository,
  };
}
