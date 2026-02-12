import Anthropic from '@anthropic-ai/sdk';
import type { Post } from './types';

/**
 * Score posts for relevance to search keywords using Claude
 *
 * This is the key to finding semantically related content:
 * - Finds "building a SaaS" when searching "startup"
 * - Finds "getting first customers" when searching "validation"
 * - Finds "CI/CD pipeline" when searching "deployment"
 *
 * Cost: ~$0.01 per search (90 posts × 300 chars ≈ 27k tokens)
 */
export async function scoreRelevance(
  posts: Post[],
  keywords: string,
  topN: number = 30
): Promise<Post[]> {
  if (posts.length === 0) {
    return [];
  }

  // If we have fewer posts than topN, just return them all
  if (posts.length <= topN) {
    return posts;
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = `You are analyzing discussion posts for relevance to a search query.

Search query: "${keywords}"

Rate each post's relevance on a scale of 0-100:
- 0-20: Completely unrelated
- 21-40: Tangentially related, only brief mention
- 41-60: Somewhat related, discusses related problems or contexts
- 61-80: Clearly related, discusses the topic or closely related concepts
- 81-100: Highly relevant, topic is the main focus

IMPORTANT: Be generous with scores. We want to capture discussions about related problems, even if terminology differs:
- "startup" → match anything about building products, launching businesses, indie making, entrepreneurship, getting customers
- "validation" → match testing ideas, market research, feedback, finding users, customer development
- "AI coding" → match copilot, LLMs, code generation, developer tools, autocomplete, AI assistants

If a post discusses problems, challenges, or pain points related to the topic area, score it 60+.

Posts to rate:
${posts.map((p, i) => `
[${i}]
Title: ${p.title}
Content: ${p.content.substring(0, 300)}...
Source: ${p.source}
`).join('\n')}

Return ONLY a valid JSON array with this exact format (no markdown, no explanation):
[
  {"index": 0, "score": 75},
  {"index": 1, "score": 45},
  ...
]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      temperature: 0.3, // Lower temperature for more consistent scoring
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('[Relevance] No text response from Claude');
      return posts.slice(0, topN); // Fallback to original order
    }

    // Extract JSON array from response
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[Relevance] No JSON array found in response');
      return posts.slice(0, topN); // Fallback
    }

    const scores: Array<{ index: number; score: number }> = JSON.parse(jsonMatch[0]);

    // Validate scores
    if (!Array.isArray(scores) || scores.length === 0) {
      console.error('[Relevance] Invalid scores format');
      return posts.slice(0, topN);
    }

    // Return only posts scoring >30, sorted by relevance (lowered from 40 for better coverage)
    const scoredPosts = posts
      .map((post, i) => ({
        post,
        score: scores.find((s) => s.index === i)?.score || 0
      }))
      .filter(({ score }) => score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(({ post }) => post);

    console.log(`[Relevance] Scored ${posts.length} posts, kept ${scoredPosts.length} with score >30 (${scoredPosts.map((p) => scores.find(s => s.index === posts.indexOf(p))?.score).filter(Boolean).join(', ')})`);

    return scoredPosts;
  } catch (error) {
    console.error('[Relevance] Scoring failed:', error);
    // On error, fall back to original order
    return posts.slice(0, topN);
  }
}
