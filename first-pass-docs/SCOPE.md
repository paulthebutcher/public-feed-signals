# Scope: Reddit Problem Signal Miner

> **Core bet:** Indie hackers building 3+ MVPs per year will use a Reddit problem signal miner (even with limited subreddit coverage) because manually browsing Reddit for 30-40 hours per validation cycle is painful and expensive, and pattern extraction quality is the unsolved moat.
> **One-line pitch:** Stop wasting 30 hours on Reddit—get structured problem signals from 5 startup communities, extracted and scored by AI, delivered weekly.

---

## Target Persona

**Who:** Solo indie hackers and technical founders building 3+ MVPs per year, pre-PMF, who can code fast but struggle with customer discovery and validation. Typically bootstrapped, no budget for $59/month research tools.

**Trigger moment:** Monday morning. They have 2-3 product ideas and need to pick one to build this week. They know they should "do research" but dread spending hours scrolling Reddit looking for problem signals.

**Current workaround:**
- Manually browse r/Entrepreneur, r/startups, r/SaaS for 2-4 hours, copy-pasting interesting complaints into a doc
- Or skip research entirely and just start building (then pivot/abandon later)
- Or pay $29-$59/month for GummySearch/PainOnSocial (but hesitate due to cost)

**Why they'd try this:**
- It's free (or cheap) - no $59/month subscription
- Saves 2+ hours every Monday morning
- Structured output (scored pain points + source quotes) is more actionable than raw Reddit threads
- Built for their specific use case (startup idea validation) not general "audience research"

---

## One Workflow

_The MVP tests ONE workflow. Not a platform. Not a dashboard. One action a user takes, start to finish._

**Input:** User selects 1-3 topic keywords (e.g., "SaaS pricing," "freelance burnout," "AI agents") OR uses the default "recent complaints" across all 5 curated subreddits.

**Process:**
1. System fetches last 7 days of posts from 5 curated subreddits via RSS feeds (r/SaaS, r/Entrepreneur, r/startups, r/indiehackers, r/ProductManagement)
2. Filters posts by keyword relevance (if provided) and minimum engagement (>5 upvotes, >2 comments)
3. Claude extracts pain points from post titles + top 3 comments per post
4. AI scores each pain point 0-100 based on: intensity (frustration level), frequency (how often it appears), specificity (actionable vs vague)
5. Groups similar pain points into clusters with source quotes

**Output:** Structured markdown report with:
- Top 10 pain point clusters ranked by score
- 2-3 supporting Reddit quotes per cluster (with post URLs)
- One-line summary of what people have tried and abandoned
- Estimated time to generate: 2-3 minutes

**Session length:** 5-10 minutes total (30 seconds to input keywords, 2-3 min AI processing, 2-5 min reviewing output)

### In scope
- [ ] Scrape 5 curated subreddits via RSS (last 7 days)
- [ ] AI-powered pain point extraction from posts + comments
- [ ] Scoring algorithm (intensity, frequency, specificity)
- [ ] Grouping similar pain points into clusters
- [ ] Markdown report with source attribution (Reddit post URLs)
- [ ] Optional keyword filtering
- [ ] Basic landing page explaining what it does

### Out of scope (and why)
- ~~Custom subreddit search~~ — Requires expensive Reddit API, would kill us like it killed GummySearch. 5 curated subs is enough for MVP validation.
- ~~Real-time monitoring~~ — Weekly batch is sufficient for Monday research use case. Real-time adds complexity without proportional value.
- ~~Historical data (>7 days)~~ — RSS feeds only provide recent posts. Pushshift archives exist but add complexity. 7 days is enough signal.
- ~~Multi-platform (HN, forums, Twitter)~~ — Single platform tests if the concept works. Cross-platform is Layer 2-3 of the bigger pipeline.
- ~~User accounts / saved searches~~ — No auth this week. Tool is stateless. They can bookmark the URL and re-run with same keywords.
- ~~Competitive analysis~~ — That's Layer 2 (Competitive Teardown). This week only tests Layer 1 (Problem Signal Validation).
- ~~Sentiment analysis beyond pain points~~ — Not all sentiment is useful for product validation. Focus on problems, not general positive/negative.

---

## Success Criteria

_How do you know Friday's build is "done"? Not "good" — done._

1. **A stranger can visit the URL** and generate a pain point report with zero instructions (just "Enter keywords" or "Use defaults")
2. **Extraction accuracy >60%** - manually review 20 extracted pain points: at least 12/20 should be legitimate, actionable problem signals (not memes, jokes, or off-topic)
3. **Processing completes in <3 minutes** - from submit to full report display (any slower = people will leave)
4. **We actually use it Monday** - if we won't use our own tool for next week's research, it's not solving the problem

## Revenue Hypothesis

**Who would pay:** Same persona - indie hackers doing weekly/monthly validation research. Also: product managers at early-stage startups, indie consultants doing client discovery.

**What they'd pay:** $10-20/month or $5 per report (one-time)
- Comparable to: GummySearch $29/month (but shutting down), PainOnSocial "more affordable", Peekdit free tier exists
- We'd price lower because: (1) limited to 5 subreddits not customizable, (2) weekly batch not real-time, (3) MVP quality
- Customers paying for: time savings (2-3 hours) + pattern detection they'd miss manually

**When to test pricing:** Week 2 or 3
- This week: free, focus on "does the extraction work?"
- If 3+ people use it and say it's useful → add Stripe checkout next week
- Don't gate the tool yet - need usage data to validate extraction quality first

**Simplest payment test:** Gumroad "Buy credits" button → 5 reports for $25. No subscription complexity, tests willingness to pay without ongoing billing headaches.

---

## Open Questions

_Things you don't know yet that might change the build. Flag them now so you notice when you learn the answer during the build._

1. **Will RSS feeds provide enough data volume?** - If Reddit throttles RSS or it only returns 10-20 posts per subreddit, extraction might be too sparse to find patterns. May need to add PRAW API calls (free tier) as backup.

2. **How do we score "intensity" programmatically?** - Easy for a human to see "I'm so frustrated" vs "mild annoyance." Can Claude reliably score this 0-100? May need few-shot examples or rubric in the prompt.

3. **What's the right clustering algorithm?** - Similar pain points should group together ("email marketing is expensive" + "email tools cost too much"). Semantic similarity via embeddings? Keyword matching? Or just let Claude do it with reasoning?

4. **Do people want keywords OR browse-everything?** - Current design assumes they have a topic in mind ("SaaS pricing"). But maybe they just want "show me all complaints from this week." Test both UX paths.

5. **Is 7 days the right window?** - Too short = not enough data. Too long = stale signals. RSS feeds might only go back 3-4 days anyway. Discover actual availability during build.
