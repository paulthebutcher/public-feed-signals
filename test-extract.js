// Test extraction to see what Claude returns
const Anthropic = require('@anthropic-ai/sdk');

// Load env
require('dotenv').config({ path: '/sessions/ecstatic-busy-mccarthy/mnt/AI Ethos/build/2-9-26/.env.local' });

const EXTRACTION_PROMPT = `You are analyzing posts to extract actionable pain points that indie hackers could build products around.

CRITICAL: Use BOTH direct and reverse strategies:
1. **Direct**: Look for explicit complaints and problems
2. **Reverse**: If post describes a SOLUTION/PRODUCT/TOOL, extract the PROBLEM it solves

POSTS TO ANALYZE:
POST test-1: I spent 3 hours manually copying data from PDFs today
Content: Every week I have to extract tables from PDF invoices and copy them into Excel. It's tedious and error-prone.
URL: https://example.com/test

Return your analysis as a JSON array. For each post, either:
- If NO pain point: { "post_id": N, "has_pain_point": false, "reason": "brief reason" }
- If YES pain point: {
    "post_id": N,
    "has_pain_point": true,
    "pain_point": "concise description",
    "intensity": 0-100,
    "specificity": 0-100,
    "frequency": 0-100,
    "composite_score": (intensity + specificity + frequency) / 3,
    "supporting_quote": "direct quote from post"
  }

Return ONLY valid JSON, no other text.`;

async function test() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    console.log('Calling Claude...');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{ role: 'user', content: EXTRACTION_PROMPT }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('\n=== CLAUDE RAW RESPONSE ===');
    console.log(responseText);
    console.log('=== END RESPONSE ===\n');

    // Try to parse
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```')) {
      console.log('Stripping markdown code blocks...');
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const results = JSON.parse(jsonText);
      console.log('\n✅ Successfully parsed JSON:');
      console.log(JSON.stringify(results, null, 2));
    } catch (e) {
      console.log('\n❌ Failed to parse JSON directly');

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('Found JSON array with regex');
        const results = JSON.parse(jsonMatch[0]);
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log('No JSON array found in response!');
      }
    }
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

test();
