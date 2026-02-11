# Reddit Integration Guide

## Why Reddit?

**Volume**: 100M+ daily active users, thousands of problem-focused subreddits
**Quality**: Long-form discussions, specific communities (r/startups, r/SaaS, r/webdev, etc.)
**Signal**: Upvote/comment engagement indicates problem severity

## API Options

### Option 1: Official Reddit API (Recommended)
**Pros**: Official, reliable, rate limits clear
**Cons**: Requires OAuth, 60 requests/minute limit
**Cost**: Free

**Setup**:
1. Create app at https://www.reddit.com/prefs/apps
2. Get client_id and client_secret
3. Set in `.env.local`:
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=ProblemSignalMiner/1.0
   ```

### Option 2: Pushshift API (Easier but less reliable)
**Pros**: No auth required, historical data
**Cons**: Rate limits unclear, sometimes down
**Cost**: Free

## Implementation

```typescript
// lib/reddit.ts
export type RedditPost = {
  id: string;
  title: string;
  content: string;
  url: string;
  score: number;
  comments: number;
  author: string;
  published: string;
  age_hours: number;
  subreddit: string;
};

const TARGET_SUBREDDITS = [
  'startups',
  'SaaS',
  'Entrepreneur',
  'webdev',
  'indiebiz',
  'smallbusiness',
  'digitalnomad',
  'freelance'
];

/**
 * Search Reddit posts across multiple subreddits
 */
export async function searchReddit(
  keywords: string,
  limit: number = 30
): Promise<RedditPost[]> {
  if (!process.env.REDDIT_CLIENT_ID) {
    console.warn('[Reddit] No credentials, skipping');
    return [];
  }

  try {
    // Get OAuth token
    const token = await getRedditToken();

    // Search across target subreddits
    const subredditQueries = TARGET_SUBREDDITS.map(sub =>
      searchSubreddit(sub, keywords, token)
    );

    const results = await Promise.all(subredditQueries);
    const allPosts = results.flat();

    // Filter for recent (30 days) and high engagement
    const thirtyDaysAgo = 30 * 24;
    const filtered = allPosts.filter(post =>
      post.age_hours < thirtyDaysAgo &&
      post.score > 2 // At least some engagement
    );

    // Sort by score and limit
    const sorted = filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`[Reddit] Fetched ${allPosts.length} posts, ${sorted.length} after filtering`);

    return sorted;
  } catch (error) {
    console.error('[Reddit] Search failed:', error);
    return [];
  }
}

async function getRedditToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': process.env.REDDIT_USER_AGENT || 'ProblemSignalMiner/1.0'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

async function searchSubreddit(
  subreddit: string,
  keywords: string,
  token: string
): Promise<RedditPost[]> {
  const url = new URL(`https://oauth.reddit.com/r/${subreddit}/search`);
  url.searchParams.set('q', keywords);
  url.searchParams.set('restrict_sr', 'true'); // Search only this subreddit
  url.searchParams.set('sort', 'top'); // Top posts
  url.searchParams.set('t', 'month'); // Last month
  url.searchParams.set('limit', '100');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': process.env.REDDIT_USER_AGENT || 'ProblemSignalMiner/1.0'
    }
  });

  if (!response.ok) {
    console.error(`[Reddit] Failed to fetch r/${subreddit}:`, response.statusText);
    return [];
  }

  const data = await response.json();
  const posts = data.data.children.map((child: any) => formatRedditPost(child.data));

  return posts;
}

function formatRedditPost(post: any): RedditPost {
  const pubDate = new Date(post.created_utc * 1000);
  const ageHours = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  // Combine title and selftext for content
  const content = post.selftext
    ? `${post.title}\n\n${post.selftext}`
    : post.title;

  return {
    id: post.id,
    title: post.title,
    content: content.substring(0, 2000), // Limit for API
    url: `https://reddit.com${post.permalink}`,
    score: post.score || 0,
    comments: post.num_comments || 0,
    author: post.author || 'unknown',
    published: pubDate.toISOString(),
    age_hours: ageHours,
    subreddit: post.subreddit
  };
}
```

## Integration with sources.ts

```typescript
// Add to lib/sources.ts
import { searchReddit } from './reddit';

if (enabledSources.includes('reddit')) {
  promises.push(
    searchReddit(keywords, postsPerSource)
      .then((posts) => {
        console.log(`[Sources] Reddit: ${posts.length} posts`);
        return posts.map(redditToPost);
      })
      .catch((err) => {
        console.error(`[Sources] Reddit failed:`, err.message);
        return [];
      })
  );
}

function redditToPost(reddit: RedditPost): Post {
  return {
    id: reddit.id,
    title: reddit.title,
    content: reddit.content,
    url: reddit.url,
    score: reddit.score,
    comments: reddit.comments,
    author: reddit.author,
    published: reddit.published,
    age_hours: reddit.age_hours,
    source: 'reddit'
  };
}
```

## UI Updates

```typescript
// Update lib/types.ts
export type Post = {
  source: 'hackernews' | 'devto' | 'indiehackers' | 'github' | 'stackoverflow' | 'reddit';
  // ... other fields
};

// Update components/PainPointCard.tsx
case 'reddit':
  return { label: 'Reddit', color: 'bg-orange-900/30 text-orange-300 border-orange-700' };
```

## Rate Limiting

Reddit API: 60 requests/minute

**Strategy**:
- Search 8 subreddits in parallel
- Each search returns up to 100 posts
- Total: 8 requests per search (well under limit)
- Add 1 request for OAuth token
- **Total: 9 requests per user search**

## Expected Results

**Volume**:
- 8 subreddits × 100 posts = 800 posts fetched
- After filtering (30 days, score > 2): ~150 posts
- After limiting: 30 posts returned

**Quality**:
- r/startups: founder-specific problems
- r/SaaS: product/pricing pain points
- r/webdev: technical challenges
- r/Entrepreneur: business operations issues

## Testing

```bash
# Test Reddit search locally
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"keywords":"startup","sources":["reddit"]}'
```

## Error Handling

```typescript
// Handle missing credentials gracefully
if (!process.env.REDDIT_CLIENT_ID) {
  console.warn('[Reddit] No credentials configured, skipping Reddit search');
  return [];
}

// Handle rate limiting
if (response.status === 429) {
  console.error('[Reddit] Rate limited, backing off');
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 min
  return searchSubreddit(subreddit, keywords, token); // Retry
}
```

## Privacy & Ethics

- Only fetch public posts (no DMs, private subreddits)
- Respect Reddit's robots.txt and API terms
- Don't scrape - use official API
- Attribute sources with Reddit links
- Rate limit aggressively to avoid abuse
