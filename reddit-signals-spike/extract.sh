#!/bin/bash

# Read posts and create prompt
POSTS=$(cat mock_posts.json | jq -r '.[] | "POST \(.id): \(.title)\nContent: \(.content[0:500])...\nURL: \(.url)\n"' | head -c 10000)

# Create the extraction prompt
PROMPT="You are analyzing Reddit posts from r/Entrepreneur to extract actionable pain points that indie hackers could build products around.

For each post below, identify:
1. Is there a genuine pain point or problem being expressed? (not just a meme, joke, or off-topic discussion)
2. If yes, extract the specific pain point
3. Score the pain point on three dimensions (0-100):
   - **Intensity**: How frustrated/desperate does the person sound? (0=mild annoyance, 100=extreme frustration)
   - **Specificity**: How actionable is the problem? (0=vague complaint, 100=specific workflow pain)
   - **Frequency**: Based on language, does this seem like a recurring problem? (0=one-time issue, 100=ongoing struggle)

POSTS TO ANALYZE:
$POSTS

Return your analysis as a JSON array. For each post, either:
- If NO actionable pain point: { \"post_id\": N, \"has_pain_point\": false, \"reason\": \"brief reason\" }
- If YES pain point found: {
    \"post_id\": N,
    \"has_pain_point\": true,
    \"pain_point\": \"concise description of the problem\",
    \"intensity\": 0-100,
    \"specificity\": 0-100,
    \"frequency\": 0-100,
    \"composite_score\": (intensity + specificity + frequency) / 3,
    \"supporting_quote\": \"direct quote from post showing the pain\"
  }

Only extract REAL pain points. Be strict. Reject:
- Memes, jokes, sarcasm
- Success stories without a problem
- General discussions without a specific complaint
- Self-promotional posts
- Off-topic content

Return ONLY valid JSON, no other text."

# Make API call to Claude
echo "🤖 Calling Claude API for extraction..."

curl -s https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: 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" \
  -H "anthropic-version: 2023-06-01" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 4000,
    \"messages\": [{
      \"role\": \"user\",
      \"content\": $(echo "$PROMPT" | jq -R -s .)
    }]
  }" > claude_response.json

echo "✅ Response saved to claude_response.json"

# Extract just the text content
cat claude_response.json | jq -r '.content[0].text' > extraction_results.txt
echo "📝 Extracted results to extraction_results.txt"
