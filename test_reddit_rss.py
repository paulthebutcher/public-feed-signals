#!/usr/bin/env python3
"""
Test script to verify Reddit RSS feeds work and contain usable data
Tests Risk #2: RSS feed viability (need 15+ posts from last 7 days)
"""
import requests
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET
import json

def test_reddit_rss(subreddit="Entrepreneur"):
    """Fetch and parse Reddit RSS feed"""

    url = f"https://www.reddit.com/r/{subreddit}/.rss"

    print(f"📡 Testing Reddit RSS for r/{subreddit}")
    print(f"   URL: {url}\n")

    # Reddit requires a User-Agent header to avoid being blocked
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # Check if we got XML (RSS) or HTML
        content_type = response.headers.get('Content-Type', '')
        if 'html' in content_type.lower():
            print(f"❌ FAILED: Got HTML instead of RSS")
            print(f"   Content-Type: {content_type}")
            print(f"   This means Reddit blocked the request or RSS endpoint changed")
            print(f"\n   Try:")
            print(f"   1. Add more realistic User-Agent header")
            print(f"   2. Use old.reddit.com instead of www.reddit.com")
            print(f"   3. Use PRAW library with proper authentication")
            return None

        # Parse RSS XML
        root = ET.fromstring(response.content)

        # Find all entries (posts)
        # RSS 2.0 uses <item>, Atom uses <entry>
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        entries = root.findall('.//atom:entry', namespace) or root.findall('.//item')

        if not entries:
            print(f"⚠️  Warning: RSS parsed but found 0 entries")
            print(f"   Namespaces in XML: {root.tag}")
            return None

        print(f"✅ RSS feed fetched successfully")
        print(f"📊 Found {len(entries)} posts\n")

        # Extract post data
        posts = []
        seven_days_ago = datetime.now() - timedelta(days=7)

        for i, entry in enumerate(entries[:25], 1):  # Limit to 25 posts
            # Handle both RSS and Atom formats
            title_elem = entry.find('.//atom:title', namespace) or entry.find('title')
            link_elem = entry.find('.//atom:link', namespace) or entry.find('link')
            published_elem = entry.find('.//atom:published', namespace) or entry.find('pubDate')
            content_elem = entry.find('.//atom:content', namespace) or entry.find('description')
            author_elem = entry.find('.//atom:author', namespace) or entry.find('author')

            # Extract text
            title = title_elem.text if title_elem is not None else "No title"
            link = link_elem.get('href') if link_elem is not None and link_elem.get('href') else (link_elem.text if link_elem is not None else "No link")
            published = published_elem.text if published_elem is not None else "Unknown date"
            content = content_elem.text if content_elem is not None else ""
            author = author_elem.text if author_elem is not None else "Unknown"

            # Try to parse date
            try:
                # Try ISO format first (Atom)
                post_date = datetime.fromisoformat(published.replace('Z', '+00:00').replace('+00:00', ''))
            except:
                try:
                    # Try RFC 2822 format (RSS)
                    from email.utils import parsedate_to_datetime
                    post_date = parsedate_to_datetime(published)
                except:
                    post_date = None

            posts.append({
                'id': i,
                'title': title,
                'url': link,
                'published': published,
                'content': content[:200] + '...' if len(content) > 200 else content,
                'author': author,
                'is_recent': post_date and post_date >= seven_days_ago if post_date else None
            })

        # Analyze results
        recent_posts = [p for p in posts if p['is_recent'] is True]

        print("=" * 70)
        print("📊 RISK #2 VALIDATION: RSS Feed Viability")
        print("=" * 70)
        print(f"\n✅ Total posts fetched: {len(posts)}")
        print(f"📅 Recent posts (last 7 days): {len(recent_posts)}")
        print(f"\n🎯 Target: 15+ posts from last 7 days")
        print(f"📈 Result: {'✅ PASSED' if len(recent_posts) >= 15 else '❌ FAILED'}")

        # Show first 5 posts
        print("\n" + "=" * 70)
        print("First 5 Posts:")
        print("=" * 70)
        for p in posts[:5]:
            print(f"\n{p['id']}. {p['title']}")
            print(f"   Published: {p['published']}")
            print(f"   Recent: {p['is_recent']}")
            print(f"   Content: {p['content'][:100]}...")
            print(f"   URL: {p['url'][:80]}...")

        # Save to JSON
        output_file = f"reddit_rss_{subreddit}_test.json"
        with open(output_file, 'w') as f:
            json.dump(posts, f, indent=2)

        print(f"\n💾 Saved {len(posts)} posts to {output_file}")
        print("\n" + "=" * 70)

        if len(recent_posts) >= 15:
            print("\n✅ RSS FEED VIABLE - Proceed with RSS-based scraper")
        else:
            print("\n⚠️  RSS FEED NOT VIABLE - Consider alternatives:")
            print("   1. Use PRAW (Python Reddit API Wrapper) with authentication")
            print("   2. Combine data from multiple subreddits")
            print("   3. Reduce time window (last 3 days instead of 7)")

        return posts

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        print(f"\n   Reddit may be blocking requests without authentication")
        print(f"   Recommendation: Use PRAW library with API credentials")
        return None
    except ET.ParseError as e:
        print(f"❌ XML parsing failed: {e}")
        print(f"   The response is not valid RSS/XML")
        # Save response for debugging
        with open('reddit_response_debug.txt', 'wb') as f:
            f.write(response.content)
        print(f"   Saved response to reddit_response_debug.txt for inspection")
        return None

if __name__ == "__main__":
    print("🧪 Reddit RSS Feed Test\n")

    # Test with r/Entrepreneur
    posts = test_reddit_rss("Entrepreneur")

    if posts:
        print("\n" + "=" * 70)
        print("📝 Next Steps")
        print("=" * 70)
        print("""
If RSS passed:
  1. ✅ Both risks validated (extraction quality + RSS viability)
  2. → Scaffold Next.js project
  3. → Build /api/extract endpoint
  4. → Create simple form UI

If RSS failed:
  1. Set up PRAW authentication:
     - Go to: https://www.reddit.com/prefs/apps
     - Create app (script type)
     - Get client_id, client_secret
  2. Re-run test with PRAW
  3. Use PRAW in production instead of RSS
        """)
