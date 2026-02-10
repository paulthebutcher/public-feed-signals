# Research: Reddit Problem Signal Miner

> **Date:** Monday, February 9, 2026
> **Raw idea:** A tool that scrapes Reddit for real problem signals, extracts complaint patterns, and outputs structured quotes with source attribution for product validation research.
> **Time started:** 9:00 AM EST
> **Time finished:** [in progress]

---

## Problem Signal

### What are people actually saying?
_Search Reddit, HN, Indie Hackers, app store reviews, Twitter/X, niche forums. Find 5+ real quotes from people experiencing this problem. Not surveys or reports — actual complaints._

1. **Source:** Indie Hackers — "I spent weeks filtering and evaluating... I had no clue about the world [of my target customer]" - founder realizing they lacked founder-market fit after extensive research
2. **Source:** Indie Hackers — "I've launched 37 products in 5 years and not doing that again" - builder admitting to shipping without validation, losing "too much time and money building things no one needed"
3. **Source:** TheBootstrappedFounder — Overconfidence leads entrepreneurs to skip validation because they "know" it will work (identified as one of the 7 deadly sins of indie hacking)
4. **Source:** Indie Hackers — "Doing both good market research and idea validation is not an easy thing" - acknowledged difficulty of the validation process
5. **Source:** Indie Hackers — "What people say they'd do and what they actually do are completely different" - highlighting the gap between stated intent and actual behavior
6. **Source:** Multiple founders — "Validate for a month rather than build for 6 months and find out nobody wants it"

### Patterns across quotes
- **"Wasted time"** appears repeatedly - builders shipping without validation, then starting over
- **"I spent weeks"** researching but still got it wrong - research is time-consuming AND unreliable when done manually
- **"Nobody needed it"** - builders shipping solutions looking for problems instead of solving real pain
- **Overconfidence blindness** - "I know it will work" prevents proper validation
- **Gap between intent and action** - surveys and hypotheticals don't predict actual behavior
- Founders want to **flip the approach**: "problem comes first" instead of "idea first"

### Who has this problem most acutely?
Solo indie hackers and early-stage founders (pre-product-market fit) who are shipping multiple MVPs per year. Specifically: technical founders who can build quickly but struggle with customer discovery, repeat builders who've launched multiple products without traction, and bootstrap founders without budget for expensive research tools ($59-$hundreds/month).

---

## Signals For

_Evidence this is worth building. Be honest — don't cherry-pick._

1. **Active existing market** - GummySearch built a profitable business around this exact problem (multiple pricing tiers, users paying $29-$59/month), proving willingness to pay
2. **Reddit is recognized as THE source** - multiple articles, tools, and founder advice consistently point to Reddit as the best place for authentic problem discovery ("Reddit conversations are organic and unfiltered")
3. **Manual process is painful** - founders spend "30-40 hours taking notes" on Reddit to find pain points, creating clear automation opportunity
4. **Validation gap is costing founders months** - "validate for a month vs. build for 6 months" framing shows the stakes; bad validation = wasted build time
5. **Problem discovery is a repeatable workflow** - multiple tools (GummySearch, PainOnSocial, Peekdit) have proven this can be systematized
6. **Competitive intel is highly valued** - "users frequently compare tools on Reddit, providing honest pros and cons" - not just problem discovery but competitive teardown
7. **This tests Layer 1 of your pipeline** - directly validates whether problem signal validation can be automated, which is foundational for the bigger pre-build intelligence pipeline

## Signals Against

_Evidence this is a bad idea. This section is more important than Signals For. If you can't find signals against, you haven't looked hard enough._

1. **GummySearch is shutting down** - the category leader announced closure (no new purchases after Nov 30, service ends late 2026). This could signal: market isn't big enough, Reddit API changes killed the business model, or founder burnout. Red flag that needs investigation.
2. **Reddit API is expensive/restricted** - Free tier is basically unusable (10K requests/month, 100/min). Paid tier "starts at thousands per month." This is a major cost/feasibility risk.
3. **Scraping is fragile** - workarounds exist (RSS feeds, browser automation) but they're brittle and could break if Reddit changes their frontend
4. **Competitive landscape is already crowded** - PainOnSocial, Peekdit, BigIdeasDB, plus general scraping tools. Hard to differentiate unless we solve something they don't.
5. **Problem might be "which idea to build" not "how to research"** - founders may be stuck on conviction/decision-making, not data gathering. A research tool won't help someone paralyzed by choice.
6. **Single-source tool has limited moat** - if we only scrape Reddit, competitors can copy quickly. The defensibility is in cross-source intelligence (Reddit + HN + forums + competitor analysis), which is much bigger scope.
7. **Self-referential risk** - we're building a tool to help us build better tools. Easy to over-optimize for our own workflow instead of validating external demand.

---

## Competitive Landscape

### Direct competitors
_Tools that solve this exact problem. For each: what they charge, what they bet on, what they left out._

| Tool | Pricing | Core bet | What they skip |
|------|---------|----------|----------------|
| **GummySearch** | $29-$59/mo (shutting down Nov 2026) | Reddit audience research - discover what communities talk about | Shutting down suggests market/cost issues. API-dependent. |
| **PainOnSocial** | "More affordable than GummySearch" (exact pricing unclear) | AI-powered pain point extraction from 30+ curated subreddits, scores 0-100 | Uses Perplexity API + OpenAI. Curated communities only. Single platform (Reddit). |
| **Peekdit** | Free Chrome extension + paid tiers | Research Mode auto-captures as you scroll, one-click thread saving | Manual/semi-manual - you still browse Reddit yourself. Not fully automated discovery. |
| **BigIdeasDB** | Unclear | Pre-filtered list of product opportunities from Reddit | Product ideas, not raw problem signals. Less control over research. |

### Adjacent tools
_Tools that partially solve this or solve it as a side feature. Why aren't they good enough?_

- **Apify, Octoparse, ScraperAPI** - General web scraping tools that CAN scrape Reddit but require: (1) technical setup, (2) no domain-specific intelligence (don't know what a "pain point" is), (3) no pattern extraction or structuring
- **PRAW (Python) / Snoowrap (JS)** - Reddit API wrappers for developers. Powerful but: (1) require coding, (2) hit API rate limits hard (1000 post ceiling), (3) raw data with no analysis layer
- **Reddit RSS feeds** - Legitimate `.rss` append method for any Reddit URL. But: (1) no search/filter capability, (2) chronological only, (3) requires knowing which subreddits/threads to follow

### Why hasn't this been built well yet?
**Reddit API cost structure killed the leader.** GummySearch shutting down after building a working business suggests the 2023 API pricing changes ($thousands/month for meaningful access) destroyed unit economics. Tools that remain either:
1. Use expensive Perplexity/AI wrappers (PainOnSocial approach - passes cost to customer)
2. Use fragile scraping workarounds (RSS, browser automation - breaks easily)
3. Semi-manual (Peekdit - user still does the browsing)

The technical challenge isn't extraction - it's **sustainable, affordable data access at scale**. The business model challenge is: users want this but won't pay enough to cover Reddit API costs. Market might be "real problem, too small to support API costs."

---

## Technical Feasibility

### What APIs/services does this need?
_List the core external dependencies. Are they mature? What do they cost at MVP scale?_

**Reddit Data Access (3 options):**
1. **Official Reddit API** - Free tier: 10K requests/month, 100/min. Paid: $0.24 per 1K calls (starts at thousands/month). Mature but expensive. 1000-post pagination limit. NSFW blocked since 2023.
2. **Reddit RSS feeds** - Free, append `.rss` to any URL. Limited to chronological feeds, no search. Legitimate and unlikely to break.
3. **Browser automation scraping** - Tools like Playwright/Puppeteer. Free but fragile (breaks if Reddit changes HTML). Rate limit risk.

**Pattern Extraction:**
- **Claude API** - For extracting pain points from scraped text. $15-$75 per million tokens depending on model. Cost scales with volume.
- **Alternative**: Local LLM (Llama 3.2) for extraction - free but slower, lower quality

**MVP Scale Cost Estimate:**
- Scrape 50 subreddits/week via RSS: **$0** (free)
- Claude API for pattern extraction (estimated 500K tokens/week): **~$7.50-$37.50/week**
- Hosting (Vercel): **$0** (free tier sufficient for MVP)

### What's the hardest technical part?
_The thing that, if it doesn't work, nothing else matters._

**Problem signal extraction quality.** Reddit threads are noisy - memes, jokes, off-topic replies. The AI needs to:
1. Distinguish genuine complaints from casual mentions
2. Extract the core problem from conversational text
3. Identify recurring patterns across multiple posts/comments
4. Score pain intensity (frustration vs. mild annoyance)

If extraction produces low-quality signals (too generic, false positives, missing context), the tool is worthless. This is a prompt engineering + evaluation challenge, not a data access challenge.

### Have others solved the hard part?
_Open source implementations, blog posts, tutorials. Links._

**Data Access:**
- PRAW (Python Reddit API Wrapper): `github.com/praw-dev/praw` - most popular Reddit scraping library
- Reddit RSS documentation: Multiple blog posts confirm `.rss` append method works reliably
- "How to Scrape Large Amounts of Reddit Data" (Medium): Pushshift archives for historical data

**Pattern Extraction:**
- PainOnSocial uses Perplexity API for Reddit search + OpenAI for structuring/scoring pain points (0-100 scale)
- No open-source pain point extraction prompts found - this would be proprietary
- Sentiment analysis libraries (TextBlob, VADER) exist but don't specifically identify "pain points" vs general negative sentiment

**Key insight:** Data access is solved (RSS feeds are reliable). Pattern extraction quality is the unsolved moat.

---

## Verdict

### Core bet (one sentence)
_"I believe [persona] will [action] because [reason], and I can test this by [what the MVP does]."_

**I believe indie hackers building 3+ MVPs per year will use a Reddit problem signal miner (even with limited subreddit coverage) because manually browsing Reddit for 30-40 hours per validation cycle is painful and expensive, and I can test this by building a tool that extracts structured pain points from 5 curated startup/product subreddits and measuring whether the extracted signals are actually useful for Monday research.**

### Build or kill?
**BUILD** - with critical scope constraints.

**Why build:**
- Tests Layer 1 (Problem Signal Validation) of the pre-build intelligence pipeline
- Proven market (GummySearch had paying customers before API costs killed them)
- We can avoid the API cost trap by using RSS feeds (free, reliable)
- Pattern extraction quality is the unsolved moat - this is a solvable AI/prompt problem
- Immediately useful for our own Monday research process (dog-fooding)

**Scope constraints to make this work:**
1. **5 curated subreddits only** (r/SaaS, r/Entrepreneur, r/startups, r/indiehackers, r/ProductManagement) - not "search any subreddit" which requires expensive API
2. **RSS feeds for data access** - free, reliable, avoids API costs that killed GummySearch
3. **Focus on extraction quality** - this is the moat, not data volume
4. **Weekly batch processing** - not real-time monitoring (reduces complexity, still useful for Monday research)
5. **Frame as pipeline testing** - this validates whether automated problem signal extraction actually works, which informs the bigger pipeline

### Conviction level
**Medium** - because signals are genuinely mixed.

**Why not Low:** Clear demand exists (people pay $29-$59/month for this), painful manual process (30-40 hours), and we have a technical path that avoids the API cost trap.

**Why not High:** GummySearch shutting down is a major red flag. The category leader couldn't make unit economics work. We're betting we can succeed by: (1) using free RSS instead of paid API, (2) focusing on extraction quality over comprehensive coverage, (3) treating this as pipeline R&D not a standalone product. These constraints might make the tool too limited to be useful.

### What would change your mind?
**Kill criteria by Wednesday:**
- If pattern extraction produces >40% false positives (generic complaints, off-topic, not actionable pain points)
- If RSS feed data is too limited (can't get enough posts, too slow to refresh, blocked by Reddit)
- If the structured output isn't actually more useful than just spending 30 minutes browsing r/indiehackers manually

**Would increase conviction:**
- If extraction produces genuinely useful pain point clusters we wouldn't have found manually
- If another founder tries it Monday and says "this saved me 2+ hours"

---

_Research time: 2.5 hours_
_Sources checked: Google search, Indie Hackers forums, Reddit API documentation, competitive tool websites (GummySearch, PainOnSocial, Peekdit), web scraping tutorials, AI research on sentiment analysis_
