# Data Source Comparison

## Current Sources (5)

| Source | Volume | Quality | Implementation | Cost | Status |
|--------|--------|---------|----------------|------|--------|
| HackerNews | ~10 posts/search | Very High (tech-focused) | ✅ Implemented | Free | ✅ Live |
| Dev.to | ~40 posts/search | High (developer audience) | ✅ Implemented | Free | ✅ Live |
| Indie Hackers | ~40 posts/search | High (founder-specific) | ✅ Implemented | Free | ✅ Live |
| GitHub Issues | ~25 posts/search | High (specific pain points) | ✅ Implemented | Free | ✅ Live |
| Stack Overflow | ~20 posts/search | Medium (Q&A format) | ✅ Implemented | Free | ✅ Live |

**Total**: ~135 posts per search

---

## Proposed Additional Sources

### Priority 1: Reddit
| Metric | Value |
|--------|-------|
| Volume | ~150 posts/search |
| Quality | High (targeted subreddits) |
| Implementation Difficulty | Medium (OAuth required) |
| API Cost | Free |
| Rate Limits | 60 req/min |
| Unique Value | Massive volume, subreddit targeting, long-form discussions |

**Target Subreddits**:
- r/startups (1M members) - founder problems
- r/SaaS (150K) - product/pricing issues
- r/Entrepreneur (3M) - business operations
- r/webdev (2M) - technical challenges
- r/indiebiz (50K) - indie maker pain points
- r/freelance (500K) - freelance-specific
- r/smallbusiness (1M) - SMB challenges
- r/digitalnomad (1M) - remote work issues

**Implementation**: See REDDIT_INTEGRATION.md

---

### Priority 2: Product Hunt Comments
| Metric | Value |
|--------|-------|
| Volume | ~20 posts/search |
| Quality | Very High (product feedback) |
| Implementation Difficulty | Medium (GraphQL API or scraping) |
| API Cost | Free |
| Rate Limits | Unclear |
| Unique Value | People explicitly discuss what's missing in existing products |

**Why It's Valuable**:
- Users complain about specific product limitations
- "I love X but wish it had Y" = gap analysis
- Upvoted comments = validated problems
- Recent products = emerging problem spaces

**Example Pain Points**:
```
Product: AI code assistant
Comment (150 upvotes): "Great start but it doesn't understand our codebase
context. Would pay 2x if it could learn our patterns."

→ Pain Point: Context-aware code assistance
→ Market Signal: Willingness to pay 2x current price
→ Opportunity: Better code context integration
```

**Implementation**:
```typescript
// lib/producthunt.ts
export async function searchProductHunt(keywords: string, limit: number = 20) {
  // 1. Search for products matching keywords
  const products = await searchProducts(keywords);

  // 2. Fetch top comments from each product
  const commentsPromises = products.map(p => getProductComments(p.id));
  const allComments = (await Promise.all(commentsPromises)).flat();

  // 3. Filter for problem statements
  const painPoints = allComments.filter(c =>
    c.votes > 5 && // Validated by community
    (c.body.includes('wish') || c.body.includes('missing') || c.body.includes('but'))
  );

  return painPoints;
}
```

---

### Priority 3: HN Comments (Expand from Ask HN)
| Metric | Value |
|--------|-------|
| Volume | +40 posts/search (50 total from HN) |
| Quality | Very High |
| Implementation Difficulty | Easy (same API) |
| API Cost | Free |
| Rate Limits | None enforced |
| Unique Value | Expand from Ask HN stories to all story comments |

**Current**: Only fetches Ask HN stories (submissions)
**Proposed**: Also scan comments on regular HN stories where people discuss problems

**Example**:
```
Story: "New AI coding tool launches"
Comment (125 pts): "The problem with these tools is they don't understand
legacy code. We have 10 years of technical debt and none of these AI assistants
can navigate it."

→ Pain Point: AI tools don't handle legacy codebases
→ Validated: 125 upvotes
→ Specific: 10 years of technical debt
```

**Implementation**:
```typescript
// lib/hackernews.ts - EXPAND
export async function searchHNComments(keywords: string, limit: number = 50) {
  // 1. Get top/new stories (not just Ask HN)
  const storyIds = await getTopStoryIds(100);

  // 2. Fetch full stories + comments
  const stories = await Promise.all(storyIds.map(getHNStory));

  // 3. Search comments for problem statements
  const problemComments = stories
    .flatMap(s => extractCommentsWithProblems(s, keywords))
    .filter(c => c.score > 10); // Only upvoted comments

  return problemComments;
}
```

---

### Priority 4: Lobsters
| Metric | Value |
|--------|-------|
| Volume | ~15 posts/search |
| Quality | Very High (curated tech community) |
| Implementation Difficulty | Easy (RSS feed) |
| API Cost | Free |
| Rate Limits | None |
| Unique Value | More technical depth than HN, less noise |

**Why It's Valuable**:
- Invite-only community = higher signal
- More in-depth technical discussions
- Less startup hype, more real engineering problems

**Implementation**:
```typescript
// lib/lobsters.ts
export async function searchLobsters(keywords: string, limit: number = 15) {
  // Fetch RSS feed
  const response = await fetch('https://lobste.rs/rss');
  const xml = await response.text();

  // Parse and filter
  const items = parseRSS(xml);
  const filtered = items.filter(item =>
    matchesKeywords(item.title + item.description, keywords)
  );

  return filtered.slice(0, limit);
}
```

---

### Priority 5: Twitter/X
| Metric | Value |
|--------|-------|
| Volume | ~100 posts/search |
| Quality | Medium (lots of noise) |
| Implementation Difficulty | Hard (API costs $100-200/mo) |
| API Cost | $100-200/month |
| Rate Limits | Varies by tier |
| Unique Value | Real-time complaints, viral discussions |

**Why It's Valuable**:
- Real-time problem discovery
- Viral threads = strong signals
- Quote tweets = people sharing frustrations
- Search operators powerful

**Search Patterns**:
```
"why is there no tool for X"
"so frustrated with Y"
"wish there was a way to Z"
"does anyone have a solution for"
"looking for recommendations for"
```

**Implementation Decision**:
- ❌ Don't implement initially (high cost, medium quality)
- ✅ Add later if Reddit proves valuable
- ✅ Alternative: Let users provide their own Twitter API key

---

## Source Priority Ranking

### Immediate (This Week)
1. **Reddit** - Massive volume boost, targeted communities
2. **HN Comments** - Easy implementation, high quality

### Short-term (Next 2 Weeks)
3. **Product Hunt** - Unique insight into product gaps
4. **Lobsters** - High signal, easy to add

### Future (Optional)
5. **Twitter** - Only if willing to pay $100-200/mo
6. **Discord/Slack** - Requires community partnerships
7. **LinkedIn** - No good API access
8. **Quora** - Medium quality, easy to scrape

---

## Expected Impact

### Current State
- 5 sources × ~27 posts each = **135 posts/search**
- After filtering: ~90 posts
- After extraction: ~50 pain points
- After clustering: ~20 unique themes

### After Reddit + HN Comments
- 7 sources × varying volume = **320 posts/search**
  - HN: 50 (expanded)
  - Dev.to: 40
  - Indie Hackers: 40
  - GitHub: 25
  - Stack Overflow: 20
  - **Reddit: 150 (new)**
  - Lobsters: 15 (future)

- After filtering: ~200 posts
- After extraction: ~100 pain points
- After clustering: ~30 unique themes

**Improvement**: 2.4x more posts, 2x more pain points, 50% more unique themes

---

## Implementation Checklist

### Reddit
- [ ] Create Reddit app for credentials
- [ ] Implement OAuth flow
- [ ] Add subreddit targeting
- [ ] Handle rate limiting
- [ ] Update UI badges
- [ ] Test with live searches

### HN Comments
- [ ] Expand beyond Ask HN
- [ ] Add comment parsing
- [ ] Filter by upvotes
- [ ] Combine with existing HN integration

### Product Hunt
- [ ] Research GraphQL API
- [ ] Implement product search
- [ ] Fetch comment threads
- [ ] Filter for problem statements

### Lobsters
- [ ] Add RSS parsing
- [ ] Implement keyword matching
- [ ] Add to sources rotation
