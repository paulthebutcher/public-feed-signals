import Anthropic from '@anthropic-ai/sdk';

/**
 * Smart keyword expansion using Claude
 *
 * Takes a user's keyword and expands it to 10-12 related topic keywords
 * Generates SHORT (1-2 word) common terms that appear frequently in posts
 * This helps catch discussions using different terminology
 *
 * Example: "startup" → ["founder", "entrepreneur", "bootstrapping", "saas", "indie", "business", "launch", "validation", "customers", "growth", "funding", "mvp"]
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

    const prompt = `Given the keyword "${userKeyword}", generate 10-12 related TOPIC KEYWORDS (1-2 words each) that commonly appear in discussions about this domain.

CRITICAL: Generate SHORT, COMMON terms that appear FREQUENTLY in posts:
- Use 1-2 words maximum (NOT phrases)
- Use common terminology (how people actually talk)
- Cover different aspects of the domain
- Think: what words appear in titles and content?

Examples:
- "startup" → ["founder", "entrepreneur", "bootstrapping", "saas", "indie", "business", "launch", "validation", "customers", "growth", "funding", "mvp"]
- "deployment" → ["deploy", "devops", "ci/cd", "docker", "kubernetes", "pipeline", "hosting", "server", "production", "automation", "infrastructure", "release"]
- "authentication" → ["auth", "login", "oauth", "jwt", "session", "security", "password", "token", "sso", "user", "identity", "access"]

Focus on:
1. Core terminology (e.g., "founder", "entrepreneur" for "startup")
2. Related concepts (e.g., "validation", "mvp", "launch")
3. Common pain areas (e.g., "customers", "funding", "growth")
4. Industry jargon (e.g., "saas", "bootstrapping", "indie")

Return ONLY a valid JSON array of 10-12 SHORT keywords (1-2 words each).
NO markdown, NO code blocks, NO explanations, NO long phrases.

Keywords for "${userKeyword}":`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Fast + cheap for simple task
      max_tokens: 300, // Enough for 10-12 short keywords
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

    // Deduplicate and limit to 12 keywords
    const unique = Array.from(new Set(expanded.map(k => k.toLowerCase().trim())));
    const limited = unique.slice(0, 12);

    console.log(`[KeywordExpansion] "${userKeyword}" → [${limited.slice(0, 3).join(', ')}... +${limited.length - 3} more]`);

    // Always include original keyword
    if (!limited.includes(userKeyword.toLowerCase())) {
      return [userKeyword, ...limited.slice(0, 11)];
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
