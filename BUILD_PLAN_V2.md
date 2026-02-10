# Problem Signal Miner - Build Plan V2
**Created:** Tuesday Feb 10, 2026 7:30pm
**Target Ship:** Friday Feb 13, 2026 5pm
**Time Budget:** 3 days (~24 working hours)

---

## Current State Assessment

**✅ What Works:**
- Multi-source architecture (HN, Dev.to, IH)
- Claude Sonnet 4.5 extraction with 3-dimension scoring
- Clean UI with design system applied
- Vercel-ready deployment setup

**❌ What's Broken:**
- Only returning 1 pain point per search (vs expected 20-50)
- Dev.to and Indie Hackers returning 0 posts
- Exact keyword matching fails for semantic searches
- Silent error swallowing hides issues
- 7-day window too restrictive
- 100-char content minimum too high

**🎯 Core Problem:**
Searching "startup" returns 1 post because keyword matching is too restrictive. People say "building a SaaS" not "startup", "getting first customers" not "validation".

---

## Build Strategy

### Phase 1: Foundation Fixes (Wednesday)
**Goal:** Go from 1 → 40-50 pain points per search
**Time:** 8 hours

### Phase 2: Feature Expansion (Thursday)
**Goal:** Add differentiation features that make this genuinely useful
**Time:** 10 hours

### Phase 3: Polish & Ship (Friday)
**Goal:** Production-ready with landing page
**Time:** 6 hours

---

## PHASE 1: Foundation Fixes (Wednesday 8hrs)

### 1.1 Quick Data Fixes (2 hours)
**Priority:** P0 - Must have
**Files:** `lib/devto.ts`, `lib/indiehackers.ts`, `lib/hackernews.ts`

**Changes:**
```typescript
// Expand time window
const fourteenDaysAgo = 14 * 24; // Was: 7 * 24

// Lower content threshold
if (!post.content || post.content.length < 50) return false; // Was: 100

// Better Dev.to tags
const tags = ['startup', 'entrepreneur', 'business', 'showdev', 'discuss', 'help'];
// Was: ['discuss', 'help', 'watercooler', 'askdev', 'devjournal']

// Increase fetch limits
const postsPerSource = Math.ceil((limit * 3) / enabledSources.length);
// Fetch 3x requested, filter down
```

**Expected Impact:** 1 → 15-25 posts per search

**Test:**
```bash
# Should return 15-25 posts for "startup"
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"keywords": "startup", "sources": ["all"]}'
```

---

### 1.2 Semantic Relevance Scoring (3 hours)
**Priority:** P0 - Must have
**Files:** NEW `lib/relevance.ts`, `app/api/extract/route.ts`

**Implementation:**
```typescript
// lib/relevance.ts
import Anthropic from '@anthropic-ai/sdk';

export async function scoreRelevance(
  posts: Post[],
  keywords: string,
  topN: number = 30
): Promise<Post[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = `You are analyzing discussion posts for relevance to a search query.

Search query: "${keywords}"

Rate each post's relevance on a scale of 0-100:
- 0-30: Unrelated or tangentially related
- 31-60: Somewhat related, mentions topic indirectly
- 61-80: Related, discusses topic directly
- 81-100: Highly relevant, core focus is on this topic

Posts to rate:
${posts.map((p, i) => `
[${i}]
Title: ${p.title}
Content: ${p.content.substring(0, 300)}...
`).join('\n')}

Return ONLY a JSON array with this exact format:
[
  {"index": 0, "score": 75, "reason": "Discusses startup validation strategies"},
  {"index": 1, "score": 45, "reason": "Mentions startups but focuses on different topic"},
  ...
]`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  const textContent = message.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in response');
  }

  const scores = JSON.parse(jsonMatch[0]);

  // Return only posts scoring >60, sorted by relevance
  return posts
    .map((post, i) => ({
      post,
      score: scores.find((s: any) => s.index === i)?.score || 0
    }))
    .filter(({ score }) => score > 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ post }) => post);
}
```

**Integration:**
```typescript
// app/api/extract/route.ts
import { scoreRelevance } from '@/lib/relevance';

// After fetching posts
const posts = await searchMultipleSources(keywords.trim(), validSources, 90);

// NEW: Score relevance before extraction
const relevantPosts = await scoreRelevance(posts, keywords.trim(), 30);

// Extract from top 30 relevant posts
const results = await extractPainPoints(relevantPosts);
```

**Expected Impact:**
- Finds "building a SaaS" when searching "startup"
- Finds "getting first customers" when searching "validation"
- 15-25 → 40-50 high-quality posts

**Cost:** ~$0.01 per search (90 posts × 300 chars = 27k input tokens)

---

### 1.3 Reddit Source (2 hours)
**Priority:** P0 - Must have
**Files:** NEW `lib/reddit.ts`, `lib/sources.ts`, `lib/types.ts`

**Implementation:**
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

export async function searchRedditPosts(
  keywords: string,
  limit: number = 30
): Promise<RedditPost[]> {
  const subreddits = ['startups', 'Entrepreneur', 'SaaS', 'indiehackers', 'buildinpublic'];
  const allPosts: RedditPost[] = [];

  for (const sub of subreddits) {
    try {
      // Reddit RSS feeds don't require auth
      const url = `https://www.reddit.com/r/${sub}/search.rss?q=${encodeURIComponent(keywords)}&restrict_sr=1&sort=new&t=month&limit=100`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'ProblemSignalMiner/1.0' }
      });

      if (!response.ok) continue;

      const xmlText = await response.text();
      const posts = parseRedditRSS(xmlText, sub);
      allPosts.push(...posts);
    } catch (error) {
      console.error(`[Reddit] ${sub} failed:`, error);
      continue;
    }
  }

  // Filter for recency and length, dedupe by URL
  const fourteenDaysAgo = 14 * 24;
  return allPosts
    .filter(p => p.age_hours < fourteenDaysAgo && p.content.length > 50)
    .filter((p, i, arr) => arr.findIndex(x => x.url === p.url) === i)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function parseRedditRSS(xml: string, subreddit: string): RedditPost[] {
  // Similar to Indie Hackers RSS parsing
  const itemRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const posts: RedditPost[] = [];

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    // Extract title, link, content, author, published date
    // Parse HTML entities, extract score from content
    // ...
  }

  return posts;
}
```

**Update sources.ts:**
```typescript
import { searchRedditPosts } from './reddit';

// Add to DataSource type
export type DataSource = 'hackernews' | 'devto' | 'indiehackers' | 'reddit' | 'all';

// Add to searchMultipleSources
if (enabledSources.includes('reddit')) {
  promises.push(
    searchRedditPosts(keywords, postsPerSource)
      .then((posts) => posts.map(redditToPost))
      .catch((err) => {
        console.error('[Reddit] Error:', err.message);
        return [];
      })
  );
}
```

**Expected Impact:** +15-30 high-quality posts per search

---

### 1.4 Error Visibility & Debug Info (1 hour)
**Priority:** P1 - Should have
**Files:** `app/api/extract/route.ts`, `lib/sources.ts`

**Changes:**
```typescript
// lib/sources.ts - Track fetch results
export type SourceStats = {
  source: string;
  fetched: number;
  filtered: number;
  error?: string;
};

export async function searchMultipleSources(
  keywords: string,
  sources: DataSource[] = ['all'],
  limit: number = 20
): Promise<{ posts: Post[]; stats: SourceStats[] }> {
  // ... existing code ...

  const stats: SourceStats[] = [];

  if (enabledSources.includes('hackernews')) {
    promises.push(
      searchAskHNPosts(keywords, postsPerSource)
        .then((posts) => {
          stats.push({ source: 'hackernews', fetched: posts.length, filtered: posts.length });
          return posts.map(hnToPost);
        })
        .catch((err) => {
          stats.push({ source: 'hackernews', fetched: 0, filtered: 0, error: err.message });
          return [];
        })
    );
  }

  // ... repeat for other sources ...

  const results = await Promise.all(promises);
  const allPosts = results.flat();

  return {
    posts: allPosts.slice(0, limit),
    stats
  };
}

// API route - Return debug info
return NextResponse.json({
  pain_points: painPoints,
  sources_used: sourcesUsed,
  debug: {
    source_stats: stats,
    posts_after_relevance: relevantPosts.length,
    extraction_attempted: relevantPosts.length,
    extraction_succeeded: painPoints.length
  }
});
```

**Expected Impact:** Easier debugging, visibility into what's working/failing

---

## PHASE 2: Feature Expansion (Thursday 10hrs)

### 2.1 Pain Point Clustering (2 hours)
**Priority:** P1 - Should have
**Files:** NEW `lib/cluster.ts`, `app/api/extract/route.ts`

**Implementation:**
```typescript
// lib/cluster.ts
export type ClusteredPainPoint = ExtractionResult & {
  cluster_id: string;
  cluster_theme: string;
  mention_count: number;
  is_representative: boolean;
};

export async function clusterPainPoints(
  painPoints: ExtractionResult[]
): Promise<ClusteredPainPoint[]> {
  if (painPoints.length < 3) {
    // Not enough to cluster, return as-is
    return painPoints.map(pp => ({
      ...pp,
      cluster_id: pp.post_id.toString(),
      cluster_theme: pp.pain_point,
      mention_count: 1,
      is_representative: true
    }));
  }

  const prompt = `Group similar pain points into clusters.

Pain points:
${painPoints.map((p, i) => `[${i}] ${p.pain_point} (score: ${p.composite_score})`).join('\n')}

Return JSON:
[
  {
    "theme": "Customer acquisition challenges",
    "indices": [0, 3, 7],
    "representative_index": 0
  }
]

Rules:
- Max 5 clusters
- Each cluster needs 2+ similar pain points
- Representative should be highest scoring or most specific
`;

  // Call Claude to cluster
  // Return deduplicated list with mention_count
}
```

**UI Updates:**
- Show "🔥 Mentioned 3x" badge on clustered pain points
- Collapse duplicates, show expansion UI

**Expected Impact:** 40 extractions → 15-20 unique themes

---

### 2.2 Historical Tracking (3 hours)
**Priority:** P1 - Should have
**Files:** NEW `lib/db.ts`, NEW `app/api/history/route.ts`, NEW `app/history/page.tsx`

**Implementation:**
```typescript
// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'signals.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keywords TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    sources_used TEXT NOT NULL,
    total_posts INTEGER,
    pain_points_found INTEGER,
    processing_time_ms INTEGER
  );

  CREATE TABLE IF NOT EXISTS pain_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id INTEGER NOT NULL,
    pain_point TEXT NOT NULL,
    composite_score REAL NOT NULL,
    intensity INTEGER,
    specificity INTEGER,
    frequency INTEGER,
    post_url TEXT,
    post_source TEXT,
    post_title TEXT,
    extracted_at INTEGER NOT NULL,
    FOREIGN KEY (search_id) REFERENCES searches(id)
  );

  CREATE INDEX IF NOT EXISTS idx_searches_keywords ON searches(keywords);
  CREATE INDEX IF NOT EXISTS idx_pain_points_search ON pain_points(search_id);
  CREATE INDEX IF NOT EXISTS idx_pain_points_extracted ON pain_points(extracted_at);
`);

export function saveSearch(/* ... */) { /* ... */ }
export function getSearchHistory(limit = 20) { /* ... */ }
export function getTrends(keywords: string, days = 30) { /* ... */ }
```

**UI:**
- `/history` page showing recent searches
- Click to re-run search
- Line chart showing pain point frequency over time

---

### 2.3 Export & Sharing (2 hours)
**Priority:** P2 - Nice to have
**Files:** NEW `app/api/export/route.ts`, `app/page.tsx`

**Implementation:**
```typescript
// CSV export
export async function POST(request: NextRequest) {
  const { pain_points, format } = await request.json();

  if (format === 'csv') {
    const csv = generateCSV(pain_points);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="pain-points.csv"'
      }
    });
  }

  // JSON export
  return NextResponse.json(pain_points);
}

// Add UI buttons:
// - 📥 Export CSV
// - 📋 Copy JSON
// - 🔗 Share URL (encode search params)
```

---

### 2.4 Additional Sources (3 hours)
**Priority:** P2 - Nice to have
**Files:** NEW `lib/github.ts`, NEW `lib/stackoverflow.ts`

**GitHub Issues:**
```typescript
export async function searchGitHubIssues(
  keywords: string,
  limit: number = 20
): Promise<GitHubIssue[]> {
  const query = `${keywords} is:issue is:open sort:comments-desc`;
  const response = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=${limit}`,
    { headers: { 'Accept': 'application/vnd.github.v3+json' } }
  );
  // Parse response, filter for bugs/feature requests
}
```

**Stack Overflow:**
```typescript
export async function searchStackOverflow(
  keywords: string,
  limit: number = 20
): Promise<SOQuestion[]> {
  const response = await fetch(
    `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${keywords}&site=stackoverflow`
  );
  // Parse questions with high votes, no accepted answer
}
```

**Expected Impact:** +10-20 technical pain points from GitHub/SO

---

## PHASE 3: Polish & Ship (Friday 6hrs)

### 3.1 Landing Page (2 hours)
**Priority:** P0 - Must have
**Files:** `app/page.tsx`

**Content:**
- Hero: "Find Real Market Needs in Minutes, Not Months"
- Value props:
  - 🎯 7 data sources (HN, Reddit, Dev.to, IH, GitHub, SO, Twitter)
  - 🧠 AI-powered semantic search
  - 📊 Historical trends & clustering
  - 📥 Export to CSV/JSON
- Use cases:
  - Indie makers: Validate ideas before building
  - VCs: Scout emerging problem spaces
  - PMs: Prioritize roadmap with real user pain
- Example searches with cached results
- Social proof: "Analyzed 2,347 discussions this week"

---

### 3.2 Performance & Caching (2 hours)
**Priority:** P1 - Should have
**Files:** NEW `lib/cache.ts`, `app/api/extract/route.ts`

**Implementation:**
```typescript
// In-memory cache with TTL (upgrade to Redis later)
const cache = new Map<string, { data: any; expires: number }>();

export function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: any, ttl = 3600) {
  cache.set(key, { data, expires: Date.now() + ttl * 1000 });
}

// In API route:
const cacheKey = `search:${keywords}:${sources.join(',')}`;
const cached = getCached(cacheKey);
if (cached) return NextResponse.json(cached);

// ... do work ...
setCache(cacheKey, results, 3600); // 1 hour
```

**Expected Impact:** 60% cache hit rate → ~$0.018 per search

---

### 3.3 Deployment & Monitoring (1 hour)
**Priority:** P0 - Must have
**Files:** `vercel.json`, `.env.production`

**Tasks:**
- Deploy to Vercel
- Set up environment variables
- Configure custom domain
- Add basic analytics (Vercel Analytics or Plausible)
- Set up error tracking (Sentry)

---

### 3.4 Testing & Bug Fixes (1 hour)
**Priority:** P0 - Must have

**Test scenarios:**
- [ ] Search "startup" returns 40+ posts
- [ ] Search "AI coding" returns 30+ posts
- [ ] All 4+ sources return data
- [ ] Clustering works correctly
- [ ] Export CSV downloads
- [ ] Historical tracking saves
- [ ] Error states display correctly
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Cache works (2nd search instant)

---

## Success Criteria

**By Friday 5pm:**

✅ **Quality Metrics:**
- 40-50 pain points per search (vs 1 today)
- <5% duplicates after clustering
- <10s search time (cached <1s)
- 4+ sources working (HN, Dev.to, IH, Reddit minimum)

✅ **Features:**
- Semantic relevance scoring
- Pain point clustering
- Historical tracking
- CSV export
- Production deployed

✅ **Ship-ready:**
- Landing page live
- Custom domain
- Monitoring enabled
- Shared on Twitter/HN

---

## Risk Mitigation

**If behind schedule:**

**Wednesday EOD:** Must have 1.1, 1.2, 1.3 done (quick fixes + semantic search + Reddit)
- Can skip: 1.4 (error visibility)

**Thursday EOD:** Must have 2.1 done (clustering)
- Can skip: 2.2 (historical), 2.3 (export), 2.4 (GitHub/SO)

**Friday:** Focus on 3.1, 3.3, 3.4 (landing, deploy, test)
- Can skip: 3.2 (caching)

**Minimum viable ship:**
- Semantic search working (40+ posts)
- Reddit + existing sources
- Basic clustering
- Landing page
- Deployed

---

## Cost Analysis

**Per search (with all features):**
- Relevance scoring: $0.01 (90 posts × 300 chars)
- Extraction: $0.03 (30 posts × 1k chars × 2 API calls)
- Clustering: $0.005 (30 pain points)
- **Total: $0.045**

**With 60% cache hit rate:**
- Effective cost: **$0.018 per search**

**Monthly (1000 searches):**
- Cost: **$18/mo** (very affordable)

---

## File Structure

```
/build/2-9-26/
├── app/
│   ├── api/
│   │   ├── extract/route.ts       # [MODIFY] Add relevance scoring
│   │   ├── export/route.ts        # [NEW] CSV/JSON export
│   │   └── history/route.ts       # [NEW] Search history
│   ├── history/
│   │   └── page.tsx               # [NEW] Historical view
│   ├── page.tsx                   # [MODIFY] Landing page
│   └── layout.tsx                 # [OK] Already updated
├── lib/
│   ├── hackernews.ts              # [MODIFY] Quick fixes
│   ├── devto.ts                   # [MODIFY] Quick fixes
│   ├── indiehackers.ts            # [MODIFY] Quick fixes
│   ├── reddit.ts                  # [NEW] Reddit source
│   ├── github.ts                  # [NEW] GitHub issues
│   ├── stackoverflow.ts           # [NEW] Stack Overflow
│   ├── sources.ts                 # [MODIFY] Add Reddit, stats
│   ├── relevance.ts               # [NEW] Semantic scoring
│   ├── cluster.ts                 # [NEW] Pain point clustering
│   ├── db.ts                      # [NEW] SQLite tracking
│   ├── cache.ts                   # [NEW] In-memory cache
│   └── types.ts                   # [MODIFY] Add Reddit type
├── first-pass-docs/               # [OK] Archived
├── second-pass-docs/              # [OK] Analysis docs
└── BUILD_PLAN_V2.md              # [THIS FILE]
```

---

## Implementation Order

**Wednesday (8 hours):**
1. Quick data fixes (2h) - All 3 sources
2. Semantic relevance (3h) - Core feature
3. Reddit source (2h) - 4th data source
4. Error visibility (1h) - Debug tooling

**Thursday (10 hours):**
5. Pain point clustering (2h)
6. Historical tracking (3h)
7. Export CSV/JSON (2h)
8. GitHub + Stack Overflow (3h)

**Friday (6 hours):**
9. Landing page (2h)
10. Performance & caching (2h)
11. Deploy to Vercel (1h)
12. Testing & fixes (1h)

---

## Next Steps

**Immediate (Tonight):**
- Review this plan
- Decide on any scope changes
- Prepare test queries for validation

**Wednesday 9am:**
- Start with 1.1 (quick fixes)
- Test each change incrementally
- Commit after each working feature

Ready to build?
