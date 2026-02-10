# Why Only 1 Post for "Startup" Search?

## The Real Problem: Keyword Matching is Too Restrictive

### Current Flow for "startup" search:

```
searchMultipleSources('startup', ['all'], 30)
  ↓
  postsPerSource = 30/3 = 10 posts per source
  ↓
  Fetch in parallel:
  ├─ HackerNews: searchAskHNPosts('startup', 10)
  ├─ Dev.to: searchDevToPosts('startup', 10)
  └─ Indie Hackers: searchIndieHackersPosts('startup', 10)
```

## Issue 1: Dev.to Sequential Filtering

**Code:** `lib/devto.ts` lines 105-134

```typescript
export async function searchDevToPosts(keywords: string, limit: number = 30) {
  const posts = await fetchRecentDevToPosts(limit * 2); // Fetch 20 posts

  // Filter for keyword matches
  const keywordParts = keywords.split(/\s+/).filter((k) => k.length > 2);
  // "startup" → ["startup"]

  const scoredPosts = posts.map((post) => {
    const titleMatches = (post.title.toLowerCase().match(/startup/g) || []).length;
    const contentMatches = (post.content.toLowerCase().match(/startup/g) || []).length;
    return { post, relevance: titleMatches * 3 + contentMatches };
  });

  return scoredPosts.filter((sp) => sp.relevance > 0) // ❌ MUST have keyword
    .sort((a, b) => b.relevance - a.relevance)
    .map((sp) => sp.post)
    .slice(0, limit);
}
```

**Problem Chain:**
1. Fetches from tags: `['discuss', 'help', 'watercooler', 'askdev', 'devjournal']`
2. Each tag returns 30 posts max → ~150 posts total
3. Filters for age <7 days → ~50-80 posts
4. Filters for content >100 chars → ~40-60 posts
5. **Searches for exact "startup" match → ~0-2 posts** ❌

**Why this fails:**
- "Startup" is generic - people say "building a product", "launching my SaaS", "indie project"
- Dev.to tags don't naturally contain "startup" keyword
- Content is often <100 chars in descriptions (need full body_markdown)

## Issue 2: Indie Hackers RSS Limitations

**Code:** `lib/indiehackers.ts` lines 131-163

```typescript
export async function searchIndieHackersPosts(keywords: string, limit: number = 30) {
  const posts = await fetchRecentIndieHackersPosts(limit * 2); // Fetch 20 posts from RSS

  // Same keyword matching problem
  return scoredPosts.filter((sp) => sp.relevance > 0) // ❌ MUST have keyword
    .slice(0, limit);
}
```

**Problem Chain:**
1. RSS feed only has ~25-30 recent posts total
2. Filters for age <7 days → ~15-20 posts
3. Filters for content >100 chars → ~10-15 posts
4. **Searches for exact "startup" match → ~0-1 posts** ❌

**Why this fails:**
- RSS feed is limited to most recent posts
- Same keyword matching problem
- IH posts often use "indie maker", "bootstrapping", "building in public" instead of "startup"

## Issue 3: HackerNews Works But Limited

**Code:** `lib/hackernews.ts` lines 76-144

HN actually works because:
1. Searches Ask HN stories (not comments)
2. Large pool of posts (~1000s)
3. "Startup" is commonly used on HN
4. Got lucky with 1 recent post

But still limited by:
- Only searches Ask HN (not Show HN, job posts, etc.)
- Keyword matching still required
- 7-day window might miss good posts

## The Math

For "startup" with current implementation:

| Source | Total Posts | <7 days | >100 chars | Has "startup" | Final Result |
|--------|-------------|---------|------------|---------------|--------------|
| Dev.to | ~150 | ~70 | ~50 | **~0** | 0 posts |
| IH     | ~25 | ~18 | ~12 | **~0** | 0 posts |
| HN     | ~5000 | ~300 | ~250 | **~3** | 1-3 posts |

**Result: Only 1-3 total posts across all sources**

## Why "Startup" Specifically Fails

Keywords that work well:
- "API" (very specific technical term)
- "authentication" (specific technical term)
- "deployment" (specific technical term)

Keywords that fail:
- "startup" (too generic, people use alternatives)
- "product" (too generic)
- "validation" (many alternatives: "testing", "feedback", "users")
- "marketing" (many alternatives: "growth", "distribution", "reach")

## Root Causes

1. **Semantic Gap**: User intent ≠ keyword matching
   - User wants: "problems with starting a business"
   - System finds: posts with literal word "startup"
   - Misses: "launching my SaaS", "building my first product", "getting initial customers"

2. **Tag-Based Fetching**: Dev.to tags don't align with pain point topics
   - Tags: discuss, help, watercooler
   - Better tags: startup, entrepreneur, indiehackers, business

3. **Content Truncation**: Dev.to `description` is often <100 chars
   - Need `body_markdown` but that's not fetched

4. **Time Window**: 7 days is too restrictive
   - Pain points are evergreen (recruiting problems exist for years)
   - Should be 14-30 days minimum

5. **RSS Limitations**: IH RSS has ~25 posts max
   - Need pagination or different endpoint

## Quick Wins to Get More Posts

### 1. Expand Time Window (Easy)
```typescript
const sevenDaysAgo = 14 * 24; // 14 days instead of 7
```

### 2. Lower Content Threshold (Easy)
```typescript
if (!post.content || post.content.length < 50) return false; // 50 instead of 100
```

### 3. Better Dev.to Tags (Easy)
```typescript
const tags = ['startup', 'entrepreneur', 'business', 'indiehackers', 'help'];
```

### 4. Fallback to Top Posts (Medium)
```typescript
// If keyword match returns 0, return top posts anyway
if (filteredPosts.length === 0) {
  return posts.slice(0, limit); // Return top scored posts
}
```

### 5. Semantic Keyword Expansion (Medium)
```typescript
const keywordExpansions = {
  'startup': ['startup', 'business', 'founder', 'entrepreneur', 'launching', 'indie'],
  'validation': ['validation', 'feedback', 'testing', 'users', 'customers'],
  // ...
};
```

## The Real Solution: Semantic Search

Replace exact keyword matching with:
1. Fetch more posts (50-100 per source)
2. Use Claude to score relevance (0-100) for each post
3. Return top 10 most relevant

This would:
- Find "building my SaaS" when searching "startup"
- Find "getting first customers" when searching "validation"
- Find "CI/CD pipeline" when searching "deployment"

Cost: ~$0.01 per search (acceptable for MVP)
