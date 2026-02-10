import { NextRequest, NextResponse } from 'next/server';
import { searchMultipleSources, type DataSource } from '@/lib/sources';
import { extractPainPoints } from '@/lib/extract';
import { scoreRelevance } from '@/lib/relevance';
import { clusterPainPoints } from '@/lib/cluster';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { keywords, sources = ['all'] } = body;

    if (!keywords || typeof keywords !== 'string') {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    // Validate sources
    const validSources: DataSource[] = Array.isArray(sources)
      ? sources.filter((s: string) => ['hackernews', 'devto', 'indiehackers', 'github', 'stackoverflow', 'all'].includes(s))
      : ['all'];

    // Step 1: Fetch posts from multiple sources (fetch 90, will filter to 30)
    const allPosts = await searchMultipleSources(keywords.trim(), validSources, 30);

    if (allPosts.length === 0) {
      return NextResponse.json({
        pain_points: [],
        total_posts: 0,
        extraction_rate: 0,
        processing_time_ms: Date.now() - startTime,
      });
    }

    // Step 2: Score posts for relevance using Claude (semantic search)
    // This finds "building a SaaS" when searching "startup"
    const relevantPosts = await scoreRelevance(allPosts, keywords.trim(), 30);

    console.log(`[API] Fetched ${allPosts.length} posts, ${relevantPosts.length} relevant (score >40)`);

    // Step 3: Extract pain points using Claude
    const results = await extractPainPoints(relevantPosts);

    // Step 4: Filter for pain points and enrich with post data
    const painPointsWithData = results
      .filter((r) => r.has_pain_point)
      .map((r) => {
        const post = relevantPosts.find((p) => p.id === r.post_id);
        return {
          ...r,
          post_title: post?.title || '',
          post_url: post?.url || '',
          post_score: post?.score || 0,
          post_comments: post?.comments || 0,
          post_source: post?.source || 'unknown',
        };
      })
      .sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0)); // Sort by score desc

    // Step 5: Cluster similar pain points
    const clusteredPainPoints = await clusterPainPoints(painPointsWithData);

    const processingTime = Date.now() - startTime;

    // Track which sources were actually used
    const sourcesUsed = Array.from(new Set(allPosts.map((p) => p.source)));

    return NextResponse.json({
      pain_points: clusteredPainPoints,
      total_posts: allPosts.length,
      relevant_posts: relevantPosts.length,
      extraction_rate: relevantPosts.length > 0 ? (painPointsWithData.length / relevantPosts.length) * 100 : 0,
      processing_time_ms: processingTime,
      sources_used: sourcesUsed,
      clusters: clusteredPainPoints.length,
      total_mentions: clusteredPainPoints.reduce((sum, p) => sum + p.mention_count, 0),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
