# Pre-build Intelligence Pipeline — Cowork Context

## Who is Paul?

Solo AI product incubator operator. Former Director of Product Experience Strategy at Mastercard ($1B+ ARR cyber/intelligence portfolio). Chemical engineering background + full-stack development. Builds MVPs significantly faster than typical timelines — Phase 1 of previous projects averaged ~3 hours.

Currently running a "get paid to learn" model: one AI-powered product per week, each testing a thesis about a real process problem. Revenue is the only reliable signal. Everything else is hypothesis.

## What is this pipeline?

A structured manual process for going from a raw, cold product idea to build-ready planning artifacts in one day (Monday). The artifacts then drive a 4-day build (Tuesday-Friday) using Claude + Cursor. A friction log captures everything that breaks during the build so the process improves each week.

**Core bet:** Bad planning specs — not bad coding — are the bottleneck in AI-assisted development. Better input → better builds → faster learning → faster revenue signal.

**This is NOT software yet.** This is a folder of markdown templates that get filled in manually each Monday. The friction log from each week tells us which steps to automate. The tool is the byproduct of the process, not the goal.

## The Weekly Rhythm

### Sunday night or Monday 8am
- Commit to one idea. One sentence. Written down. No pre-research.
- Source: problem mining (Reddit, HN, indie forums), someone else's complaint, or backlog pick with zero prior thinking.

### Monday morning (2-3 hours): Research
1. Copy `RESEARCH.md` template into this week's project folder
2. Run structured research using Perplexity, Claude Research, Reddit/HN/forums
3. Fill in every section of RESEARCH.md — don't skip "Signals Against"
4. Goal: produce conviction or a kill decision, not just information

### Monday afternoon (2 hours): Planning artifacts
1. Write the "core bet" paragraph FIRST — one sentence, what you're testing
2. Fill in SCOPE.md — one persona, one workflow, one session
3. Fill in DATA_MODEL.md — entities implied by the workflow, nothing more
4. Fill in BUILD_PLAN.md — ordered by risk, hardest thing first
5. Fill in .cursorrules — tech stack decisions with rationale
6. Sanity check: can you ship this by Friday? If not, cut scope now.

### Tuesday-Thursday: Build
- Build with Cursor using the planning artifacts
- Every friction point goes in FRICTION_LOG.md immediately (not end of day)
- Friction = any decision the spec didn't cover, any rework from ambiguity, any "should have known this Monday"

### Friday morning: Ship
- Deploy whatever works. Doesn't need polish.
- Live URL required. No "it works locally."

### Friday afternoon (1 hour): Review
- Categorize each friction log entry: (a) catchable by better research, (b) catchable by better scoping, (c) catchable by better risk ID, (d) genuinely unpredictable
- Write RETRO.md — what the pipeline got right, what it missed, what changes for next week
- Update templates if something was consistently missing

## Deployment Strategy

Every weekly project should be deployable by Friday. The goal is a live URL someone can visit — not a polished product, but a working thing.

### Recommended Stack
- **Framework:** Next.js (App Router) — Paul's most productive framework, supports API routes, SSR, good Cursor support
- **Auth:** Clerk — already configured across the Ethos ecosystem, free tier covers MVPs
- **Database:** Supabase — Postgres + RLS + real-time, already in use for Guildry/Launchpad
- **AI:** Anthropic Claude API — direct integration, Paul has API access
- **Hosting:** Vercel — zero-config Next.js deploys, preview URLs on push

### URL Pattern
Each project gets a subdomain: `{project-name}.theaiethos.com`

Vercel project per week. Domain configured in Vercel dashboard. Takes 5 minutes on Monday after naming the project.

### Deployment Checklist (Friday morning)
1. Push to GitHub (repo: `paulthebutcher/{project-name}`)
2. Vercel auto-deploys from main branch
3. Add custom domain: `{project-name}.theaiethos.com`
4. Verify Clerk redirect URLs include new domain
5. Verify Supabase RLS policies if using auth
6. Smoke test: can a stranger visit the URL and understand what it does?

### When to deviate
- **No auth needed?** Skip Clerk. Static site or anonymous API.
- **No database needed?** Skip Supabase. Client-side only or localStorage.
- **Heavy file processing?** Consider a Python backend on Railway instead of Vercel serverless.
- **Real-time features?** Supabase Realtime or Vercel AI SDK streaming.

The default stack should be the starting assumption in BUILD_PLAN.md. Deviations get documented with rationale.

## Template Files

The following templates live alongside this context doc. Each Monday, copy the entire `/pipeline` folder into the new project directory and start filling in.

| File | When | Purpose |
|------|------|---------|
| `RESEARCH.md` | Monday AM | Structured research output |
| `SCOPE.md` | Monday PM | What we're building and why |
| `DATA_MODEL.md` | Monday PM | Entities and relationships |
| `BUILD_PLAN.md` | Monday PM | Risk-ordered build sequence |
| `.cursorrules` | Monday PM | Tech decisions for Cursor |
| `FRICTION_LOG.md` | Tue-Fri | Running capture of breakdowns |
| `RETRO.md` | Friday PM | What worked, what didn't, what changes |

## Hard Rules

1. **Tool improvements only Mondays** based on last week's friction log. Tuesday-Friday is building the week's product.
2. **No scope expansion after Monday.** If you discover the scope is wrong, note it in the friction log and keep building the original scope. The learning is in finishing, not in pivoting mid-week.
3. **Ship Friday.** A live URL. Not "almost done." Not "works locally."
4. **Friction log entries are real-time.** The moment you think "this spec didn't cover this" — write it down. Don't batch.
5. **Kill fast.** If Monday research says "don't build this," that's a valid and good outcome. Write why in RETRO.md and pick a new idea for Tuesday.

## Kill Criteria (for the pipeline itself)

- If structured planning doesn't measurably outperform an unstructured Claude conversation by week 4, the thesis is wrong.
- Each automated step (when we start automating) must produce output at least as useful as the manual version.
- By week 6: either have something someone else can try, or shelve the pipeline project.

## Key Context from Prior Research

### What we know about claim decomposition (relevant when automating research step)
- VeriScore's sliding window approach is the best starting point — extracts only verifiable claims, preserves context
- Optimal granularity is level 1 (one meaningful assertion with qualifiers), not maximally atomic
- Decomposition prompt quality is 70% of the work — not the scoring algorithm
- Context loss during decomposition is the critical failure mode
- Claim types matter: factual (90%+ reliable), evaluative (much less), predictive (least). Need `claim_category` field.
- Cross-source agreement is rarer than expected — most claims will be single-source, and that's still valuable

### What we know about Paul's build patterns
- Builds MVPs in ~3 hours for Phase 1
- Previous builds failed when: scope was ambiguous, technical risks weren't identified early, no evaluation criteria
- Guildry: 7-module architecture was over-designed upfront. Discovery-first (let conversations reveal data needs) worked better than waterfall spec.
- The 30% time savings from better planning may feel small to Paul but represents 4-5 days for a typical builder — watch for miscalibration.

### Identified blindspots
1. Unusually fast builder — "is this worth it?" judgment may be miscalibrated
2. Solving for build quality but customers may want confidence (which idea to build)
3. Should optimize for likelihood of revenue by Friday, not code quality
4. Self-referential risk — building a tool whose primary user is the builder
