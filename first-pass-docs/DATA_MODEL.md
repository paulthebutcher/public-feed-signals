# Data Model: Reddit Problem Signal Miner

> **Derived from:** SCOPE.md workflow
> **Principle:** Only model what the one workflow touches. If the workflow doesn't read or write it, it doesn't exist yet.
> **Key decision:** MVP is stateless - no database. Data model documents conceptual entities for the response structure, not persisted tables.

---

## Entities

### PainPointCluster
_The grouped pain points returned in the report. This is the primary output structure._

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Generated UUID for frontend display |
| summary | string | yes | One-line description (e.g., "Email marketing tools are too expensive") |
| score | number | yes | 0-100 composite score (intensity + frequency + specificity) |
| intensity | number | yes | 0-100, how frustrated people are |
| frequency | number | yes | How many times this appears across posts |
| specificity | number | yes | How actionable/concrete vs vague |
| source_quotes | SourceQuote[] | yes | 2-3 supporting quotes |
| created_at | timestamp | yes | When this was extracted |

### SourceQuote
_Reddit posts/comments that support a pain point._

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| text | string | yes | The actual quote (50-200 chars) |
| reddit_url | string | yes | Full URL to the post/comment |
| subreddit | string | yes | Which sub it came from (r/Entrepreneur, etc.) |
| upvotes | number | no | Reddit upvote count (signal of validation) |
| posted_at | timestamp | yes | When the Reddit post was created |

### SearchRequest (ephemeral - not persisted)
_The input parameters. Exists only in-memory during processing._

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| keywords | string[] | no | User-provided topics. Empty = all posts. |
| subreddits | string[] | yes | Default: 5 curated subs |
| days_back | number | yes | Default: 7 |
| min_engagement | object | yes | { upvotes: 5, comments: 2 } |

---

## Relationships

```
PainPointCluster --< SourceQuote  (one-to-many)
```

Each pain point cluster has 2-3 supporting source quotes. That's the only relationship. Everything else is ephemeral.

---

## Auth & Access

- **Auth provider:** None - completely public this week
- **Row-level security:** N/A - no database, no persistence
- **Multi-tenancy:** Not applicable - stateless tool

**Rationale:** The workflow is "generate report" not "save my searches." Adding auth adds 2-3 hours of complexity (Clerk setup, redirect URLs, middleware) for zero MVP value. Anyone can visit the URL and generate a report. If we add saving/history later, we add auth then.

## Storage Decisions

- **Primary DB:** None - stateless API this week
- **File storage:** Not needed - reports are ephemeral (displayed in browser, user can copy markdown if they want to save)
- **Caching:** Optional - if scraping + extraction takes >3 minutes, cache SearchRequest results in memory (Node.js Map with TTL) to avoid re-processing identical requests within 1 hour

**Rationale for no DB:**
- The workflow doesn't require persistence - user gets instant report, no history
- Avoids 1-2 hours of Supabase setup, schema migrations, RLS policies
- Can always add Supabase next week if we want to add features like: save searches, compare over time, email digests

**If caching is needed (Wednesday spike):**
```typescript
// In-memory cache structure
interface CacheEntry {
  result: PainPointCluster[];
  created_at: timestamp;
  ttl: 3600; // 1 hour
}
const cache = new Map<string, CacheEntry>(); // key = hash(keywords + subreddits)
```

---

## What This Model Doesn't Cover (intentionally)

_List the entities you know you'd need eventually but are skipping this week. This prevents scope creep during the build — if you find yourself wanting to add a table, check this list first._

- ~~User accounts~~ — No auth, no user profiles. Anyone can use the tool anonymously.
- ~~Saved searches~~ — No search history, no "my reports" page. Reports are ephemeral.
- ~~Custom subreddits~~ — Hardcoded to 5 curated subs. Adding custom subs requires database to store user preferences.
- ~~Report versioning~~ — Can't compare "pain points this week vs last week." Would need to persist historical reports.
- ~~Billing/credits~~ — No payment tracking. If we add Gumroad week 2, it's external - no internal credit system.
- ~~Notification preferences~~ — No "email me weekly reports." Would require: users table, email queue, cron jobs.
- ~~Collaboration~~ — No "share this report with my cofounder." Could add shareable links later with reports table.
- ~~Analytics/usage tracking~~ — Not tracking "which pain points get clicked most." Could add events later if useful.
- ~~Rate limiting~~ — No per-user limits since no users. Could add IP-based rate limiting if abuse happens.
- ~~Reddit account integration~~ — Not fetching private/gated subreddits. Public RSS feeds only.
