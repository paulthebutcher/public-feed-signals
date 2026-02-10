# Data Source Pivot: Reddit → HackerNews

**Date:** Tuesday, February 10, 2026
**Reason:** Reddit API now requires pre-approval (Nov 2025 policy change)
**Decision:** Build MVP with HackerNews, add Reddit later

---

## What Happened

Reddit changed their API policy in November 2025. The "Create App" button now triggers a manual approval process instead of instant credentials. This could take days or weeks.

**Old flow:** Create app → get credentials → build (5 minutes)
**New flow:** Submit request → wait for approval → get credentials → build (days/weeks)

---

## Why HackerNews Works

### Data Quality ✅
- **Similar audience:** Startup founders, indie hackers, technical builders
- **Ask HN posts:** Goldmine of pain points ("Ask HN: How do you handle...")
- **High engagement:** Top posts have hundreds of comments with detailed problems

### API Access ✅
- **No authentication required** - public API
- **No rate limits** - reasonable use is fine
- **Clean JSON format** - easier than RSS/HTML parsing
- **Stable API** - been around since 2006

### API Endpoints:
```
Ask HN stories: https://hacker-news.firebaseio.com/v0/askstories.json
Top stories: https://hacker-news.firebaseio.com/v0/topstories.json
Story details: https://hacker-news.firebaseio.com/v0/item/{id}.json
```

---

## Comparison: Reddit vs HackerNews

| Feature | Reddit (r/Entrepreneur) | HackerNews (Ask HN) |
|---------|------------------------|---------------------|
| **API Access** | ❌ Requires pre-approval | ✅ Public, no auth |
| **Setup Time** | Days/weeks | 0 minutes |
| **Audience** | Broad entrepreneurs | Technical founders |
| **Pain Point Density** | ~55% (from spike) | ~40-60% (estimated) |
| **Post Volume** | High | Medium |
| **Content Quality** | Mixed (memes, spam) | High (curated by votes) |

---

## Build Plan Update

### Original Plan (with Reddit):
1. ~~Set up PRAW with Reddit API credentials~~
2. ~~Fetch posts from r/Entrepreneur~~
3. Extract pain points with Claude
4. Rank and display results

### Updated Plan (with HackerNews):
1. ✅ Use HackerNews public API (no setup needed)
2. ✅ Fetch Ask HN posts (last 7 days)
3. Extract pain points with Claude (same prompt)
4. Rank and display results

**Code changes:** Minimal - just swap data fetching layer, extraction logic is identical

---

## Testing Checklist

Run on your machine to validate HackerNews:

```bash
cd /path/to/build/2-9-26
python3 test_hackernews.py
```

**Expected results:**
- ✅ 15+ recent Ask HN posts (last 7 days)
- ✅ 40%+ posts contain pain point keywords
- ✅ Posts have titles + content (not just links)

**If test passes:** HackerNews is viable, proceed with build
**If test fails:** We'll need to combine multiple sources or reduce time window

---

## Future Enhancements

### Phase 1 (MVP - This Week):
- ✅ HackerNews Ask HN posts only
- Single keyword input
- Extract + rank pain points
- Ship it!

### Phase 2 (Later):
- Add Reddit once API approval comes through
- Add more HN categories (Show HN, etc.)
- Add other sources (Indie Hackers, Dev.to)
- Let users toggle sources on/off

### Phase 3 (Future):
- Multi-source aggregation
- Cross-platform pain point trending
- Historical data analysis

---

## Key Insight

**This pivot is actually BETTER for MVP:**

1. **Ships faster** - no waiting for Reddit approval
2. **Higher signal** - HN has better curation (voting system)
3. **Better audience fit** - technical founders are our ICP
4. **Cleaner data** - less spam, memes, self-promotion
5. **Validates extraction** - proves concept works on real data

We can always add Reddit as a *second* source later. Starting with one high-quality source is smarter than waiting for a blocked source.

---

## Decision: PROCEED WITH HACKERNEWS

Next steps:
1. Run `test_hackernews.py` to validate data availability
2. Test extraction on real HN posts (use same prompt from spike)
3. If extraction quality is 40%+, scaffold Next.js app
4. Build with HN, ship MVP, add Reddit later

---

## Note for Future

When Reddit API approval comes through:
- Add `/api/sources/reddit` endpoint
- Reuse same extraction logic
- Let users choose: HN only, Reddit only, or Both
- This becomes a feature ("Multi-source pain point mining")
