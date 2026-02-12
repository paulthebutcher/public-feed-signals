import Anthropic from '@anthropic-ai/sdk';
import type { Post, ExtractionResult } from './types';

const EXTRACTION_PROMPT = `You are analyzing posts to extract actionable pain points that indie hackers could build products around.

CRITICAL: Use BOTH direct and reverse strategies:
1. **Direct**: Look for explicit complaints and problems
2. **Reverse**: If post describes a SOLUTION/PRODUCT/TOOL, extract the PROBLEM it solves

For each post below, identify:
1. Is there a genuine pain point or problem being expressed (directly OR solved by mentioned solution)?
2. If yes, extract the specific pain point
3. Score on three dimensions (0-100):
   - **Intensity**: How frustrated/desperate?
   - **Specificity**: How actionable?
   - **Frequency**: Recurring problem?

### Scoring Guide:

**Intensity:**
- 90-100: Extreme frustration ("nightmare", "crushing me", "going to break")
- 70-89: High frustration ("killing my", "eating all my time")
- 50-69: Moderate frustration ("annoying", "painful")
- 30-49: Mild annoyance
- 0-29: Barely frustrated

**Specificity:**
- 90-100: Concrete workflow pain with specific numbers/details
- 70-89: Clear problem with actionable elements
- 50-69: Problem described but vague solution space
- 30-49: Abstract complaint
- 0-29: Extremely vague

**Frequency:**
- 90-100: Daily/weekly recurring ("every day", "3-4 hours daily")
- 70-89: Monthly recurring ("third time this year", "happens often")
- 50-69: Occasional but repeated
- 30-49: Might be one-time
- 0-29: Clearly one-time event

### Reject if:
- Survey/discussion threads ("What are you working on?")
- Success stories without problems
- General "what do you think" questions
- Self-promotional content
- Show HN posts (unless expressing a pain point)
- Technical curiosity questions
- Post content <50 characters

### Few-Shot Examples:

**Example 1: YES - Direct Pain Point**
Post: "Codex keeps introducing linter errors. I've taught it my style guide but it forgets. Wastes so many tokens."
Analysis:
- Has pain point: YES
- Pain point: "AI coding tools not maintaining code style consistency, wasting tokens"
- Intensity: 75 (frustrated: "wastes so many tokens")
- Specificity: 90 (concrete: linter errors, style guide)
- Frequency: 90 (repeated: "keeps", "forgets")
- Composite: 85.0

**Example 2: YES - Reverse Strategy (Solution → Problem)**
Post: "Built a tool that automatically syncs Notion with Google Calendar. Was tired of manually copying events between them every week."
Analysis:
- Has pain point: YES (mentioned solution reveals problem)
- Pain point: "Manual effort syncing calendar events between Notion and Google Calendar weekly"
- Intensity: 60 (tired of manual work)
- Specificity: 95 (very concrete: specific apps, weekly frequency)
- Frequency: 90 (weekly recurring task)
- Composite: 81.7

**Example 3: NO - Survey**
Post: "What are you working on? Any new ideas?"
Analysis:
- Has pain point: NO
- Reason: "Survey thread, no specific pain expressed"

POSTS TO ANALYZE:
{{POSTS}}

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

/**
 * Extract pain points from posts using Claude
 */
export async function extractPainPoints(posts: Post[]): Promise<ExtractionResult[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Format posts for prompt
  const postsText = posts
    .map(
      (p) =>
        `POST ${p.id}: ${p.title}\nContent: ${p.content.substring(0, 500)}...\nURL: ${p.url}\n`
    )
    .join('\n---\n\n');

  const prompt = EXTRACTION_PROMPT.replace('{{POSTS}}', postsText);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Strip markdown code blocks if Claude wraps the JSON
    let jsonText = responseText.trim();
    // Handle all variations: ```json\n, ```\n, ``` with spaces, etc.
    if (jsonText.startsWith('```')) {
      jsonText = jsonText
        .replace(/^```[a-z]*\s*\n?/, '') // Remove opening: ```json or ``` with optional newline
        .replace(/\n?\s*```\s*$/, '')    // Remove closing: ``` with optional newlines/spaces
        .trim();
    }

    // Try to parse directly first
    try {
      const results = JSON.parse(jsonText) as ExtractionResult[];
      return results;
    } catch {
      // Fallback: Extract JSON array from response text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('[Extract] Claude response:', responseText.substring(0, 500));
        // Include actual Claude response in error for debugging

        const preview = responseText.substring(0, 200).replace(/\n/g, ' ');
throw new Error(`No JSON array found in Claude response. Claude said: "${preview}..."`);
      }
      const results = JSON.parse(jsonMatch[0]) as ExtractionResult[];
      return results;
    }
  } catch (error) {
    console.error('Extraction error:', error);
    throw new Error(`Pain point extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
