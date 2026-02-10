# Data Fetching Diagnosis

## Issue Summary
Search for "startup" returned only 1 pain point with 100% extraction rate, suggesting only 1 post was fetched total. Only HackerNews source was used.

## Root Causes

### 1. **Silent Failures from Dev.to and Indie Hackers**
```typescript
// sources.ts lines 87-100
promises.push(
  searchDevToPosts(keywords, postsPerSource)
    .then((posts) => posts.map(devtoToPost))
    .catch(() => [])  // ❌ Silently swallows all errors
);
```

**Problem:** Error handling with `.catch(() => [])` hides failures. Could be:
- Network errors
- API rate limits
- RSS parsing failures
- Timeout issues

### 2. **Aggressive Keyword Filtering**

#### Dev.to (devto.ts lines 105-134)
- Fetches from 5 tags: `['discuss', 'help', 'watercooler', 'askdev', 'devjournal']`
- Filters for posts <7 days old with >100 chars content
- Then does keyword matching requiring at least 1 match
- For "startup" search, if no recent Dev.to posts in those tags contain "startup", returns `[]`

#### Indie Hackers (indiehackers.ts lines 131-163)
- Parses RSS feed (limited to ~20-30 recent posts)
- Filters for posts <7 days old with >100 chars content
- Then keyword matching requiring at least 1 match
- RSS feed might not have posts matching "startup" in last 7 days

### 3. **HackerNews Likely Low Results**
- Search for "startup" on Ask HN might genuinely return few posts
- HN API searches Ask HN posts, not all posts
- "startup" is a broad term that might not appear in many Ask HN titles

## Data Flow Analysis

**For search "startup" with limit=30:**
```
searchMultipleSources('startup', ['all'], 30)
  ├─ postsPerSource = 30/3 = 10 per source
  │
  ├─ searchAskHNPosts('startup', 10)
  │    └─ Returns: ~1 post matching "startup" ✅
  │
  ├─ searchDevToPosts('startup', 10)
  │    ├─ fetchRecentDevToPosts(20) from 5 tags
  │    ├─ Filter: age<7days, content>100 chars
  │    └─ Keyword match: "startup" found 0 times ❌ → returns []
  │
  └─ searchIndieHackersPosts('startup', 10)
       ├─ fetchIndieHackersRSS() → ~25 posts
       ├─ Filter: age<7days, content>100 chars → ~10 posts
       └─ Keyword match: "startup" found 0 times ❌ → returns []

Combined: 1 HN post only
Extraction: 1/1 = 100%
Sources used: ['hackernews'] only
```

## Impact on Results

**Previous spike:**
- Mock Reddit: 55% extraction (11/20 posts)
- Real HN: 52.2% extraction (12/23 posts)

**Current search:**
- Real Multi-source: 100% extraction (1/1 post) ❌
- **Appears worse because only 1 post was actually fetched**

## Recommended Fixes (Not Applied)

1. **Add debug logging** - Log posts fetched from each source
2. **Expose errors** - Return error info in API response instead of silent catch
3. **Relax 7-day filter** - Expand to 14-30 days for more posts
4. **Fallback to no-keyword** - If keyword match returns 0, return top posts anyway
5. **Increase per-source limits** - Fetch more posts per source before filtering
6. **Better keyword matching** - Use stemming, synonyms, or semantic similarity

## Why This Matters

The multi-source feature is working **mechanically** but not **practically**:
- ✅ Code integrates 3 sources correctly
- ✅ API properly merges results
- ✅ Frontend displays source badges
- ❌ Dev.to and IH return 0 posts for most searches
- ❌ Appears to user like only HN is working
- ❌ Silent failures make debugging impossible
