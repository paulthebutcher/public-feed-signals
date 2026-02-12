import Anthropic from '@anthropic-ai/sdk';

/**
 * Smart keyword expansion using Claude
 *
 * Takes a user's keyword and expands it to 4-6 related search terms
 * This helps catch discussions using different terminology
 *
 * Example: "startup" → ["founder", "SaaS", "bootstrapping", "indie maker", "early stage"]
 */
export async function expandKeywords(userKeyword: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[KeywordExpansion] No API key, returning original keyword only');
    return [userKeyword];
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Given the keyword "${userKeyword}", generate 8-10 diverse PROBLEM PHRASES (2-5 words) covering different aspects of problems in this domain.

CRITICAL: Cast a WIDE NET with varied complaint types to maximize coverage:

Categories to cover:
1. Cost/pricing problems: "too expensive", "paying too much"
2. Time problems: "takes too long", "too slow"
3. Difficulty problems: "can't figure out", "struggling with"
4. Quality problems: "doesn't work", "keeps breaking"
5. Learning curve: "hard to learn", "confusing"
6. Missing features: "wish it had", "needs better"
7. Integration issues: "doesn't integrate", "compatibility"
8. Finding/discovery: "can't find", "hard to get"

Examples (generate 8-10, cover multiple categories):
- "startup" → ["can't find customers", "spending too much on tools", "struggling with pricing", "takes too long to get users", "hard to validate idea", "hiring is expensive", "marketing doesn't work", "product market fit"]
- "deployment" → ["takes too long to deploy", "server keeps crashing", "costs too much to scale", "hard to debug", "monitoring doesn't show", "rollback is risky", "downtime too frequent", "configuration is complex"]

Return ONLY a valid JSON array of 8-10 problem phrases.
NO markdown, NO code blocks, NO explanations.

Problem phrases for "${userKeyword}":`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Fast + cheap for simple task
      max_tokens: 500, // Increased for 8-10 problem phrases
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Strip markdown code blocks if Claude wraps the JSON
    // Example: ```json\n["founder", "SaaS"]\n``` → ["founder", "SaaS"]
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Parse JSON response
    const expanded = JSON.parse(jsonText) as string[];

    // Validate response
    if (!Array.isArray(expanded) || expanded.length === 0) {
      throw new Error('Invalid expansion format');
    }

    // Deduplicate and limit to 10 phrases
    const unique = Array.from(new Set(expanded.map(k => k.toLowerCase().trim())));
    const limited = unique.slice(0, 10); // Increased from 6 to 10 for wider coverage

    console.log(`[KeywordExpansion] "${userKeyword}" → [${limited.slice(0, 3).join(', ')}... +${limited.length - 3} more]`);

    // Always include original keyword
    if (!limited.includes(userKeyword.toLowerCase())) {
      return [userKeyword, ...limited.slice(0, 9)];
    }

    return limited;
  } catch (error) {
    console.error('[KeywordExpansion] Failed:', error);
    // Fallback: return original keyword
    return [userKeyword];
  }
}

/**
 * Estimate cost of keyword expansion
 * Using Haiku: ~$0.001 per expansion
 */
export function estimateExpansionCost(): number {
  return 0.001; // $0.001 per search
}
