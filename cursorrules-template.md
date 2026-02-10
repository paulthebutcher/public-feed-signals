# Project: Reddit Problem Signal Miner
# One-line: Stop wasting 30 hours on Reddit—get structured problem signals from 5 startup communities, extracted and scored by AI, delivered weekly
# Build week: Feb 10-13, 2026

## Stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- No database (stateless, ephemeral reports)
- No auth (public tool)
- Claude 3.5 Sonnet API for pain point extraction
- Tailwind CSS for styling
- rss-parser for Reddit RSS feed scraping
- Deployed on Vercel at reddit-signals.theaiethos.com

## Architecture Rules
- Server components by default. Client components only for interactivity (form submission, loading states).
- API routes in /app/api/. No business logic in components.
- AI calls go through API routes, never client-side. Stream responses using Vercel AI SDK if extraction takes >30 seconds.
- Environment variables: ANTHROPIC_API_KEY only
- No database, no ORMs. All data is ephemeral (generated on-demand, displayed, discarded).
- RSS scraping happens server-side in API routes. Never expose API keys to client.

## Data Model
**PainPointCluster** (main output structure):
- id (string): UUID for display
- summary (string): One-line pain point description
- score (number): 0-100 composite score
- intensity (number): 0-100, frustration level
- frequency (number): How many posts mention this
- specificity (number): How actionable it is
- source_quotes (SourceQuote[]): 2-3 supporting quotes
- created_at (timestamp)

**SourceQuote** (Reddit evidence):
- text (string): 50-200 char quote
- reddit_url (string): Full URL to post/comment
- subreddit (string): r/Entrepreneur, etc.
- upvotes (number): Reddit upvote count
- posted_at (timestamp)

**SearchRequest** (ephemeral input):
- keywords (string[]): Optional topics
- subreddits (string[]): Default 5 curated subs
- days_back (number): Default 7
- min_engagement: { upvotes: 5, comments: 2 }

## File Structure
```
/app
  /page.tsx                      # Landing page + form
  /results/page.tsx              # Display extraction results (or inline on main page)
  /api
    /extract/route.ts            # Main endpoint: scrape Reddit + Claude extraction
  /layout.tsx                    # Root layout
/lib
  /reddit-scraper.ts             # RSS feed fetching + parsing
  /claude-extractor.ts           # Claude API calls for pain point extraction
  /types.ts                      # TypeScript interfaces (PainPointCluster, SourceQuote, etc.)
/components
  /search-form.tsx               # Keyword input + submit
  /results-display.tsx           # Render pain point clusters with scores
  /loading-state.tsx             # Spinner while processing
```

## Conventions
- Name files in kebab-case. Name components in PascalCase.
- One component per file. No barrel exports.
- Error handling: try/catch at API route level. Return { error: string, code: string } for failures.
- AI prompts: Store as template literals in `/lib/claude-extractor.ts`. Include few-shot examples inline if needed.
- Streaming: If extraction >30sec, use Vercel AI SDK `streamText` to show progressive results.
- No premature abstraction. Duplicate code is fine. Don't extract utils unless used 3+ times.
- Comments: Document WHY not WHAT. Explain prompt engineering decisions, scoring logic rationale.

## UI
- Clean, minimal design. Light background, dark text (easier to read long reports).
- Mobile-responsive from the start (form + results should work on phone).
- Loading states: Show spinner with estimated time "Analyzing 50 Reddit posts... (~2 min)"
- Empty state: "No pain points found. Try broader keywords or check back tomorrow."
- Results format: Ranked list of clusters, expandable to see source quotes. Click quote to open Reddit URL in new tab.

## What NOT to build
DO NOT build these features this week (they're out of scope):
- Custom subreddit search - hardcoded to 5 curated subs (r/SaaS, r/Entrepreneur, r/startups, r/indiehackers, r/ProductManagement)
- Real-time monitoring - weekly batch only, no live updates
- Historical data beyond 7 days - RSS feeds are recent only
- Multi-platform (HN, forums, Twitter) - Reddit only this week
- User accounts / auth - stateless tool, no login
- Saved searches - ephemeral reports only
- Competitive analysis - focus on problem signals, not competitor teardowns
- Sentiment analysis beyond pain points - only extract complaints/frustrations

## Testing
- No unit tests this week. Manual smoke test Friday.
- Test primary workflow end-to-end: Submit keywords → Get results → Click Reddit links
- Test edge cases:
  - Empty keywords (should use defaults)
  - No results found (should show friendly message)
  - Reddit RSS timeout (should gracefully degrade)
  - Malformed RSS XML (should catch parse errors)
- Manually review 20 extracted pain points for accuracy (target: 12+/20 are real, actionable signals)

## Known Risks
**Risk 1: Pain Point Extraction Quality**
- Reddit is 80% noise (memes, sarcasm, off-topic)
- Prompt engineering is critical - may need 5-10 iterations Tuesday AM
- Target: 60%+ accuracy (12/20 extracted pain points should be legitimate, actionable)
- If <60% after 4 prompt iterations: Simplify extraction (skip scoring, just extract quotes)
- Kill criteria: If even quote extraction <40% useful, project may not be viable

**Risk 2: RSS Feed Data Availability**
- RSS feeds might only return 5-10 posts/sub (not enough for patterns)
- Reddit could throttle or block RSS access
- Fallback: Use PRAW (Reddit API free tier) if RSS insufficient
- Pass/fail: Need 15+ posts per subreddit from last 7 days
