type PainPoint = {
  post_id: string | number;
  pain_point: string;
  intensity: number;
  specificity: number;
  frequency: number;
  composite_score: number;
  supporting_quote: string;
  post_title: string;
  post_url: string;
  post_score: number;
  post_comments: number;
  post_source: string;
  mention_count?: number;
  cluster_theme?: string;
  similar_pain_points?: string[];
};

interface PainPointCardProps {
  painPoint: PainPoint;
  rank: number;
}

export function PainPointCard({ painPoint, rank }: PainPointCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-signal';
    if (score >= 70) return 'text-copper-300';
    return 'text-secondary';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-signal-soft border-amber-700';
    if (score >= 70) return 'bg-accent-soft border-copper-600';
    return 'bg-secondary border-default';
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'hackernews':
        return { label: 'HN', color: 'bg-copper-900/50 text-copper-300 border-copper-700' };
      case 'devto':
        return { label: 'Dev.to', color: 'bg-accent-soft text-accent border-copper-600' };
      case 'indiehackers':
        return { label: 'IH', color: 'bg-slate-800 text-slate-400 border-slate-600' };
      case 'github':
        return { label: 'GitHub', color: 'bg-slate-900/50 text-slate-300 border-slate-700' };
      case 'stackoverflow':
        return { label: 'Stack Overflow', color: 'bg-amber-900/30 text-amber-400 border-amber-800' };
      default:
        return { label: source, color: 'bg-secondary text-tertiary border-default' };
    }
  };

  const sourceBadge = getSourceBadge(painPoint.post_source);

  return (
    <div className={`p-6 border rounded-lg shadow-xs ${getScoreBg(painPoint.composite_score)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-2xl font-display font-bold text-tertiary">#{rank}</span>
            <span className={`text-3xl font-display font-bold ${getScoreColor(painPoint.composite_score)}`}>
              {painPoint.composite_score.toFixed(1)}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-sm border ${sourceBadge.color}`}>
              {sourceBadge.label}
            </span>
            {painPoint.mention_count && painPoint.mention_count > 1 && (
              <span className="px-2 py-1 text-xs font-semibold rounded-sm border bg-amber-900/20 text-amber-300 border-amber-700">
                🔥 {painPoint.mention_count}x mentions
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-primary leading-tight font-body">
            {painPoint.pain_point}
          </h3>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-sunken rounded-md">
        <div>
          <p className="text-xs text-secondary mb-1">Intensity</p>
          <p className="text-lg font-semibold font-display text-primary">{painPoint.intensity}</p>
        </div>
        <div>
          <p className="text-xs text-secondary mb-1">Specificity</p>
          <p className="text-lg font-semibold font-display text-primary">{painPoint.specificity}</p>
        </div>
        <div>
          <p className="text-xs text-secondary mb-1">Frequency</p>
          <p className="text-lg font-semibold font-display text-primary">{painPoint.frequency}</p>
        </div>
      </div>

      {/* Supporting Quote */}
      <div className="mb-4 p-4 bg-tertiary rounded-md border-l-4 border-copper-600">
        <p className="text-sm text-secondary italic">
          &ldquo;{painPoint.supporting_quote}&rdquo;
        </p>
      </div>

      {/* Source Post */}
      <div className="flex items-center justify-between text-sm">
        <a
          href={painPoint.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-copper-300 hover:underline transition-colors duration-fast flex-1 truncate"
        >
          {painPoint.post_title}
        </a>
        <div className="flex items-center gap-4 ml-4 text-secondary">
          <span>{painPoint.post_score} pts</span>
          <span>{painPoint.post_comments} comments</span>
        </div>
      </div>
    </div>
  );
}
