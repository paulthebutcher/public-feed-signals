'use client';

import { useState } from 'react';
import { PainPointCard } from '@/components/PainPointCard';

type PainPoint = {
  post_id: number | string;
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

type ExtractionResult = {
  pain_points: PainPoint[];
  total_posts: number;
  relevant_posts?: number;
  extraction_rate: number;
  processing_time_ms: number;
  sources_used: string[];
  clusters?: number;
  total_mentions?: number;
  expanded_keywords?: string[];
};

export default function Home() {
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Expanding keywords',
    'Fetching from 5 sources',
    'Scoring relevance with AI',
    'Extracting pain points',
    'Clustering similar problems'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keywords.trim()) {
      setError('Please enter at least one keyword');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setCurrentStep(0);

    try {
      // Progress through steps based on realistic timing
      setTimeout(() => setCurrentStep(1), 500);   // Expanding
      setTimeout(() => setCurrentStep(2), 3000);  // Fetching
      setTimeout(() => setCurrentStep(3), 8000);  // Scoring
      setTimeout(() => setCurrentStep(4), 18000); // Extracting

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.trim(),
          sources: ['all']
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Extraction failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display mb-3 bg-gradient-to-r from-copper-400 to-amber-400 bg-clip-text text-transparent">
            Problem Signal Miner
          </h1>
          <p className="text-secondary text-lg font-body">
            Find real pain points from HN, Dev.to, GitHub, Stack Overflow & Indie Hackers
          </p>
        </div>

        {/* Search Form - Inline */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex gap-3">
            <input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., AI coding, startup validation, freelance"
              className="flex-1 px-4 py-3 bg-elevated border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-copper-200 focus:border-accent text-primary placeholder-tertiary font-body transition-all duration-fast"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-accent-solid hover:brightness-110 text-on-accent font-semibold rounded-md transition-all duration-fast disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] whitespace-nowrap"
            >
              {isLoading ? 'Analyzing...' : 'Find Pain Points'}
            </button>
          </div>
          <p className="mt-2 text-xs text-tertiary">
            🔍 Smart search automatically expands your keywords to find related discussions
          </p>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-[#C4453A]/10 border border-[#C4453A]/30 rounded-md text-[#C4453A]">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State with Progress Steps */}
        {isLoading && (
          <div className="py-12">
            <div className="max-w-md mx-auto space-y-3">
              {steps.map((step, index) => {
                const isComplete = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      isPending ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    {isComplete && (
                      <div className="w-6 h-6 rounded-full bg-copper-600 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="w-6 h-6 rounded-full border-2 border-copper-400 border-t-copper-600 animate-spin shrink-0"></div>
                    )}
                    {isPending && (
                      <div className="w-6 h-6 rounded-full border-2 border-subtle shrink-0"></div>
                    )}
                    <span className={`text-sm ${isCurrent ? 'text-primary font-semibold' : 'text-secondary'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
              <p className="mt-6 text-center text-xs text-tertiary">Usually takes ~25 seconds</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && !isLoading && (
          <div className="space-y-6">
            {/* Expanded Keywords Display */}
            {results.expanded_keywords && results.expanded_keywords.length > 1 && (
              <div className="p-4 bg-elevated border border-default rounded-lg">
                <p className="text-xs text-secondary mb-2">Searched keywords:</p>
                <div className="flex gap-2 flex-wrap">
                  {results.expanded_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        i === 0
                          ? 'bg-copper-900/30 text-copper-300 border-copper-700 font-semibold'
                          : 'bg-elevated border-default text-secondary'
                      }`}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-elevated border border-default rounded-lg shadow-xs">
              <div>
                <p className="text-xs text-secondary">Pain Points</p>
                <p className="text-2xl font-bold font-display text-accent">{results.pain_points.length}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">Extraction Rate</p>
                <p className="text-2xl font-bold font-display text-primary">{results.extraction_rate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-secondary">Sources</p>
                <p className="text-lg font-bold font-display text-primary capitalize">
                  {results.sources_used.map(s =>
                    s === 'hackernews' ? 'HN' :
                    s === 'devto' ? 'Dev.to' :
                    s === 'github' ? 'GitHub' :
                    s === 'stackoverflow' ? 'SO' :
                    'IH'
                  ).join(', ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary">Time</p>
                <p className="text-2xl font-bold font-display text-primary">{(results.processing_time_ms / 1000).toFixed(1)}s</p>
              </div>
            </div>

            {/* Pain Points */}
            {results.pain_points.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-display mb-4">
                  Top Pain Points <span className="text-tertiary">({results.pain_points.length})</span>
                </h2>
                {results.pain_points.map((painPoint, index) => (
                  <PainPointCard key={painPoint.post_id} painPoint={painPoint} rank={index + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary">
                <p>No pain points found in recent discussions.</p>
                <p className="text-sm mt-2">Try different keywords or check back later.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        {!results && !isLoading && (
          <div className="mt-16 p-6 bg-elevated border border-default rounded-lg shadow-xs">
            <h3 className="font-semibold mb-3 text-primary font-body">How it works</h3>
            <ol className="space-y-2 text-sm text-secondary">
              <li>1. <strong>Fetch</strong>: Searches 5 sources (HN, Dev.to, GitHub, Stack Overflow, Indie Hackers) for recent posts</li>
              <li>2. <strong>Filter</strong>: AI scores each post for relevance to your keywords (semantic search, not keyword matching)</li>
              <li>3. <strong>Extract</strong>: Claude analyzes top posts to identify genuine pain points with supporting quotes</li>
              <li>4. <strong>Score</strong>: Each pain point gets rated 0-100 on:
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• <strong>Intensity</strong>: How frustrated/urgent the person sounds</li>
                  <li>• <strong>Specificity</strong>: How clearly defined the problem is</li>
                  <li>• <strong>Frequency</strong>: How often this type of problem likely occurs</li>
                </ul>
              </li>
              <li>5. <strong>Cluster</strong>: Groups similar pain points and shows frequency (e.g., &ldquo;5x mentions&rdquo;)</li>
            </ol>
            <p className="mt-4 text-xs text-tertiary">
              💡 Composite score = (intensity + specificity + frequency) / 3. Higher scores = more actionable problems.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
