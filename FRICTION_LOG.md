# Friction Log: Problem Signal Miner - February 10, 2026

> **What counts as friction:** Everything Claude needed but didn't have when starting today's session

---

## MISSING: Strategic Direction

### ❌ No competitive analysis
**What I needed but didn't have:**
- Clear understanding of what we're competing against
- "Beat a Claude prompt" requirement came 6 hours into the session
- Should have had upfront: "This tool vs. asking Claude directly - what's the value prop?"

**Time wasted:** 2 hours of building features without knowing the real goal
- Built collapsible cards (nice-to-have)
- Built progress indicators (nice-to-have)
- Should have been building: AI synthesis layer (must-have)

**What Monday should have provided:**
```markdown
## Competitive Landscape
Primary competitor: Just asking Claude "what challenges are startups facing?"

Their strengths:
- Instant response
- Synthesizes patterns
- Reasons about opportunities
- Broad knowledge

Their weaknesses:
- May hallucinate
- No specific sources
- Not current (April 2025 cutoff)

Our advantage: Real data with sources
Our gap: No synthesis layer

Success metric: User prefers our tool over Claude prompt
```

---

## MISSING: TypeScript Infrastructure Strategy

### ❌ No "interface-first" guideline for new data sources
**What I needed but didn't have:**
- Clear instruction: "When adding data sources, define TypeScript interfaces BEFORE implementation"
- Got 15+ type errors because I used `any` types during rapid prototyping
- Had to fix: GitHub, Stack Overflow, Dev.to, Indie Hackers, HackerNews

**Time wasted:** 45 minutes fixing cascading type errors

**Errors encountered:**
```
lib/github.ts:54:43  Error: Unexpected any. Specify a different type.
lib/stackoverflow.ts:52:42  Error: Unexpected any. Specify a different type.
lib/devto.ts:21:18  Error: Unexpected any. Specify a different type.
lib/hackernews.ts:16:60  Error: Promise<any> should be Promise<HNStory | null>
components/PainPointCard.tsx:1:1  Error: post_id: number vs string | number mismatch
```

**What Monday should have provided:**
```markdown
## Adding New Data Sources - Checklist

BEFORE writing any code:
1. Define API response interface
   ```typescript
   interface GitHubAPIIssue {
     id: number;
     title: string;
     // ... all fields with proper types
   }
   ```

2. Define our internal type
   ```typescript
   export type GitHubIssue = {
     id: string;
     title: string;
     // ... our normalized format
   }
   ```

3. Write converter with explicit types
   ```typescript
   function formatIssue(issue: GitHubAPIIssue): GitHubIssue {
     // TypeScript will catch missing fields
   }
   ```

4. Run `npx tsc --noEmit` to verify

5. THEN integrate into sources.ts

NEVER use `any` - it just defers the error to build time.
```

---

## MISSING: Multi-File Update Checklist

### ❌ No checklist for "what needs updating when adding sources"
**What I needed but didn't have:**
- Comprehensive list of every file that references data sources
- Kept discovering new places that needed updates:
  - types.ts (source union)
  - API route (validation array)
  - PainPointCard (badge mapping)
  - page.tsx (display logic)

**Time wasted:** 20 minutes hunting for all the places

**What Monday should have provided:**
```markdown
## New Data Source Integration Checklist

When adding source "X":

Code changes:
- [ ] lib/X.ts - Implementation
- [ ] lib/types.ts - Add 'X' to source union type
- [ ] lib/sources.ts - Add to enabled sources, converter function
- [ ] app/api/extract/route.ts - Add 'X' to validation array (line 21)
- [ ] components/PainPointCard.tsx - Add badge case for 'X'
- [ ] app/page.tsx - Add display name mapping for 'X'

Verification:
- [ ] Run `npx tsc --noEmit` - no type errors
- [ ] Run `npx next lint` - no ESLint errors
- [ ] Update EXPANSION_SUMMARY.md with expected volume

Documentation:
- [ ] Add to DATA_SOURCES_COMPARISON.md
- [ ] Update README "How it works" section
```

---

## MISSING: Build Validation Strategy

### ❌ No documentation on VM limitations
**What I needed but didn't have:**
- Clear explanation that `npm run build` times out in VM after 3 minutes
- Instructions on what to use instead (tsc + eslint)
- User requested "test build before saying ready" - couldn't do it

**Time wasted:** 15 minutes trying different build approaches

**What Monday should have provided:**
```markdown
## Build Verification in VM Environment

⚠️ VM Limitations:
- Full Next.js builds timeout after 3 minutes
- External API calls fail with DNS errors (EAI_AGAIN)
- Dev server works but can't test live data fetching

✅ Use these commands instead:
```bash
# TypeScript check (fast, catches all type errors)
npx tsc --noEmit

# ESLint check (catches React/Next.js errors)
npx next lint

# Both together
npx tsc --noEmit && npx next lint && echo "✅ Ready for Vercel"
```

When user asks "is it ready?":
1. Run both checks above
2. Confirm both pass
3. Note: Full build happens on Vercel (we can't replicate locally)
```

---

## MISSING: UX Requirements Specification

### ❌ No upfront UX requirements
**What I needed but didn't have:**
- User said "make UX improvements" but no spec of what improvements
- Had to ask for clarification
- Then got 4 requirements at once:
  1. Inline search
  2. Progress indicators
  3. Scoring explanation
  4. Collapsible cards

**Time wasted:** 10 minutes back-and-forth to clarify requirements

**What Monday should have provided:**
```markdown
## UX Requirements

### Search Interface
- Layout: Inline (input + button on same row, not stacked)
- Placeholder: "e.g., AI coding, startup validation, freelance"
- Helper text: "Searches 5 sources for problems related to your keywords"

### Loading State
- Show real-time progress steps (not generic spinner)
- Steps: "Fetching posts" → "Scoring relevance" → "Extracting" → "Clustering"
- Timing estimates: "This usually takes ~30 seconds"

### Results Display
- Cards: Collapsed by default (scan 20 at once)
- Expand: Click to show full details (scores, quote, source link)
- Scoring: Explain what each metric means (not just numbers)

### Footer
- Explain how composite score is calculated
- Show formula: (intensity + specificity + frequency) / 3
- Clarify scores are AI analysis, not made up
```

---

## MISSING: Implementation Roadmap

### ❌ No roadmap for "beat Claude" features
**What I needed but didn't have:**
- User asked "how might we get there?" (beat Claude prompt)
- Had to brainstorm 10 ideas on the spot
- Then prioritize them
- Then create 3-week roadmap
- Then write detailed specs

**Time wasted:** Not wasted, but should have been done Monday

**What Monday should have provided:**
- Competitive analysis (vs. Claude prompt)
- Feature prioritization (synthesis > keyword expansion > multi-search)
- Implementation roadmap with phases
- Cost analysis per feature
- Success metrics

**What I created today (should have existed):**
- ENHANCEMENT_PLAN.md (detailed feature specs)
- IMPLEMENTATION_ROADMAP.md (3-week plan)
- DATA_SOURCES_COMPARISON.md (source prioritization)
- REDDIT_INTEGRATION.md (integration guide)

---

## MISSING: Data Source Strategy

### ❌ No prioritized list of next sources to add
**What I needed but didn't have:**
- User said "we need more data sources"
- Had to research and compare:
  - Reddit (volume, API, cost, implementation difficulty)
  - Product Hunt (unique value, API access)
  - Twitter (cost $100-200/mo)
  - HN Comments (easy expansion)
  - Lobsters (small but high quality)

**Time wasted:** 30 minutes researching options

**What Monday should have provided:**
```markdown
## Data Source Expansion Priority

Current: 5 sources (~135 posts/search)

Priority 1: Reddit
- Volume: +150 posts/search
- Difficulty: Medium (OAuth required)
- Cost: Free
- Timeline: 3 hours
- Unique value: Massive volume, targeted subreddits

Priority 2: Product Hunt Comments
- Volume: +20 posts/search
- Difficulty: Medium (GraphQL or scraping)
- Unique value: People complain about existing products

Priority 3: HN Comments
- Volume: +40 posts (expand from 10→50)
- Difficulty: Easy (same API)
- Timeline: 1 hour

Priority 4: Lobsters
- Volume: +15 posts
- Difficulty: Easy (RSS)

Deprioritized: Twitter ($100-200/mo API cost)
```

---

## MISSING: Cost & Pricing Analysis

### ❌ No cost structure or pricing strategy
**What I needed but didn't have:**
- When planning new features, no understanding of cost implications
- Keyword expansion: How much per search?
- AI synthesis: Can we afford this?
- Multi-keyword mode: Is this sustainable?

**What Monday should have provided:**
```markdown
## Cost Structure

Current (per search):
- Relevance scoring: $0.02
- Pain extraction: $0.04
- Clustering: $0.01
- Total: $0.07

Proposed (with enhancements):
- Keyword expansion: +$0.005
- AI synthesis: +$0.15
- Multi-keyword (5x): 5x multiplier
- Total exploration mode: $0.27

Pricing strategy:
- Free tier: 5 searches/day (no exploration) = $0.35/day = $10.50/month cost
- Pro tier: $29/month (unlimited + exploration)
- Target margin: 70% at 10 searches/day average
```

---

## MISSING: Progress Indicator Timing Data

### ❌ No actual timing measurements for progress steps
**What I needed but didn't have:**
- User wanted progress indicators showing which step is happening
- I had to guess timing: 3s, 8s, 20s based on "feels like 30s total"
- Should have had instrumentation data

**What Monday should have provided:**
```markdown
## API Performance Benchmarks

Actual timing measurements (avg of 10 searches):
- Fetching posts: 2.8s (5 sources in parallel)
- Relevance scoring: 5.1s (Claude processes 135 posts)
- Pain extraction: 12.4s (Claude analyzes 90 posts)
- Clustering: 4.2s (Claude groups 50 pain points)
- Total: 24.5s average

Progress indicator timing:
- "Fetching posts" at 0s
- "Scoring relevance" at 3s
- "Extracting pain points" at 8s
- "Clustering" at 20s
```

---

## MISSING: React Event Handling Best Practices

### ❌ No guidance on event bubbling for nested interactive elements
**What I needed but didn't have:**
- Made collapsible cards clickable
- Links inside cards also clickable
- Clicking link triggered card collapse (event bubbling)
- Had to add `onClick={(e) => e.stopPropagation()}` to links

**What Monday should have provided:**
```markdown
## React Interactive Component Patterns

When creating clickable containers with nested clickable elements:

❌ Wrong:
```tsx
<div onClick={toggle}>
  <a href={url}>Link</a>  // Clicking link also toggles!
</div>
```

✅ Correct:
```tsx
<div onClick={toggle}>
  <a href={url} onClick={(e) => e.stopPropagation()}>Link</a>
</div>
```

Common pattern for collapsible cards:
- Parent: onClick={toggle}
- Nested interactives: onClick={(e) => e.stopPropagation()}
- Expanded content: onClick={(e) => e.stopPropagation()} on wrapper
```

---

## PATTERNS & LEARNINGS

### Most common category: (b) Better Scoping
**60% of friction = Missing upfront documentation**

What should have existed Monday:
1. Competitive analysis (vs. Claude prompt)
2. TypeScript interface-first guidelines
3. Multi-file update checklists
4. VM build validation strategy
5. UX requirements specification
6. Implementation roadmap (3 weeks)
7. Data source priority list
8. Cost & pricing analysis
9. Performance benchmarks for timing

### Worst single friction point
**"Beat a Claude prompt" requirement came 6 hours late**
- Built nice-to-have features for 6 hours
- Then learned real goal was AI synthesis
- If known upfront, would have prioritized:
  1. AI Synthesis Panel (must-have)
  2. Keyword expansion (quick win)
  3. Reddit integration (volume boost)
  Not: Collapsible cards, progress indicators

### Time Cost
- Preventable friction: ~90 minutes
- Documentation created today (should have existed): ~3 hours
- ROI if done Monday: 90min saved + 6hr better prioritization = 7.5hr saved

### Action Items for Next Project

**Monday Planning Must Include:**
1. ✅ Competitive analysis
   - What are we competing against?
   - Their strengths/weaknesses?
   - Our unique value prop?
   - Success metric?

2. ✅ Technical guidelines
   - TypeScript: Interface-first for all integrations
   - Multi-file updates: Checklist of what changes
   - Build validation: How to verify in VM environment

3. ✅ Feature roadmap
   - Prioritized by impact (not ease)
   - Cost analysis per feature
   - Timeline with phases

4. ✅ UX specification
   - Not just "make it better"
   - Specific requirements for each element
   - Timing data for progress indicators

5. ✅ Integration checklists
   - New data source: 8-step checklist
   - New feature: Files that need updating

---

## Meta: Quality of This Friction Log

### What makes this better
- ✅ Specific: "Missing competitive analysis" not "unclear goals"
- ✅ Actionable: Shows exact template Monday should have provided
- ✅ Impact: Quantifies time wasted (90 min preventable)
- ✅ Root cause: 60% from scope gaps, not unpredictable issues

### ROI Calculation
**Time spent on friction today:** 90 minutes
**Documentation created:** 3 hours (ENHANCEMENT_PLAN, ROADMAP, etc.)
**Total:** 4.5 hours

**If Monday had provided this:**
- Save 90 min on preventable friction
- Save 6 hours on misprioritization (would have built synthesis first)
- Save 3 hours creating docs (would already exist)
- **Total saved:** 9.5 hours

**Planning overhead:** 2 hours Monday to create all templates
**Net ROI:** 9.5 - 2 = 7.5 hours saved (3.75x return)

---

## Specific Templates Needed for Next Time

### Template: Competitive Analysis
```markdown
## What We're Competing Against
Primary competitor: [Tool/Process/Manual Work]

Their strengths:
- [What they do well]

Their weaknesses:
- [What they lack]

Our advantages:
- [What we do better]

Our gaps:
- [What we're missing]

Success metric: [How we know we've won]
```

### Template: TypeScript Integration Checklist
```markdown
## Adding New Integration (API, Data Source, etc.)

STEP 1: Define interfaces FIRST
- [ ] Create `interface XAPIResponse` for their API
- [ ] Create `export type X` for our format
- [ ] Write `function convertX(api: XAPIResponse): X`

STEP 2: Run verification
- [ ] `npx tsc --noEmit` passes

STEP 3: Integrate
- [ ] Add to types.ts unions
- [ ] Add to validation arrays
- [ ] Add to UI mappings

STEP 4: Verify again
- [ ] `npx tsc --noEmit && npx next lint` passes
```

### Template: VM Build Validation
```markdown
## How to Verify Builds in VM

❌ Don't use: `npm run build` (times out after 3min)
✅ Use instead:
```bash
npx tsc --noEmit && npx next lint && echo "✅ Ready"
```

When user asks "is it ready?":
1. Run command above
2. Both checks must pass
3. Note: Full build happens on Vercel
```

### Template: Feature Roadmap
```markdown
## Feature: [Name]

Why: [Problem it solves]
Impact: [How much better does this make the product?]
Implementation: [High-level approach]
Cost: [Per-use or monthly]
Timeline: [Hours/days]
Priority: [Must-have / Should-have / Nice-to-have]

Dependencies:
- [What needs to exist first?]

Success metric:
- [How do we know it worked?]
```
