# Problem Signal Miner

Extract actionable pain points from HackerNews discussions using Claude Sonnet 4.5.

Built during Week of 2/9/26 as part of the Pre-build Intelligence Pipeline project.

## What It Does

1. **Search** recent Ask HN posts by keywords
2. **Extract** genuine pain points using Claude Sonnet 4.5
3. **Score** each pain point on intensity, specificity, and frequency
4. **Rank** results by composite score (highest = most actionable)

## Tech Stack

- **Next.js 15** (App Router, React Server Components)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Claude Sonnet 4.5** - Pain point extraction
- **HackerNews API** - Data source (public, no auth)

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deployment

Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable in Vercel dashboard:
# ANTHROPIC_API_KEY=your_key_here
```

Or click: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/problem-signal-miner)

## Project Structure

```
/2-9-26/
├── app/
│   ├── page.tsx              # Home page with search form
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       └── extract/
│           └── route.ts      # Pain point extraction API
├── components/
│   └── PainPointCard.tsx     # Pain point display component
├── lib/
│   ├── hackernews.ts         # HN API integration
│   └── extract.ts            # Claude extraction logic
├── public/                   # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind config
└── next.config.ts            # Next.js config
```

## Build Documentation

This repo contains both the **app** and **build documentation**:

- `BUILD_PLAN.md` - Original build plan with risk stack
- `SPIKE_SUMMARY.md` - Extraction quality spike results (55% on Reddit mock)
- `ITERATION_2_RESULTS.md` - Prompt iteration analysis
- `DATA_SOURCE_PIVOT.md` - Why we chose HackerNews over Reddit
- `hn_extraction_results.json` - Extraction on real HN data (52.2%)
- `reddit-signals-spike/` - Full spike code and data

## Extraction Quality

**Validated with real data:**
- Reddit mock data: **55.0%** (11/20 posts)
- HackerNews real data: **52.2%** (12/23 posts)

Top pain points discovered (score 85+):
1. **[86.7]** Opus 4.6 ignoring instructions
2. **[85.0]** Codex style consistency issues
3. **[83.3]** Medical imaging software lag

## API Reference

### POST `/api/extract`

Extract pain points from HackerNews.

**Request:**
```json
{
  "keywords": "AI coding startup validation"
}
```

**Response:**
```json
{
  "pain_points": [
    {
      "post_id": 46926262,
      "pain_point": "Opus 4.6 ignoring explicit instructions...",
      "intensity": 90,
      "specificity": 85,
      "frequency": 85,
      "composite_score": 86.7,
      "supporting_quote": "I'm very dismayed...",
      "post_title": "Ask HN: Opus 4.6 ignoring instructions...",
      "post_url": "https://news.ycombinator.com/item?id=46926262",
      "post_score": 3,
      "post_comments": 4
    }
  ],
  "total_posts": 23,
  "extraction_rate": 52.2,
  "processing_time_ms": 12450
}
```

## Future Enhancements

### Phase 1 (MVP - Shipped) ✅
- HackerNews Ask HN posts
- Single keyword input
- Extract + rank pain points

### Phase 2 (Next)
- Add Reddit once API approval comes through
- Multi-source aggregation
- Historical trending
- User accounts + saved searches

### Phase 3 (Future)
- More sources (Indie Hackers, Dev.to, Twitter)
- Cross-platform pain point tracking
- Email digests
- API for developers

## License

MIT

## Built With

Part of the **Pre-build Intelligence Pipeline** - a system that turns ideas into better build plans by extracting real-world pain points before writing code.

---

**Questions?** Open an issue or check the build docs in this repo.
