/**
 * Unified post type across all data sources
 */
export type Post = {
  id: string | number;
  title: string;
  content: string;
  url: string;
  score: number;
  comments: number;
  author: string;
  published: string;
  age_hours: number;
  source: 'hackernews' | 'devto' | 'indiehackers' | 'github' | 'stackoverflow' | 'producthunt' | 'yc-rfs' | 'failory' | 'quora' | 'medium';
};

/**
 * Pain point extraction result
 */
export type ExtractionResult = {
  post_id: string | number;
  has_pain_point: boolean;
  pain_point?: string;
  intensity?: number;
  specificity?: number;
  frequency?: number;
  composite_score?: number;
  supporting_quote?: string;
  reason?: string;
  source?: 'hackernews' | 'devto' | 'indiehackers' | 'github' | 'stackoverflow' | 'producthunt' | 'yc-rfs' | 'failory' | 'quora' | 'medium';
};

/**
 * API response type
 */
export type ExtractAPIResponse = {
  pain_points: Array<ExtractionResult & {
    post_title: string;
    post_url: string;
    post_score: number;
    post_comments: number;
    post_source: string;
  }>;
  total_posts: number;
  extraction_rate: number;
  processing_time_ms: number;
  sources_used: string[];
};
