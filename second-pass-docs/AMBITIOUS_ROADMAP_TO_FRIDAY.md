# Problem Signal Miner: Ambitious Friday Ship Plan

**Current State:** MVP built in 2 hours (Tue 12pm)
**Target:** Production-ready product by Friday 5pm
**Time Available:** ~3 days (~24 working hours)
**Goal:** Ship something people actually want to use

---

## Core Problem to Solve

**Current MVP extracts 1 pain point. Needs to extract 20-50 high-quality pain points per search.**

We have 3 days to go from "interesting demo" → "genuinely useful product"

---

## 🔥 TIER 1: Critical Fixes (8 hours - Ship by Wed EOD)

### 1.1 Fix Data Fetching (2 hours)

**Problem:** Only getting 1 post for "startup" because:
- 7-day window too narrow
- 100-char content minimum too high
- Wrong Dev.to tags
- Keyword matching too strict

**Solution:**
```typescript
// lib/devto.ts
const tags = ['startup', 'entrepreneur', 'business', 'showdev', 'discuss', 'help'];
const fourteenDaysAgo = 14 * 24; // Expand to 14 days
if (!post.content || post.content.length < 50) return false; // Lower to 50 chars

// lib/indiehackers.ts
const fourteenDaysAgo = 14 * 24;
if (!post.content || post.content.length < 50) return false;

// lib/sources.ts - Increase fetch limits
const postsPerSource = Math.ceil((limit * 3) / enabledSources.length); // Fetch 3x, filter down
```

**Expected Result:** 10-30 posts per search instead of 1

---

### 1.2 Add Semantic Relevance Scoring (3 hours)

**Problem:** Keyword matching misses "building a SaaS" when searching "startup"

**Solution:** Use Claude to score post relevance BEFORE extraction

```typescript
// lib/relevance.ts
export async function scoreRelevance(posts: Post[], keywords: string): Promise<Post[]> {
  const prompt = `Rate each post's relevance to the search: "${keywords}"

Score 0-100 where:
- 0 = completely unrelated
- 50 = tangentially related
- 100 = directly addresses the topic

Posts:
${posts.map((p, i) => `${i}. ${p.title}\n${p.content.substring(0, 200)}`).join('\n\n')}

Return JSON: [{"index": 0, "score": 85, "reason": "..."}, ...]`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const scores = JSON.parse(extractJSON(response.content));

  // Return only posts scoring >60
  return posts
    .map((post, i) => ({ post, score: scores.find(s => s.index === i)?.score || 0 }))
    .filter(({ score }) => score > 60)
    .sort((a, b) => b.score - a.score)
    .map(({ post }) => post);
}

// app/api/extract/route.ts
const posts = await searchMultipleSources(keywords.trim(), validSources, 50);
const relevantPosts = await scoreRelevance(posts, keywords.trim()); // Add this
const results = await extractPainPoints(relevantPosts.slice(0, 30));
```

**Cost:** ~$0.005 per search (50 posts × 200 chars = 10k tokens × $3/M tokens)
**Expected Result:** Find "launching my product" when searching "startup validation"

---

### 1.3 Better Error Handling & Visibility (1 hour)

**Problem:** Silent failures hide issues

**Solution:**
```typescript
// lib/sources.ts - Log errors instead of swallowing
promises.push(
  searchDevToPosts(keywords, postsPerSource)
    .then((posts) => posts.map(devtoToPost))
    .catch((err) => {
      console.error('[Dev.to] Error:', err.message);
      return []; // Still return empty, but log it
    })
);

// app/api/extract/route.ts - Return debug info
return NextResponse.json({
  pain_points: painPoints,
  sources_used: sourcesUsed,
  debug: {
    posts_fetched: { hn: hnCount, devto: devtoCount, ih: ihCount },
    posts_filtered: relevantPosts.length,
    extraction_attempted: relevantPosts.length,
  }
});
```

---

### 1.4 Add Reddit via Unofficial API (2 hours)

**Problem:** Reddit has best pain points but official API requires approval

**Solution:** Use Pushshift API (still works for search) or scrape via RSS

```typescript
// lib/reddit.ts
export async function searchRedditPosts(keywords: string, limit: number = 30): Promise<RedditPost[]> {
  // Option 1: Reddit RSS (no auth needed)
  const subreddits = ['startups', 'Entrepreneur', 'SaaS', 'indiehackers'];
  const posts: RedditPost[] = [];

  for (const sub of subreddits) {
    const url = `https://www.reddit.com/r/${sub}/search.rss?q=${encodeURIComponent(keywords)}&restrict_sr=1&sort=new&t=month`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ProblemSignalMiner/1.0' }
    });
    const xml = await response.text();
    // Parse RSS similar to Indie Hackers
  }

  return posts;
}
```

**Alternative:** Use libreddit instances or teddit for JSON responses

**Expected Result:** +15-30 posts per search from Reddit

---

## 🚀 TIER 2: High-Impact Features (10 hours - Ship by Thu EOD)

### 2.1 Pain Point Clustering & Deduplication (2 hours)

**Problem:** Extract 30 pain points, 10 are duplicates ("finding first customers" × 10)

**Solution:**
```typescript
// lib/cluster.ts
export async function clusterPainPoints(painPoints: ExtractionResult[]): Promise<ClusteredPainPoint[]> {
  const prompt = `Group these pain points into clusters of similar problems.

Pain points:
${painPoints.map((p, i) => `${i}. ${p.pain_point}`).join('\n')}

Return JSON with clusters:
[
  {
    "theme": "Customer acquisition",
    "pain_point_indices": [0, 3, 7],
    "representative_index": 0,
    "count": 3
  }
]`;

  // Use Claude to cluster
  // Return deduplicated list with "mentioned X times" count
}
```

**Expected Result:** 30 extractions → 12 unique pain points with frequency counts

---

### 2.2 Historical Tracking & Trends (3 hours)

**Problem:** Can't see if "AI coding tools" pain points are increasing over time

**Solution:** Add SQLite database

```typescript
// lib/db.ts
import Database from 'better-sqlite3';

const db = new Database('./data/signals.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY,
    keywords TEXT,
    timestamp INTEGER,
    sources_used TEXT
  );

  CREATE TABLE IF NOT EXISTS pain_points (
    id INTEGER PRIMARY KEY,
    search_id INTEGER,
    pain_point TEXT,
    composite_score REAL,
    post_url TEXT,
    post_source TEXT,
    extracted_at INTEGER,
    FOREIGN KEY (search_id) REFERENCES searches(id)
  );
`);

export function saveSearch(keywords: string, painPoints: ExtractionResult[], sources: string[]) {
  const searchId = db.prepare('INSERT INTO searches (keywords, timestamp, sources_used) VALUES (?, ?, ?)')
    .run(keywords, Date.now(), JSON.stringify(sources)).lastInsertRowid;

  for (const pp of painPoints) {
    db.prepare('INSERT INTO pain_points (search_id, pain_point, composite_score, post_url, post_source, extracted_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(searchId, pp.pain_point, pp.composite_score, pp.post_url, pp.post_source, Date.now());
  }
}

export function getTrends(keywords: string, days: number = 30) {
  // Return time series of pain point frequency
  return db.prepare(`
    SELECT DATE(extracted_at/1000, 'unixepoch') as date, COUNT(*) as count
    FROM pain_points pp
    JOIN searches s ON pp.search_id = s.id
    WHERE s.keywords = ? AND pp.extracted_at > ?
    GROUP BY date
    ORDER BY date
  `).all(keywords, Date.now() - days * 24 * 60 * 60 * 1000);
}
```

**New UI:**
- "Previous searches" dropdown
- "Trending" badge on pain points appearing >3x in last week
- Line chart showing pain point frequency over time

---

### 2.3 Export & Bookmarking (2 hours)

**Problem:** Can't save or share results

**Solution:**
```typescript
// app/api/export/route.ts
export async function POST(request: NextRequest) {
  const { pain_points, format } = await request.json();

  if (format === 'csv') {
    const csv = [
      'Rank,Score,Pain Point,Intensity,Specificity,Frequency,Source,URL',
      ...pain_points.map((pp, i) =>
        `${i+1},${pp.composite_score},"${pp.pain_point}",${pp.intensity},${pp.specificity},${pp.frequency},${pp.post_source},${pp.post_url}`
      )
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="pain-points.csv"'
      }
    });
  }

  // JSON format
  return NextResponse.json(pain_points);
}

// Add bookmark feature with localStorage
// UI: "⭐ Bookmark" button on each pain point
// Page: /bookmarks shows all saved pain points
```

---

### 2.4 Better Data Sources (3 hours)

**Add 3 new sources:**

**GitHub Issues:**
```typescript
// lib/github.ts
export async function searchGitHubIssues(keywords: string, limit: number = 20): Promise<GitHubIssue[]> {
  const query = `${keywords} is:issue is:open label:bug,enhancement sort:comments-desc`;
  const response = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=${limit}`,
    { headers: { 'Accept': 'application/vnd.github.v3+json' } }
  );
  return response.json();
}
```

**Stack Overflow:**
```typescript
// lib/stackoverflow.ts
export async function searchStackOverflow(keywords: string, limit: number = 20): Promise<SOQuestion[]> {
  const response = await fetch(
    `https://api.stackexchange.com/2.3/search?order=desc&sort=votes&tagged=${keywords}&site=stackoverflow&pagesize=${limit}`
  );
  return response.json();
}
```

**Twitter/X (via nitter):**
```typescript
// lib/twitter.ts
export async function searchTwitter(keywords: string, limit: number = 20): Promise<Tweet[]> {
  // Use nitter.net RSS feed (unofficial but works)
  const url = `https://nitter.net/search?f=tweets&q=${encodeURIComponent(keywords)}&since=7d`;
  // Scrape or parse RSS
}
```

---

## ⚡ TIER 3: Differentiation (6 hours - Ship Friday AM)

### 3.1 Pain Point Validation Scoring (2 hours)

**Problem:** Some pain points are outdated or already solved

**Solution:** Add validation dimensions

```typescript
// Add to extraction prompt:
- recency_score: Is this still a current problem? (0-100)
- solution_exists: Are there existing solutions? (yes/no/partial)
- market_size: How many people likely have this problem? (small/medium/large)

// Show in UI with badges:
// 🔥 Recent (recency > 80)
// ⚠️ Solved (solution_exists = yes)
// 📊 Common (market_size = large)
```

---

### 3.2 Competitive Analysis (2 hours)

**Problem:** Found a pain point, but what solutions already exist?

**Solution:** Auto-search for solutions

```typescript
// lib/solutions.ts
export async function findSolutions(painPoint: string): Promise<Solution[]> {
  // Search pattern: "[pain point] solution" OR "[pain point] tool" OR "[pain point] software"
  const queries = [
    `${painPoint} solution`,
    `${painPoint} tool`,
    `${painPoint} software`,
    `how to solve ${painPoint}`
  ];

  // Use web search or ProductHunt API
  // Return top 3 existing solutions
}

// UI: Expandable section on each pain point card
// "💡 Existing Solutions (3)"
//   - Tool A ($29/mo) - 1.2k users
//   - Tool B (Free) - 500 users
//   - DIY Guide - 50k views
```

---

### 3.3 Email Alerts (2 hours)

**Problem:** Want to monitor "AI coding" pain points over time

**Solution:** Saved searches with email notifications

```typescript
// lib/alerts.ts
import nodemailer from 'nodemailer';

export async function checkAlerts() {
  // Run every 24 hours (cron job)
  const alerts = db.prepare('SELECT * FROM alerts WHERE active = 1').all();

  for (const alert of alerts) {
    const results = await searchAndExtract(alert.keywords);
    const newPainPoints = results.pain_points.filter(pp =>
      pp.composite_score > alert.min_score &&
      !db.prepare('SELECT 1 FROM pain_points WHERE pain_point = ?').get(pp.pain_point)
    );

    if (newPainPoints.length > 0) {
      await sendEmail(alert.email, alert.keywords, newPainPoints);
    }
  }
}

// UI: "🔔 Set Alert" button
// Form: Email, keywords, min score threshold
```

---

## 🎯 TIER 4: Polish & Ship (2 hours - Friday PM)

### 4.1 Landing Page & Marketing (1 hour)

**Add to home page:**
- Value prop: "Find unmet market needs in minutes, not months"
- Use cases:
  - Indie makers: Find product ideas
  - VCs: Scout emerging problems
  - Product managers: Validate roadmap priorities
  - Researchers: Track problem spaces
- Social proof: "Analyzed 1,247 discussions this week"
- Example searches with cached results

---

### 4.2 Performance & Caching (30 min)

```typescript
// Add Redis caching for searches
import { Redis } from '@upstash/redis';

const redis = new Redis({ url: process.env.UPSTASH_URL });

// Cache searches for 1 hour
const cacheKey = `search:${keywords}:${sources.join(',')}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

// ... do extraction ...
await redis.set(cacheKey, results, { ex: 3600 });
```

---

### 4.3 Analytics & Monitoring (30 min)

```typescript
// Track usage
await analytics.track({
  event: 'search_completed',
  properties: {
    keywords,
    sources_used: sourcesUsed,
    pain_points_found: painPoints.length,
    processing_time_ms: processingTime
  }
});

// Add error tracking
import * as Sentry from '@sentry/nextjs';
Sentry.captureException(error);
```

---

## 📊 Success Metrics

**By Friday, we should have:**

1. **Quality:**
   - ✅ 20-50 pain points per search (vs 1 today)
   - ✅ <5% duplicates (clustering works)
   - ✅ 60%+ user-rated "useful" (add thumbs up/down)

2. **Features:**
   - ✅ 5+ data sources (HN, Dev.to, IH, Reddit, GitHub)
   - ✅ Semantic search (finds related posts)
   - ✅ Export to CSV
   - ✅ Historical tracking

3. **Performance:**
   - ✅ <10s search time
   - ✅ Caching for common searches
   - ✅ Error rate <5%

4. **Ship-ready:**
   - ✅ Deploy to Vercel
   - ✅ Custom domain
   - ✅ Landing page
   - ✅ Share on Twitter/HN

---

## Implementation Priority

**Wednesday:**
- 9am-12pm: Fix data fetching (T1.1)
- 12pm-3pm: Semantic relevance (T1.2)
- 3pm-5pm: Reddit source (T1.4)
- 5pm-6pm: Error handling (T1.3)

**Thursday:**
- 9am-11am: Clustering (T2.1)
- 11am-2pm: Historical tracking (T2.2)
- 2pm-4pm: Export & bookmarks (T2.3)
- 4pm-7pm: New sources (T2.4)

**Friday:**
- 9am-11am: Validation scoring (T3.1)
- 11am-1pm: Competitive analysis (T3.2)
- 1pm-2pm: Performance (T4.2)
- 2pm-3pm: Landing page (T4.1)
- 3pm-5pm: Testing & deployment

---

## Ambitious Moonshot Features (Future)

If we finish early or post-Friday:

1. **Chrome Extension** - Right-click any discussion → "Extract pain points"
2. **Public API** - Let developers build on top
3. **Pain Point Database** - Searchable archive of all extracted pain points
4. **AI Solution Generator** - "Here's how you could solve this..." (using Claude)
5. **Slack/Discord Bot** - Monitor channels for pain points
6. **Integration with Linear/Notion** - Auto-create product tickets
7. **Trend Predictions** - "AI coding pain points up 40% this month"
8. **Community Voting** - Let users upvote most important pain points

---

## Cost Estimates

**Current (per search):**
- Extraction: $0.03 (30 posts × 1k chars × $3/MTok × 2 calls)

**With improvements (per search):**
- Relevance scoring: $0.01 (50 posts × 200 chars)
- Extraction: $0.03 (30 posts)
- Clustering: $0.005 (30 pain points)
- **Total: ~$0.045 per search**

**With caching:**
- Common searches cached for 1hr
- Expected cache hit rate: 60%
- Effective cost: **$0.018 per search**

**Monthly estimates (1000 searches):**
- Without caching: $45/mo
- With caching: $18/mo
- **Very affordable for MVP**

---

## What Makes This Ambitious?

1. **Going from 1 → 50 pain points** (50x improvement)
2. **5+ data sources** (currently 3, only 1 works)
3. **Semantic search** (massive quality upgrade)
4. **Historical tracking** (differentiation vs competitors)
5. **Competitive analysis** (unique insight)
6. **Ship to production** (not just a demo)

This is a **real product** people would pay for, not just an interesting experiment.
