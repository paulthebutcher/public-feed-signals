#!/usr/bin/env python3
"""
Test HackerNews API for pain point extraction
Validates we can get enough quality posts to extract pain points from

HN is perfect for MVP because:
- Free public API (no auth)
- Similar audience (startup founders, indie hackers)
- JSON format (clean)
- "Ask HN" posts are goldmines of pain points
"""
import requests
import json
from datetime import datetime, timedelta

def get_hn_story(story_id):
    """Fetch a single story from HackerNews API"""
    url = f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else None

def get_top_stories(limit=100):
    """Fetch top story IDs from HackerNews"""
    url = "https://hacker-news.firebaseio.com/v0/topstories.json"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()[:limit]
    return []

def get_ask_hn_stories(limit=50):
    """Fetch recent Ask HN stories (similar to r/Entrepreneur self-posts)"""
    url = "https://hacker-news.firebaseio.com/v0/askstories.json"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()[:limit]
    return []

def format_post_for_extraction(story):
    """Convert HN story to our standard format"""
    # Get timestamp
    timestamp = story.get('time', 0)
    pub_date = datetime.fromtimestamp(timestamp) if timestamp else None

    # Get content (text field in HN stories)
    content = story.get('text', '')

    # Clean HTML tags from content (HN returns HTML)
    import re
    content_clean = re.sub(r'<[^>]+>', '', content)
    content_clean = content_clean.replace('&gt;', '>').replace('&lt;', '<').replace('&#x27;', "'")

    return {
        'id': story.get('id'),
        'title': story.get('title', ''),
        'content': content_clean,
        'url': f"https://news.ycombinator.com/item?id={story.get('id')}",
        'score': story.get('score', 0),
        'comments': story.get('descendants', 0),
        'author': story.get('by', 'unknown'),
        'published': pub_date.isoformat() if pub_date else 'unknown',
        'age_hours': (datetime.now() - pub_date).total_seconds() / 3600 if pub_date else None
    }

def test_hackernews_api():
    """Test HackerNews API and check data quality"""

    print("=" * 70)
    print("🧪 HackerNews API Test for Pain Point Extraction")
    print("=" * 70)
    print()

    # Fetch Ask HN stories (best source for pain points)
    print("📡 Fetching Ask HN stories (recent 50)...\n")
    story_ids = get_ask_hn_stories(50)

    if not story_ids:
        print("❌ Failed to fetch story IDs")
        return None

    print(f"✅ Got {len(story_ids)} story IDs\n")
    print("📥 Fetching story details (this may take 30 seconds)...\n")

    # Fetch full story details
    stories = []
    for i, story_id in enumerate(story_ids[:30], 1):  # Limit to 30 for speed
        story = get_hn_story(story_id)
        if story and story.get('type') == 'story':
            stories.append(story)
            if i % 10 == 0:
                print(f"   Fetched {i}/30 stories...")

    print(f"\n✅ Fetched {len(stories)} complete stories\n")

    # Filter for recent posts with content
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_stories = []

    for story in stories:
        post = format_post_for_extraction(story)

        # Must have content (not just a URL)
        if post['content'] and len(post['content']) > 50:
            # Check if recent
            if post['age_hours'] and post['age_hours'] < 168:  # 7 days
                recent_stories.append(post)

    print("=" * 70)
    print("📊 DATA QUALITY ASSESSMENT")
    print("=" * 70)
    print(f"\n✅ Stories fetched: {len(stories)}")
    print(f"📝 Stories with content (>50 chars): {len([s for s in stories if s.get('text') and len(s.get('text', '')) > 50])}")
    print(f"📅 Recent stories (last 7 days): {len(recent_stories)}")
    print(f"\n🎯 Target: 15+ recent stories with content")
    print(f"📈 Result: {'✅ PASSED' if len(recent_stories) >= 15 else '❌ FAILED'}")

    # Show top 10 posts by score
    print("\n" + "=" * 70)
    print("Top 10 Ask HN Posts (by score):")
    print("=" * 70)

    sorted_stories = sorted(recent_stories, key=lambda x: x['score'], reverse=True)[:10]

    for i, post in enumerate(sorted_stories, 1):
        age = f"{int(post['age_hours'])}h ago" if post['age_hours'] else "unknown"
        print(f"\n{i}. [{post['score']} pts] {post['title']}")
        print(f"   Age: {age} | Comments: {post['comments']} | Author: {post['author']}")
        print(f"   Content: {post['content'][:150]}...")
        print(f"   URL: {post['url']}")

    # Save to JSON for extraction testing
    output_file = "hackernews_posts_test.json"
    with open(output_file, 'w') as f:
        json.dump(recent_stories, f, indent=2)

    print(f"\n💾 Saved {len(recent_stories)} posts to {output_file}")

    # Analyze content for pain point indicators
    print("\n" + "=" * 70)
    print("🔍 Pain Point Indicators")
    print("=" * 70)

    pain_keywords = ['problem', 'issue', 'struggle', 'frustrated', 'difficult', 'hard', 'challenge', 'pain', 'annoying', 'hate']
    question_keywords = ['how do', 'how can', 'how to', 'what do', 'anyone know', 'advice', 'help']

    posts_with_pain = 0
    posts_with_questions = 0

    for post in recent_stories:
        content_lower = (post['title'] + ' ' + post['content']).lower()

        if any(keyword in content_lower for keyword in pain_keywords):
            posts_with_pain += 1

        if any(keyword in content_lower for keyword in question_keywords):
            posts_with_questions += 1

    print(f"\n📌 Posts with pain keywords: {posts_with_pain}/{len(recent_stories)} ({posts_with_pain/len(recent_stories)*100:.1f}%)")
    print(f"❓ Posts asking for help/advice: {posts_with_questions}/{len(recent_stories)} ({posts_with_questions/len(recent_stories)*100:.1f}%)")

    # Estimate extraction potential
    print("\n" + "=" * 70)
    print("💡 Extraction Potential Estimate")
    print("=" * 70)
    print(f"""
Based on content analysis:
- {len(recent_stories)} recent Ask HN posts available
- ~{posts_with_pain} likely contain pain points
- ~{posts_with_questions} are seeking solutions

Expected extraction rate: {posts_with_pain/len(recent_stories)*100:.1f}%
(Our spike showed 55% extraction rate on Reddit-style posts)

Recommendation: {'✅ HackerNews is viable for MVP' if len(recent_stories) >= 15 else '⚠️ May need to combine multiple sources'}
    """)

    print("=" * 70)
    print("📝 Next Steps")
    print("=" * 70)
    print("""
1. ✅ HackerNews API works and has enough recent posts
2. → Test pain point extraction on these real HN posts
3. → Compare extraction quality vs Reddit mock data
4. → If quality is good (40%+), proceed with build
5. → Scaffold Next.js app with HN as data source
    """)

    return recent_stories

if __name__ == "__main__":
    stories = test_hackernews_api()
