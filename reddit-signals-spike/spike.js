import Parser from 'rss-parser';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const parser = new Parser();
const anthropic = new Anthropic({
  apiKey: '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'
});

// Step 1: Load mock Reddit posts (using local data since Reddit RSS is blocked)
async function fetchRedditRSS() {
  console.log('📡 Loading mock Reddit posts for spike...\n');

  try {
    const posts = JSON.parse(fs.readFileSync('mock_posts.json', 'utf-8'));

    console.log(`✅ Loaded ${posts.length} mock posts`);
    console.log(`📝 Note: Using mock data because Reddit RSS is blocked in this environment`);
    console.log(`📝 This tests extraction quality (Risk #1). RSS viability (Risk #2) tested separately.\n`);

    // Save raw posts for reference
    fs.writeFileSync('raw_posts.json', JSON.stringify(posts, null, 2));
    console.log('💾 Saved posts to raw_posts.json\n');

    return posts;
  } catch (error) {
    console.error('❌ Failed to load mock posts:', error.message);
    throw error;
  }
}

// Step 2: Create extraction prompt
function createExtractionPrompt(posts) {
  const postsText = posts.map(p =>
    `POST ${p.id}: ${p.title}\nContent: ${p.content.substring(0, 500)}...\nURL: ${p.url}\n`
  ).join('\n---\n\n');

  return `You are analyzing Reddit posts from r/Entrepreneur to extract actionable pain points that indie hackers could build products around.

For each post below, identify:
1. Is there a genuine pain point or problem being expressed? (not just a meme, joke, or off-topic discussion)
2. If yes, extract the specific pain point
3. Score the pain point on three dimensions (0-100):
   - **Intensity**: How frustrated/desperate does the person sound? (0=mild annoyance, 100=extreme frustration)
   - **Specificity**: How actionable is the problem? (0=vague complaint, 100=specific workflow pain)
   - **Frequency**: Based on language, does this seem like a recurring problem? (0=one-time issue, 100=ongoing struggle)

POSTS TO ANALYZE:
${postsText}

Return your analysis as a JSON array. For each post, either:
- If NO actionable pain point: { "post_id": N, "has_pain_point": false, "reason": "brief reason" }
- If YES pain point found: {
    "post_id": N,
    "has_pain_point": true,
    "pain_point": "concise description of the problem",
    "intensity": 0-100,
    "specificity": 0-100,
    "frequency": 0-100,
    "composite_score": (intensity + specificity + frequency) / 3,
    "supporting_quote": "direct quote from post showing the pain"
  }

Only extract REAL pain points. Be strict. Reject:
- Memes, jokes, sarcasm
- Success stories without a problem
- General discussions without a specific complaint
- Self-promotional posts
- Off-topic content

Return ONLY valid JSON, no other text.`;
}

// Step 3: Run extraction with Claude
async function extractPainPoints(posts) {
  console.log('🤖 Running Claude extraction (Sonnet 3.5)...\n');

  const prompt = createExtractionPrompt(posts);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const results = JSON.parse(jsonMatch[0]);

    // Save full results
    fs.writeFileSync('extraction_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Saved extraction results to extraction_results.json\n');

    return results;
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    throw error;
  }
}

// Step 4: Analyze results
function analyzeResults(results, posts) {
  console.log('📊 SPIKE RESULTS\n');
  console.log('='.repeat(60));

  const painPoints = results.filter(r => r.has_pain_point);
  const noPainPoints = results.filter(r => !r.has_pain_point);

  const accuracy = (painPoints.length / results.length) * 100;
  const passThreshold = painPoints.length >= 12; // 60% of 20

  console.log(`\n✅ Pain points found: ${painPoints.length}/20 (${accuracy.toFixed(1)}%)`);
  console.log(`❌ No pain points: ${noPainPoints.length}/20`);
  console.log(`\n🎯 Pass threshold: 12+ pain points (60%)`);
  console.log(`📈 Result: ${passThreshold ? '✅ PASSED' : '❌ FAILED'}\n`);

  if (painPoints.length > 0) {
    console.log('Top 5 Pain Points by Composite Score:\n');

    const sorted = painPoints
      .sort((a, b) => b.composite_score - a.composite_score)
      .slice(0, 5);

    sorted.forEach((p, i) => {
      const post = posts.find(post => post.id === p.post_id);
      console.log(`${i + 1}. [Score: ${p.composite_score.toFixed(1)}] ${p.pain_point}`);
      console.log(`   Post: "${post.title}"`);
      console.log(`   Intensity: ${p.intensity} | Specificity: ${p.specificity} | Frequency: ${p.frequency}`);
      console.log(`   Quote: "${p.supporting_quote.substring(0, 100)}..."`);
      console.log(`   URL: ${post.url}\n`);
    });
  }

  console.log('='.repeat(60));
  console.log('\n📝 Next Steps:');

  if (passThreshold) {
    console.log('✅ Extraction quality passed! Move to next phase:');
    console.log('   1. Test RSS feeds for all 5 subreddits');
    console.log('   2. Scaffold Next.js project');
    console.log('   3. Build API route + form UI');
  } else {
    console.log('⚠️  Extraction quality below threshold. Options:');
    console.log('   1. Iterate prompt (try different scoring rubric)');
    console.log('   2. Add few-shot examples');
    console.log('   3. Simplify to just extract quotes without scoring');
  }

  console.log('\n📁 Output files:');
  console.log('   - raw_posts.json (original 20 posts)');
  console.log('   - extraction_results.json (full analysis)\n');
}

// Main execution
async function runSpike() {
  try {
    const posts = await fetchRedditRSS();
    const results = await extractPainPoints(posts);
    analyzeResults(results, posts);
  } catch (error) {
    console.error('\n💥 Spike failed:', error.message);
    process.exit(1);
  }
}

runSpike();
