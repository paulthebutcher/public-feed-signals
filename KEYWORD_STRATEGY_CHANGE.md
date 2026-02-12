# Keyword Strategy Change - Topic Keywords vs Problem Phrases

## Problem Identified

**Root Cause:** The problem phrase strategy created a keyword matching bottleneck.

### What Was Happening:
```typescript
// Generated: "can't find product market fit"
// Source code: post.title.includes("can't find product market fit")
// Result: Almost NEVER matches (posts don't use exact long phrases)
```

**Evidence from production:**
- Only 9 pain points extracted from ~34 posts
- Should have been 100-150 posts reaching extraction
- Extraction rate dropped from 33% to 26.5%
- Pain points were off-topic (developer tools, not startup problems)

### Why Problem Phrases Failed:
1. **Too specific**: "can't find product market fit" vs "struggling with PMF"
2. **Wrong terminology**: People say "finding customers is hard", not the exact phrase we generated
3. **Substring matching**: `includes()` on 4-5 word phrases almost never matches
4. **Over-filtering**: 99% of posts filtered out before relevance scoring could help

---

## The Fix: Topic Keywords Strategy

**Changed:** Generate SHORT (1-2 word) common terms instead of long problem phrases

### Before (Problem Phrases):
```javascript
"startup" → [
  "can't find product market fit",
  "spending too much on tools",
  "struggling with pricing",
  "takes too long to get users"
]
```
- 4-5 words per phrase
- Very specific phrasing
- Rarely appears in posts
- **Result:** Almost no matches

### After (Topic Keywords):
```javascript
"startup" → [
  "founder",
  "entrepreneur",
  "bootstrapping",
  "saas",
  "indie",
  "business",
  "launch",
  "validation",
  "customers",
  "growth",
  "funding",
  "mvp"
]
```
- 1-2 words per keyword
- Common terminology
- Appears frequently in posts
- **Result:** Many more matches

---

## Why This Works Better

### 1. Higher Match Rate
- "founder" appears in thousands of posts
- "can't find product market fit" appears in maybe 5 posts
- **Expected improvement:** 20-50x more posts matched

### 2. Better Coverage
- 12 keywords vs 8 phrases = +50% coverage
- Each keyword targets a different aspect
- Casts a wider net for relevance scoring

### 3. Let Relevance Scoring Do Its Job
**The right division of labor:**
- **Keyword matching:** Broad filter (is this post about the topic area?)
- **Relevance scoring:** Semantic filter (does this post discuss problems?)
- **Pain point extraction:** Quality filter (what specific pain points exist?)

**Before:** Keyword matching was too strict, filtering out everything
**After:** Keyword matching is appropriately loose, letting semantic scoring filter

### 4. More Natural Language
People actually say:
- ✅ "as a founder, I'm struggling with..."
- ✅ "our saas can't find customers"
- ✅ "bootstrapping is harder than..."

People don't say:
- ❌ "can't find product market fit" (too formal)
- ❌ "spending too much on tools" (awkward phrasing)

---

## Expected Impact

### Volume Improvements:
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Keywords matched per post | 0-1 | 3-5 | +300-500% |
| Posts reaching relevance scoring | ~30 | ~150 | +400% |
| Posts reaching extraction | ~34 | ~100 | +200% |
| Final pain points | 9 | 25-35 | +180-290% |

### Quality Improvements:
- Relevance scoring can now filter semantically
- Topic keywords ensure posts are in the right domain
- Extraction rate should stabilize at 30-35%

---

## Example Flow

**User searches:** "startup"

**Keywords generated:**
```json
[
  "startup", "founder", "entrepreneur", "bootstrapping",
  "saas", "indie", "business", "launch", "validation",
  "customers", "growth", "funding", "mvp"
]
```

**Post matching:**
- HN post title: "Ask HN: How do founders find their first customers?"
  - ✅ Matches: "founder", "customers"
  - Would NOT match: "can't find product market fit"

- Dev.to article: "Building a SaaS as an indie maker"
  - ✅ Matches: "saas", "indie"
  - Would NOT match: "spending too much on tools"

**Relevance scoring:** Filters for posts discussing problems/pain points

**Pain point extraction:** Extracts specific pain points from relevant posts

---

## Technical Changes

### File: `lib/keyword-expansion.ts`

**Prompt changes:**
- Generate 10-12 keywords (was 8-10 phrases)
- Each keyword 1-2 words (was 2-5 words)
- Focus on common terms (was specific problems)
- Use industry jargon (was complaint phrases)

**Token limit:**
- Reduced from 500 to 300 (shorter keywords)

**Output validation:**
- Still returns 10-12 items
- Still includes original keyword

---

## Cost Impact

**Slightly cheaper:**
- Fewer tokens in prompt (shorter examples)
- Fewer tokens in response (shorter keywords)
- Same API call count
- **Estimate:** $0.0008 vs $0.001 per expansion

---

## Testing Strategy

1. Deploy to Vercel
2. Test with "startup" keyword
3. Check terminal logs for:
   - Keywords generated (should be short terms)
   - Posts matched per keyword (should be 20-50)
   - Total posts fetched (should be 150-250)
   - Relevant posts scored (should be 80-120)
   - Pain points extracted (should be 25-35)
4. Verify pain points are on-topic

---

## Rollback Plan

If results are worse:
1. Revert `lib/keyword-expansion.ts` to problem phrases
2. Consider Option 2: Break down phrases into individual words
3. Consider Option 3: Skip keyword filtering entirely

---

## Summary

**Root cause:** Problem phrases were too specific for substring matching
**Solution:** Short, common topic keywords that appear frequently
**Expected result:** 3-4x more posts → 3-4x more pain points (9 → 25-35)
**Extraction rate:** Should stay at 30-35% (quality maintained)
**Processing time:** Similar (~40-50s)
**Cost:** Slightly cheaper per search

This change restores the original proven strategy while keeping all volume optimizations intact.
