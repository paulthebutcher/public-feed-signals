# Third Pass Documentation - Problem Signal Miner

**Date**: February 10, 2026
**Goal**: Beat a Claude prompt at identifying startup opportunities
**Status**: Documentation complete, ready for implementation

---

## What's in This Folder

### Core Planning
1. **IMPLEMENTATION_ROADMAP.md** - 3-week implementation plan
   - Phases, timelines, success metrics
   - Cost analysis & pricing strategy
   - Risk mitigation

2. **ENHANCEMENT_PLAN.md** - Detailed feature specifications
   - Smart keyword expansion
   - AI synthesis panel (the game-changer)
   - Multi-keyword exploration mode
   - Opportunity scoring

### Integration Guides
3. **REDDIT_INTEGRATION.md** - Reddit as 6th data source
   - OAuth setup instructions
   - Subreddit targeting strategy
   - Rate limiting & error handling
   - Expected: +150 posts per search

4. **DATA_SOURCES_COMPARISON.md** - All current & future sources
   - Priority ranking (Reddit #1, Product Hunt #2, HN Comments #3)
   - Implementation difficulty assessment
   - Expected volume & quality metrics

---

## The Big Picture

### Current Problem
**Problem Signal Miner finds pain points but doesn't synthesize opportunities.**

User asks: "What startup challenges are ripe for AI disruption?"
- Claude prompt: Instant synthesis, broad patterns, may hallucinate
- Our tool: Real data, specific quotes, but no insights (just raw pain points)

**We lose on synthesis. We win on proof.**

### The Solution
**Add AI synthesis layer while keeping real data advantage.**

After extracting pain points, use Claude to:
1. Identify top 3-5 opportunity areas
2. Explain why each is ripe for AI
3. Surface current gaps in solutions
4. Provide market size signals (engagement, frequency)
5. Rate urgency (HIGH/MEDIUM/LOW)

**Result**: Real data + AI reasoning = Best of both worlds

---

## Three Key Features

### 1. Smart Keyword Expansion (Quick Win)
**Before**: User searches "startup" → misses "founder", "SaaS", "bootstrapping"
**After**: AI auto-expands to 5 related terms → searches all in parallel

**Implementation**: 2 hours
**Cost**: $0.001 per search (Haiku)
**Impact**: 2-3x more relevant posts

### 2. AI Synthesis Panel (Game Changer)
**Before**: 50 pain points with no context
**After**: "Top 5 opportunities: AI Code Review (15 mentions, $50M market, HIGH urgency)"

**Implementation**: 3 hours
**Cost**: $0.15 per search (Sonnet)
**Impact**: Transforms tool from data dump to strategic insights

### 3. Multi-Keyword Exploration (Power Mode)
**Before**: Single keyword, 135 posts, 50 pain points
**After**: 5 keywords × 6 sources = 500 posts → 120 pain points → 35 themes → 5 opportunities

**Implementation**: 2 hours
**Cost**: $0.27 per search
**Impact**: 3x data coverage + synthesis = beats Claude prompt

---

## Implementation Priority

### Week 1: Foundation
- [ ] Keyword expansion (2h)
- [ ] Reddit integration (3h)
- [ ] AI Synthesis Panel (3h)

**Milestone**: Search "startup" → get 5 keywords × 6 sources + AI opportunity analysis

### Week 2: Depth
- [ ] Multi-keyword exploration (2h)
- [ ] Product Hunt integration (3h)
- [ ] HN Comments expansion (1h)

**Milestone**: Exploration mode searches 35 angles (5 keywords × 7 sources)

### Week 3: Polish
- [ ] Cross-source validation badges (1h)
- [ ] Trend detection (3h)
- [ ] Export functionality (1h)

**Milestone**: Production-ready competitive product

---

## Expected Results

**Search**: "startup" + Exploration mode

**Process**:
1. Auto-expands → ["startup", "founder", "SaaS", "bootstrapping", "indie maker"]
2. Searches → 5 keywords × 7 sources = 35 parallel searches
3. Fetches → ~500 posts from HN, Dev.to, GitHub, SO, IH, Reddit, Product Hunt
4. Filters → ~300 relevant (semantic scoring)
5. Extracts → ~120 pain points
6. Clusters → ~35 unique themes
7. Synthesizes → Top 5 opportunities with AI analysis

**Output**:
```
🤖 AI Opportunity Analysis

Top 5 Opportunities:

1. AI Code Review Enhancement (15 mentions, avg score 82)
   🎯 Why AI fits: LLMs understand code context better than rule-based tools
   💡 Gap: Existing tools have too many false positives, miss contextual understanding
   📊 Market signal: Developers paying $50-100/mo for partial solutions
   ⚡ Urgency: HIGH - actively seeking better solutions NOW

   Related pain points:
   - "Code review takes too long" (HN, GitHub, SO)
   - "Inconsistent review quality" (Reddit, Dev.to)
   - "Hard to onboard junior devs" (GitHub, Indie Hackers)

2. [...]
```

**vs. Claude Prompt**:
- ✅ Real sources (not hallucinated)
- ✅ Recent data (30 days, not April 2025 cutoff)
- ✅ Specific quotes (provable)
- ✅ Synthesis (AI analysis layer)
- ✅ Cross-source validation (confidence signals)
- ⚠️ 40 seconds (vs <1s for Claude)

**Winner: Problem Signal Miner** (more trustworthy + more comprehensive)

---

## Cost & Pricing

**Per Search (Exploration Mode)**:
- Keyword expansion: $0.005
- Relevance scoring: $0.03
- Pain extraction: $0.06
- Clustering: $0.02
- Synthesis: $0.15
- **Total: $0.27**

**Pricing Strategy**:
- Free: 5 searches/day (no exploration) = $0.05/search
- Pro: $29/month (unlimited + exploration)
- Target: 70% margin at 10 searches/day average

---

## Risk Mitigation

**Technical**:
- Reddit rate limits → Cache results, batch requests
- Claude costs spike → Budget alerts, limit free tier
- Build timeouts → Use `tsc + eslint` for validation

**Product**:
- Synthesis quality → Test diverse queries, refine prompts
- Too slow (40s) → Caching, show clear progress
- User confusion → Clear explanations, examples

---

## Success Metrics

**User Goal**: Find startup opportunities worth pursuing

**Success** = User prefers our tool over asking Claude directly

**Measurements**:
1. User returns for 2nd, 3rd search (retention)
2. User copies opportunities (engagement)
3. User upgrades to Pro (conversion)
4. User shares results (virality)

**Week 1 Test**:
- Give 10 founders both tools
- Ask: "Which gave you better insights?"
- Target: 8/10 choose Problem Signal Miner

---

## Next Steps

1. **Review** this documentation with user
2. **Get approval** on approach
3. **Week 1**: Implement keyword expansion + Reddit + synthesis
4. **Deploy** to Vercel
5. **Test** with real searches
6. **Iterate** based on synthesis quality

---

## Questions for User

Before implementing:
1. Reddit API setup - do you have credentials or should we create new app?
2. Free tier limits - 5 searches/day reasonable?
3. Pro pricing - $29/month competitive for target market?
4. Feature priority - synthesis first or Reddit first?
5. Timeline - commit to 3-week roadmap or adjust scope?

---

## Files Reference

All documentation in this folder:
- `README.md` (this file) - Overview
- `IMPLEMENTATION_ROADMAP.md` - Full 3-week plan
- `ENHANCEMENT_PLAN.md` - Feature specifications
- `REDDIT_INTEGRATION.md` - Reddit setup guide
- `DATA_SOURCES_COMPARISON.md` - All sources ranked

Main friction log (project root):
- `../../FRICTION_LOG.md` - Today's learnings

Implementation files (coming soon):
- `lib/keyword-expansion.ts`
- `lib/synthesis.ts`
- `lib/reddit.ts`
- `components/SynthesisPanel.tsx`
