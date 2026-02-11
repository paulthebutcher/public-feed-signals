# Implementation Roadmap - Third Pass

**Goal**: Transform Problem Signal Miner from "pain point finder" to "opportunity analyzer"

**Success Metric**: Beat a Claude prompt like "what challenges are startups facing today that are ripe for AI disruption"

---

## Current State

**Strengths**:
- ✅ Real data from real people (not hallucinated)
- ✅ 5 data sources (HN, Dev.to, GitHub, SO, Indie Hackers)
- ✅ Semantic search (finds related concepts)
- ✅ Pain point clustering (deduplicates similar problems)
- ✅ 3-dimension scoring (intensity, specificity, frequency)
- ✅ Collapsible cards (scan 20+ results quickly)
- ✅ Progress indicators (real-time feedback)

**Weaknesses**:
- ❌ Single keyword only (misses related searches)
- ❌ No synthesis/insights (just raw data)
- ❌ No trend detection (what's heating up?)
- ❌ No cross-source validation (confidence signals)
- ❌ Limited exploration (can't search multiple angles)
- ❌ Takes 30 seconds with no caching

**vs. Claude Prompt**:
| Feature | Miner | Claude Prompt |
|---------|-------|---------------|
| Real sources | ✅ | ❌ (may hallucinate) |
| Recent data | ✅ (30 days) | ❌ (April 2025 cutoff) |
| Specific quotes | ✅ | ❌ |
| Synthesis | ❌ | ✅ |
| Instant | ❌ (30s) | ✅ (<1s) |
| Exploration | ❌ | ✅ |

**Gap to close**: Add synthesis + exploration while keeping real data advantage

---

## Phase 1: Smart Search (Week 1)

### 1.1 Keyword Expansion
**What**: User types "startup" → AI expands to ["founder", "SaaS", "bootstrapping", "indie maker", "early stage"]

**Why**: Catches related discussions user wouldn't think to search

**Implementation**:
- New file: `lib/keyword-expansion.ts`
- Uses Claude Haiku (cheap + fast)
- Returns 4-6 related terms
- Cost: ~$0.001 per search

**UI**: Show expanded keywords as chips below search box

**Time**: 2 hours

### 1.2 Reddit Integration
**What**: Add Reddit as 6th data source (150 posts per search)

**Why**: Massive volume boost, targeted subreddits

**Implementation**:
- New file: `lib/reddit.ts`
- Target subreddits: r/startups, r/SaaS, r/Entrepreneur, r/webdev, r/indiebiz, r/freelance, r/smallbusiness, r/digitalnomad
- Uses official Reddit API (OAuth required)
- Rate limit: 60 req/min (plenty of headroom)
- Cost: Free

**Setup**:
1. Create Reddit app at https://www.reddit.com/prefs/apps
2. Add credentials to `.env.local`:
   ```
   REDDIT_CLIENT_ID=...
   REDDIT_CLIENT_SECRET=...
   REDDIT_USER_AGENT=ProblemSignalMiner/1.0
   ```

**UI**: Add Reddit badge to PainPointCard

**Time**: 3 hours

**Expected Impact**: 135 posts → 285 posts per search (2.1x increase)

---

## Phase 2: AI Synthesis (Week 1-2)

### 2.1 Synthesis Panel
**What**: After showing pain points, Claude analyzes and identifies top opportunities

**Why**: This is the "beat Claude prompt" feature

**Implementation**:
- New file: `lib/synthesis.ts`
- New component: `components/SynthesisPanel.tsx`
- Uses Claude Sonnet (high quality reasoning)
- Analyzes all clustered pain points
- Returns:
  - Top 3-5 opportunity areas
  - Why each is ripe for AI
  - Current gaps in solutions
  - Market size signals
  - Urgency level
- Cost: ~$0.15 per search

**UI**: New section after pain points with:
- 🤖 AI Opportunity Analysis header
- Cards for each opportunity with:
  - Title + urgency badge
  - Why AI fits
  - Current gaps (bullets)
  - Market signals (bullets)
  - Related pain points count

**Time**: 3 hours

**Expected Impact**: Transforms tool from "data dump" to "strategic insights"

---

## Phase 3: Exploration Mode (Week 2)

### 3.1 Multi-Keyword Search
**What**: Search 5 related keywords in parallel, then cluster across all results

**Why**: Comprehensive coverage of problem space (not just one angle)

**Implementation**:
- Combine keyword expansion (#1.1) with parallel search
- Update `app/api/extract/route.ts` to handle exploration mode
- Fetch: 5 keywords × 6 sources = 30 searches in parallel
- Cluster: Merge all results and cluster across keywords
- Synthesize: Analyze combined dataset

**UI**:
- Add checkbox: "🔍 Exploration mode"
- Show expanded keywords during search
- Update stats to show keyword count

**Cost**: ~$0.22 per search (5x keyword expansion + synthesis)

**Time**: 2 hours

**Expected Impact**: 135 posts → 400+ posts per search (3x increase)

---

## Phase 4: Additional Sources (Week 2-3)

### 4.1 HN Comments (Expand beyond Ask HN)
**What**: Search comments on regular HN stories, not just Ask HN submissions

**Why**: 5x more HN content (10 posts → 50 posts)

**Implementation**:
- Expand `lib/hackernews.ts`
- Fetch top/new stories
- Extract comments with problem statements
- Filter by upvotes (score > 10)

**Time**: 1 hour

### 4.2 Product Hunt Comments
**What**: Extract pain points from Product Hunt product comments

**Why**: People explicitly discuss what's missing in products

**Implementation**:
- New file: `lib/producthunt.ts`
- Search products matching keywords
- Fetch comment threads
- Filter for complaints/feature requests (upvotes > 5)

**Time**: 3 hours

### 4.3 Lobsters
**What**: Add Lobsters as data source (curated tech community)

**Why**: Higher signal than HN, technical depth

**Implementation**:
- New file: `lib/lobsters.ts`
- Fetch RSS feed
- Parse and filter by keywords

**Time**: 1 hour

---

## Phase 5: Polish & Optimization (Week 3)

### 5.1 Cross-Source Validation
**What**: Badge pain points found across multiple sources

**Why**: Confidence signal (HN + GitHub + SO = strong validation)

**Implementation**:
- Track which sources mention similar problems during clustering
- Add validation badge: "⚡ Validated across 3 sources"
- Show in card header

**Time**: 1 hour

### 5.2 Trend Detection
**What**: Compare last 30 days vs previous 30 days, show what's heating up

**Why**: Identify emerging problems before they're obvious

**Implementation**:
- Fetch data for two time windows
- Compare mention counts
- Show 📈 "Heating up: +45%" or 📉 "Cooling down: -20%"

**Time**: 3 hours

### 5.3 Export Functionality
**What**: Export results to CSV/JSON for further analysis

**Why**: Power users want to analyze in spreadsheets/notebooks

**Implementation**:
- Add export button to results
- Generate CSV with all pain points + scores
- Download to user's machine

**Time**: 1 hour

---

## Implementation Schedule

### Week 1 (High Impact)
**Monday-Tuesday**:
- [x] Documentation (this file)
- [ ] Keyword expansion (2h)
- [ ] Reddit integration (3h)

**Wednesday-Thursday**:
- [ ] AI Synthesis Panel (3h)
- [ ] Testing & refinement (2h)

**Friday**:
- [ ] Multi-keyword exploration mode (2h)
- [ ] Deploy to Vercel
- [ ] Test with real searches

**Expected Result**: User searches "startup" → gets 5 related keywords × 6 sources with AI opportunity analysis

### Week 2 (Depth)
**Monday-Tuesday**:
- [ ] HN Comments expansion (1h)
- [ ] Product Hunt integration (3h)
- [ ] Lobsters integration (1h)

**Wednesday-Thursday**:
- [ ] Cross-source validation (1h)
- [ ] Testing new sources (2h)
- [ ] UI polish (1h)

**Friday**:
- [ ] Deploy & test
- [ ] Document learnings

**Expected Result**: 7 sources × 5 keywords = 35 searches, validated pain points

### Week 3 (Polish)
**Monday-Tuesday**:
- [ ] Trend detection (3h)
- [ ] Export functionality (1h)

**Wednesday-Thursday**:
- [ ] Performance optimization (2h)
- [ ] Cost analysis (1h)

**Friday**:
- [ ] Final deploy
- [ ] User testing
- [ ] Retrospective

---

## Success Metrics

**Before**:
- Search: "startup"
- Results: ~50 pain points from 135 posts
- Time: 30 seconds
- Insight: None (raw data only)

**After**:
- Search: "startup" + Exploration mode
- Auto-expands: ["startup", "founder", "SaaS", "bootstrapping", "indie maker"]
- Fetches: 5 keywords × 7 sources = 35 searches = ~500 posts
- Filters: ~300 relevant posts (semantic scoring)
- Extracts: ~120 pain points
- Clusters: ~35 unique themes
- Synthesizes: Top 5 opportunities with AI analysis
- Time: ~40 seconds
- Insight: **"AI Code Review Enhancement is a $50M opportunity based on 15 validated pain points across HN, GitHub, and Reddit with developers already paying $50-100/mo for incomplete solutions"**

**Comparison to Claude Prompt**:
| Metric | Miner | Claude Prompt | Winner |
|--------|-------|---------------|--------|
| Real sources | ✅ Yes | ❌ May hallucinate | Miner |
| Recent data | ✅ Last 30 days | ❌ April 2025 cutoff | Miner |
| Specific quotes | ✅ Yes | ❌ No | Miner |
| Synthesis | ✅ Yes | ✅ Yes | Tie |
| Speed | ⚠️ 40s | ✅ <1s | Claude |
| Exploration | ✅ Multi-angle | ✅ Yes | Tie |
| Confidence | ✅ Cross-source validation | ❌ No sources | Miner |

**Winner: Problem Signal Miner** (6 vs 2, with 2 ties)

---

## Cost Structure

**Per Search (Exploration Mode)**:
- Keyword expansion (5 keywords): $0.005
- Relevance scoring (300 posts): $0.03
- Pain extraction (300 posts): $0.06
- Clustering (120 pain points): $0.02
- Synthesis (35 clusters): $0.15
- **Total: ~$0.27 per search**

**Monthly Costs** (1000 searches/month):
- API costs: $270
- Vercel hosting: $20
- Total: $290/month

**Pricing Strategy**:
- Free tier: 5 searches/day (no exploration mode) = ~$0.05/search = $7.50/month cost
- Pro tier: $29/month (unlimited + exploration) = breakeven at 107 searches/month
- Target margin: 70% (10 searches/day average = $80 cost, $29 revenue = loss leader for conversion)

---

## Risk Mitigation

### Technical Risks
1. **Reddit API rate limits** (60/min)
   - Mitigation: Cache results, batch requests, monitor usage

2. **Claude API costs spike**
   - Mitigation: Set budget alerts, limit free tier, optimize prompts

3. **Build timeouts in VM**
   - Mitigation: Use `tsc + eslint` for validation, Vercel for true builds

4. **Type errors in new sources**
   - Mitigation: Interface-first approach, run `tsc --noEmit` after each addition

### Product Risks
1. **Synthesis quality varies**
   - Mitigation: Test with diverse queries, refine prompts, show confidence scores

2. **Too slow (40s)**
   - Mitigation: Add caching, parallel fetching, show progress clearly

3. **User doesn't understand synthesis**
   - Mitigation: Clear explanations, tooltips, examples in "How it works"

---

## Next Actions

1. **Immediate** (Today):
   - [x] Create documentation (this file + supporting docs)
   - [x] Update FRICTION_LOG with learnings
   - [ ] Review with user for approval

2. **Week 1 Start** (After approval):
   - [ ] Set up Reddit API credentials
   - [ ] Implement keyword expansion
   - [ ] Test with live searches
   - [ ] Implement AI synthesis panel
   - [ ] Deploy to Vercel

3. **Ongoing**:
   - [ ] Track costs daily (set up budget alert)
   - [ ] Monitor synthesis quality
   - [ ] Gather user feedback
   - [ ] Iterate on prompts
