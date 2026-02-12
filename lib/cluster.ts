import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult } from './types';

export type ClusteredPainPoint = ExtractionResult & {
  cluster_id: string;
  cluster_theme: string;
  mention_count: number;
  is_representative: boolean;
  similar_pain_points?: string[]; // Other pain points in this cluster
};

/**
 * Cluster similar pain points using Claude
 *
 * Example: "finding first customers" appearing 5x → show once with 5x badge
 *
 * This dramatically improves result quality by:
 * - Removing duplicates (30 results → 15 unique themes)
 * - Showing frequency (helps prioritize common problems)
 * - Keeping the best example for each cluster
 */
export async function clusterPainPoints(
  painPoints: ExtractionResult[]
): Promise<ClusteredPainPoint[]> {
  // If too few pain points, no clustering needed
  // Increased threshold to 10 to avoid slow clustering for small result sets
  if (painPoints.length < 10) {
    console.log(`[Cluster] Skipping clustering for ${painPoints.length} pain points (threshold: 10)`);
    return painPoints.map((pp, i) => ({
      ...pp,
      cluster_id: `cluster_${i}`,
      cluster_theme: pp.pain_point || 'Unknown',
      mention_count: 1,
      is_representative: true,
    }));
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = `You are grouping similar pain points into clusters.

Pain points:
${painPoints.map((p, i) => `[${i}] ${p.pain_point} (score: ${p.composite_score?.toFixed(1) || 'N/A'})`).join('\n')}

Group these into clusters of SIMILAR problems. For each cluster:
1. Choose the highest-scoring or most specific pain point as the representative
2. Give the cluster a theme (short description of the common problem)
3. List all pain point indices that belong to this cluster

Rules:
- Aim for 3-8 clusters maximum (group aggressively)
- Each cluster needs 1+ pain points
- Pain points about the same core issue should be grouped even if wording differs
- Representative should be the most specific or highest-scoring example

Examples of what to cluster:
- "finding first customers", "getting initial users", "customer acquisition" → cluster
- "validating idea", "testing market fit", "getting feedback" → cluster
- "pricing strategy", "what to charge", "pricing model" → cluster

Return ONLY valid JSON (no markdown, no explanation):
{
  "clusters": [
    {
      "theme": "Customer acquisition challenges",
      "indices": [0, 3, 7],
      "representative_index": 0
    },
    {
      "theme": "Product validation and feedback",
      "indices": [1, 4],
      "representative_index": 4
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Use Haiku for speed (10x faster, 10x cheaper)
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('[Cluster] No text response from Claude');
      return fallbackNoClustering(painPoints);
    }

    // Extract JSON object from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Cluster] No JSON found in response');
      return fallbackNoClustering(painPoints);
    }

    const result: {
      clusters: Array<{
        theme: string;
        indices: number[];
        representative_index: number;
      }>;
    } = JSON.parse(jsonMatch[0]);

    if (!result.clusters || !Array.isArray(result.clusters)) {
      console.error('[Cluster] Invalid clusters format');
      return fallbackNoClustering(painPoints);
    }

    // Build clustered results
    const clustered: ClusteredPainPoint[] = [];

    for (const cluster of result.clusters) {
      const repIndex = cluster.representative_index;
      const representative = painPoints[repIndex];

      if (!representative) {
        console.error(`[Cluster] Invalid representative index: ${repIndex}`);
        continue;
      }

      // Get all pain points in this cluster
      const clusterPainPoints = cluster.indices
        .map(i => painPoints[i])
        .filter(Boolean);

      const similarPoints = clusterPainPoints
        .filter((_, i) => cluster.indices[i] !== repIndex)
        .map(pp => pp.pain_point)
        .filter((p): p is string => p !== undefined);

      clustered.push({
        ...representative,
        cluster_id: `cluster_${clustered.length}`,
        cluster_theme: cluster.theme,
        mention_count: cluster.indices.length,
        is_representative: true,
        similar_pain_points: similarPoints.length > 0 ? similarPoints : undefined,
      });
    }

    console.log(`[Cluster] Grouped ${painPoints.length} pain points into ${clustered.length} clusters`);
    console.log(`[Cluster] Clusters: ${clustered.map(c => `${c.cluster_theme} (${c.mention_count}x)`).join(', ')}`);

    return clustered;
  } catch (error) {
    console.error('[Cluster] Clustering failed:', error);
    return fallbackNoClustering(painPoints);
  }
}

/**
 * Fallback when clustering fails - return all pain points as individual clusters
 */
function fallbackNoClustering(painPoints: ExtractionResult[]): ClusteredPainPoint[] {
  console.log('[Cluster] Using fallback - no clustering applied');
  return painPoints.map((pp, i) => ({
    ...pp,
    cluster_id: `cluster_${i}`,
    cluster_theme: pp.pain_point || 'Unknown',
    mention_count: 1,
    is_representative: true,
  }));
}
