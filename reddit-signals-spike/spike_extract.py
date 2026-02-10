#!/usr/bin/env python3
import json
import requests
import sys

# Load mock posts
with open('mock_posts.json', 'r') as f:
    posts = json.load(f)

# Format posts for prompt
posts_text = []
for post in posts:
    posts_text.append(f"""POST {post['id']}: {post['title']}
Content: {post['content']}
URL: {post['url']}
""")

posts_formatted = "\n---\n\n".join(posts_text)

# Create extraction prompt
prompt = f"""You are analyzing Reddit posts from r/Entrepreneur to extract actionable pain points that indie hackers could build products around.

For each post below, identify:
1. Is there a genuine pain point or problem being expressed? (not just a meme, joke, or off-topic discussion)
2. If yes, extract the specific pain point
3. Score the pain point on three dimensions (0-100):
   - **Intensity**: How frustrated/desperate does the person sound? (0=mild annoyance, 100=extreme frustration)
   - **Specificity**: How actionable is the problem? (0=vague complaint, 100=specific workflow pain)
   - **Frequency**: Based on language, does this seem like a recurring problem? (0=one-time issue, 100=ongoing struggle)

POSTS TO ANALYZE:
{posts_formatted}

Return your analysis as a JSON array. For each post, either:
- If NO actionable pain point: {{"post_id": N, "has_pain_point": false, "reason": "brief reason"}}
- If YES pain point found: {{
    "post_id": N,
    "has_pain_point": true,
    "pain_point": "concise description of the problem",
    "intensity": 0-100,
    "specificity": 0-100,
    "frequency": 0-100,
    "composite_score": (intensity + specificity + frequency) / 3,
    "supporting_quote": "direct quote from post showing the pain"
  }}

Only extract REAL pain points. Be strict. Reject:
- Memes, jokes, sarcasm
- Success stories without a problem
- General discussions without a specific complaint
- Self-promotional posts
- Off-topic content

Return ONLY valid JSON, no other text."""

# Call Claude API
print("🤖 Calling Claude API for extraction...\n")

response = requests.post(
    "https://api.anthropic.com/v1/messages",
    headers={
        "content-type": "application/json",
        "x-api-key": "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",
        "anthropic-version": "2023-06-01"
    },
    json={
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4000,
        "messages": [{
            "role": "user",
            "content": prompt
        }]
    }
)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
    sys.exit(1)

result = response.json()

# Extract the response text
response_text = result['content'][0]['text']

# Try to parse as JSON
try:
    # Find JSON array in response
    import re
    json_match = re.search(r'\[[\s\S]*\]', response_text)
    if not json_match:
        print("❌ No JSON array found in response")
        print("Response:", response_text[:500])
        sys.exit(1)

    extraction_results = json.loads(json_match.group(0))

    # Save results
    with open('extraction_results.json', 'w') as f:
        json.dump(extraction_results, f, indent=2)

    print(f"✅ Extraction complete")
    print(f"💾 Results saved to extraction_results.json\n")

    # Analyze results
    pain_points = [r for r in extraction_results if r.get('has_pain_point')]
    no_pain = [r for r in extraction_results if not r.get('has_pain_point')]

    accuracy = (len(pain_points) / len(extraction_results)) * 100
    passed = len(pain_points) >= 12

    print("=" * 60)
    print("📊 SPIKE RESULTS")
    print("=" * 60)
    print(f"\n✅ Pain points found: {len(pain_points)}/20 ({accuracy:.1f}%)")
    print(f"❌ No pain points: {len(no_pain)}/20")
    print(f"\n🎯 Pass threshold: 12+ pain points (60%)")
    print(f"📈 Result: {'✅ PASSED' if passed else '❌ FAILED'}\n")

    if len(pain_points) > 0:
        print("Top 5 Pain Points by Composite Score:\n")
        sorted_points = sorted(pain_points, key=lambda x: x['composite_score'], reverse=True)[:5]

        for i, p in enumerate(sorted_points):
            post = next((post for post in posts if post['id'] == p['post_id']), None)
            print(f"{i+1}. [Score: {p['composite_score']:.1f}] {p['pain_point']}")
            if post:
                print(f"   Post: \"{post['title']}\"")
            print(f"   Intensity: {p['intensity']} | Specificity: {p['specificity']} | Frequency: {p['frequency']}")
            print(f"   Quote: \"{p['supporting_quote'][:100]}...\"")
            if post:
                print(f"   URL: {post['url']}")
            print()

    print("=" * 60)
    print("\n📝 Next Steps:")
    if passed:
        print("✅ Extraction quality passed! Move to next phase:")
        print("   1. Test RSS/PRAW for data fetching (Risk #2)")
        print("   2. Scaffold Next.js project")
        print("   3. Build API route + form UI")
    else:
        print("⚠️  Extraction quality below threshold. Options:")
        print("   1. Iterate prompt (try different scoring rubric)")
        print("   2. Add few-shot examples")
        print("   3. Simplify to just extract quotes without scoring")

except Exception as e:
    print(f"❌ Failed to parse results: {e}")
    print("Raw response:", response_text[:1000])
    sys.exit(1)
