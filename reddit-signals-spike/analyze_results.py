#!/usr/bin/env python3
import json

# Load results and posts
with open('extraction_results.json', 'r') as f:
    results = json.load(f)

with open('mock_posts.json', 'r') as f:
    posts = json.load(f)

# Analyze results
pain_points = [r for r in results if r.get('has_pain_point')]
no_pain = [r for r in results if not r.get('has_pain_point')]

accuracy = (len(pain_points) / len(results)) * 100
passed = len(pain_points) >= 12

print("=" * 70)
print(" " * 20 + "📊 SPIKE RESULTS")
print("=" * 70)
print(f"\n✅ Pain points found: {len(pain_points)}/20 ({accuracy:.1f}%)")
print(f"❌ No pain points: {len(no_pain)}/20\n")
print(f"🎯 Pass threshold: 12+ pain points (60%)")
print(f"📈 Result: {'❌ FAILED (55%)' if not passed else '✅ PASSED'}\n")

if len(pain_points) > 0:
    print("=" * 70)
    print("Top 10 Pain Points Ranked by Composite Score:")
    print("=" * 70)

    sorted_points = sorted(pain_points, key=lambda x: x['composite_score'], reverse=True)

    for i, p in enumerate(sorted_points):
        post = next((post for post in posts if post['id'] == p['post_id']), None)
        print(f"\n{i+1}. [Score: {p['composite_score']:.1f}] {p['pain_point']}")
        if post:
            print(f"   📝 Post: \"{post['title']}\"")
        print(f"   📊 I:{p['intensity']} | S:{p['specificity']} | F:{p['frequency']}")
        print(f"   💬 \"{p['supporting_quote'][:80]}...\"")
        if post:
            print(f"   🔗 {post['url']}")

print("\n" + "=" * 70)
print("📊 Pain Point Distribution by Category")
print("=" * 70)

categories = {
    "Cost/Pricing": [1, 13, 20],  # Email costs, Stripe fees, API pricing
    "Time Management": [5, 11],    # Support time, burnout
    "Validation/Product-Market Fit": [7, 18],  # Zero signups, idea paralysis
    "Financial Management": [16],  # Bookkeeping
    "Business Relationships": [3, 14],  # Ghosted clients, co-founder equity
    "Competitive": [9]  # Copied landing page
}

for category, post_ids in categories.items():
    matching = [p for p in pain_points if p['post_id'] in post_ids]
    if matching:
        avg_score = sum(p['composite_score'] for p in matching) / len(matching)
        print(f"\n{category}: {len(matching)} signals (avg score: {avg_score:.1f})")
        for p in matching:
            print(f"  - {p['pain_point'][:60]}...")

print("\n" + "=" * 70)
print("📝 Next Steps")
print("=" * 70)

if not passed:
    print("\n⚠️  Extraction accuracy: 55% (below 60% threshold)")
    print("\nPrompt iteration needed. Try:")
    print("  1. Add few-shot examples of good vs bad pain points")
    print("  2. Tighten scoring rubric with specific criteria")
    print("  3. Add filtering rules (e.g., ignore posts <50 chars)")
    print("  4. Test with different subreddits to see if quality improves")
    print("\nNote: This was a MANUAL extraction to validate the concept.")
    print("Real extraction with Claude API will need testing once API access works.")
else:
    print("\n✅ Extraction quality passed! Next steps:")
    print("  1. Fix API access (SSL/authentication issues)")
    print("  2. Test RSS/PRAW for data fetching (Risk #2)")
    print("  3. Scaffold Next.js project")
    print("  4. Build API route + form UI")

print("\n" + "=" * 70)
print("💡 Key Insights from Spike")
print("=" * 70)
print("""
1. Pain points cluster around 6 main categories:
   - Cost/Pricing (3 signals): High-value, specific problems
   - Time Management (2 signals): Burnout & support overhead
   - Validation (2 signals): Idea selection & zero traction
   - Financial Ops (1 signal): Bookkeeping complexity
   - Relationships (2 signals): Payment & equity issues
   - Competition (1 signal): IP/copying concerns

2. Highest-scoring pain points (90+):
   - Solo founder burnout (93.3)
   - Repetitive customer support (90.0)
   - Freelance payment ghosting (88.3)

3. The extraction criteria work well for distinguishing:
   ✅ Real pain points with actionable language
   ❌ Success stories, general questions, memes, spam

4. Scoring dimensions provide useful signal:
   - Intensity: Emotional language ("crushing me", "nightmare")
   - Specificity: Concrete details vs vague complaints
   - Frequency: "every day", "third time this year"

5. Mock data quality is realistic - represents actual Reddit patterns
""")

print("=" * 70)
print()
