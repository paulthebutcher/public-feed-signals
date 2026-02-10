# Build Plan: Reddit Problem Signal Miner

> **Build window:** Tuesday Feb 10 → Friday Feb 13, 2026
> **Deploy target:** `reddit-signals.theaiethos.com`
> **Repo:** `github.com/paulthebutcher/reddit-signals`

---

## Risk Stack

_Ordered by "if this doesn't work, nothing else matters." Build in this order._

### 🔴 Risk 1: Pain Point Extraction Quality
**What:** Claude needs to reliably extract actionable pain points from noisy Reddit threads (titles + top comments), distinguish real complaints from jokes/memes, and score them meaningfully (intensity, specificity).

**Why it's risky:**
- Reddit is 80% noise (memes, off-topic, sarcasm)
- Prompt engineering is unpredictable - might need 5-10 iterations to get acceptable quality
- "Actionable pain point" is subjective - hard to define programmatically
- If accuracy <60%, tool is worthless (fails success criteria)

**Spike plan** (Tuesday AM, 2 hours):
1. Manually scrape 20 recent posts from r/Entrepreneur via RSS
2. Write Claude prompt to extract pain points with scoring
3. Run extraction on all 20 posts
4. Manually review results: count true positives (real pain points) vs false positives (noise)
5. Iterate prompt 3-4 times to improve accuracy

**Pass/fail:** If we can achieve 12+/20 true positives (60% accuracy) after 4 prompt iterations, we're good. If still <60% after 4 iterations, either: (a) simplify extraction (remove scoring, just extract quotes), or (b) kill the project.

### 🟡 Risk 2: RSS Feed Data Volume & Reliability
**What:** Reddit RSS feeds need to provide enough recent posts (20+ per subreddit) to extract patterns. Unclear if RSS feeds work consistently or if Reddit throttles them.

**Why it's risky:**
- RSS might only return 5-10 posts per sub (not enough for pattern detection)
- RSS might be delayed (12-24 hours old = stale signals)
- Reddit could block RSS access if we scrape too aggressively
- If RSS doesn't work, fallback is PRAW (free tier API) which adds complexity

**Mitigation:** Test RSS feeds for all 5 subreddits Tuesday morning during Risk 1 spike. Check: post count, recency, reliability. If RSS is insufficient, immediately pivot to PRAW free tier (10K requests/month = ~60 posts/day, enough for MVP).

**Pass/fail:** If RSS returns 15+ posts per subreddit from last 7 days, we're good. If <10 posts/sub, add PRAW as backup source.

### 🟢 Risk 3: Processing Speed (<3 minutes)
**What:** Full workflow (scrape 5 subs via RSS → filter posts → Claude extraction on 50-100 posts → group into clusters) must complete in under 3 minutes.

**Notes:**
- Claude API streaming can help perceived speed (show results as they arrive)
- Parallel processing: scrape all 5 RSS feeds simultaneously
- If too slow: add in-memory caching (1-hour TTL) for repeated keyword searches
- This is lower risk because it's an optimization problem, not a "does it work at all" problem

---

## Build Sequence

_Daily targets. These are commitments, not aspirations. If Tuesday's target isn't met, Wednesday's plan changes._

### Tuesday: Prove the hard part
- [ ] **SPIKE: Risk 1 & 2 by noon** — Test extraction quality (60%+ accuracy) + RSS feed viability (15+ posts/sub)
- [ ] If pass: Scaffold Next.js project (App Router, TypeScript, Tailwind)
- [ ] If extraction <60%: Iterate prompt OR simplify to "just extract quotes, skip scoring"
- [ ] If RSS fails: Integrate PRAW free tier as fallback
- [ ] Create basic API route: `/api/extract` that accepts keywords, returns mock data
- [ ] Simple form UI: keyword input + submit button
- **End of day:** Extraction spike complete with proven accuracy + Next.js scaffold running locally. Can submit form and see mock response.

### Wednesday: Core workflow end-to-end
- [ ] RSS scraping function: fetch last 7 days from 5 subreddits, parse XML
- [ ] Filtering logic: min engagement (5 upvotes, 2 comments), keyword matching if provided
- [ ] Claude integration: send filtered posts → get back pain point clusters with scores
- [ ] Display results: Render markdown report in browser (clusters ranked by score, source quotes with URLs)
- [ ] Error handling: Show friendly error if scraping fails or Claude times out
- **End of day:** Can enter keywords → get real extraction results → see ranked pain points with Reddit links. Workflow works end-to-end but ugly/slow is fine.

### Thursday: Optimize & polish
- [ ] Performance: Parallel RSS fetching, streaming Claude responses, or add caching if >3 min
- [ ] Landing page: Explain what it does, show example output, "Try it" CTA
- [ ] UX improvements: Loading states, empty state (no results), copy markdown button
- [ ] Edge cases: No keywords provided (use defaults), zero results (better message), malformed RSS (graceful degradation)
- [ ] Manual QA: Test all 5 subreddits individually, test with different keywords
- **End of day:** Tool is fast enough (<3 min), stranger can understand and use it, handles errors gracefully.

### Friday morning: Ship
- [ ] Deploy to Vercel: `reddit-signals.theaiethos.com`
- [ ] Verify deployment checklist: Custom domain, env vars (ANTHROPIC_API_KEY), smoke test production
- [ ] Smoke test: Fresh incognito browser, visit URL, run extraction with "SaaS pricing", verify results load
- [ ] Screenshot final output for documentation
- [ ] Use it ourselves: Generate a report for next Monday's research, confirm it's actually useful
- [ ] Fill out RETRO.md by EOD

---

## Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | Default. Server components for RSS scraping, API routes for Claude calls. Fast to build. |
| Auth | None | Stateless tool, no user accounts. Anyone can use it. Saves 2-3 hours of Clerk setup. |
| Database | None | Ephemeral reports. No history/saving needed. Can add Supabase next week if we want saved searches. |
| AI | Claude 3.5 Sonnet | Best prompt-following for extraction tasks. Haiku too weak for nuanced pain point detection. Opus overkill. |
| Hosting | Vercel | Default. Zero-config Next.js deploys. Edge functions handle API routes. |
| RSS Parsing | `rss-parser` npm | Mature library (3M weekly downloads). Handles Reddit's XML format reliably. |
| HTTP Client | `fetch` (built-in) | No axios needed. Native fetch in Node 18+ handles Reddit RSS requests fine. |
| Caching | In-memory Map (if needed) | Only add if processing >3 min. Avoid Redis complexity for MVP. 1-hour TTL, cache key = hash(keywords). |

_Deviations from default: No Supabase, no Clerk. Rationale: Stateless workflow doesn't need persistence or auth. This saves ~4 hours on Tuesday._

---

## Fallback Plans

**If Risk 1 fails (extraction accuracy <60%):**
- First: Iterate prompt 3-4 times with different approaches (few-shot examples, stricter filtering, simpler scoring rubric)
- If still <60%: Simplify extraction - remove scoring, just extract raw quotes with source URLs. Let user manually assess quality. Still useful but less magical.
- If even quote extraction is poor (<40% useful): Kill the project. Problem signal extraction is the core value prop; without it, tool has no moat vs just browsing Reddit manually.

**If behind by Wednesday EOD (workflow not working):**
- Cut clustering - just show flat list of pain points ranked by score
- Cut keyword filtering - only support "show me everything from these 5 subs"
- Cut score breakdown - just show composite score (0-100), not intensity/frequency/specificity breakdown
- Deploy Thursday AM with working but basic version, use Thursday PM for minimal polish

**If AI output quality is poor (Thursday QA reveals issues):**
- Prompt iteration budget: 6 attempts max (2 hours)
- After 6 attempts without improvement: Ship with disclaimer "Beta - extraction quality improving" and collect user feedback on which pain points were useful
- Add feedback buttons: "This was useful" / "This was noise" to gather training data for next week's prompt improvements
