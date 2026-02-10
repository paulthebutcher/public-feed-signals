# Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to project
cd /path/to/2-9-26

# 3. Deploy
vercel

# 4. Follow prompts:
#    - Link to existing project? No
#    - Project name: problem-signal-miner
#    - Directory: ./ (current directory)
#    - Override settings? No

# 5. Add environment variable in Vercel dashboard:
#    Go to: Settings → Environment Variables
#    Add: ANTHROPIC_API_KEY = your_key_here
#    Environments: Production, Preview, Development

# 6. Redeploy to apply env var
vercel --prod
```

### Option 2: Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Problem Signal Miner MVP"
   git remote add origin https://github.com/yourusername/problem-signal-miner
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Framework: Next.js
   - Root Directory: `./` (or leave blank)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Add Environment Variable:**
   - In Vercel project settings
   - Environment Variables → Add
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...`
   - Environments: Production, Preview, Development
   - Save

4. **Deploy:**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live!

## Environment Variables

Required for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-api03-...` |

Get your Anthropic API key at: https://console.anthropic.com/

## Build Configuration

The project is configured to work with Vercel's default Next.js settings:

- **Framework:** Next.js 15 (auto-detected)
- **Node Version:** 18.x or higher
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

## Post-Deployment Checklist

✅ Environment variables added
✅ Build successful (check Vercel logs)
✅ Test the `/` route (home page loads)
✅ Test the `/api/extract` endpoint:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/extract \
     -H "Content-Type: application/json" \
     -d '{"keywords":"AI coding"}'
   ```
✅ Verify pain points are extracted and displayed

## Troubleshooting

### Build fails with "Module not found"
- Run `npm install` locally to verify dependencies
- Check that `package.json` is correct
- Vercel should auto-install from package.json

### API returns 500 error
- Check Vercel function logs: Dashboard → Your Project → Functions
- Verify `ANTHROPIC_API_KEY` is set correctly
- Ensure key has sufficient credits

### HackerNews API timeout
- HN API can be slow during high traffic
- Implement retry logic if needed
- Consider caching HN responses (60s revalidation already set)

### Extraction takes too long (>10s timeout)
- Vercel Hobby plan: 10s function timeout
- Vercel Pro plan: 60s function timeout
- Reduce number of posts analyzed (currently 20-30)
- Or upgrade to Pro plan

## Cost Estimates

### Vercel (Hosting)
- **Hobby (Free):** Perfect for MVP
  - 100 GB bandwidth/month
  - 10s function execution limit
  - Unlimited requests

- **Pro ($20/mo):** If you need more
  - 1 TB bandwidth/month
  - 60s function execution limit

### Anthropic API (Claude)
- **Model:** Claude 3.5 Sonnet
- **Cost:** ~$0.003 per request (input) + ~$0.015 per request (output)
- **Estimate:** ~$0.02 per extraction with 20 posts
- **100 searches/day:** ~$60/month
- **1000 searches/day:** ~$600/month

**Recommendation:** Start with Hobby plan + pay-as-you-go Claude API

## Monitoring

Monitor your deployment:

1. **Vercel Dashboard:**
   - Analytics: Traffic, performance
   - Functions: Execution time, errors
   - Logs: Real-time function logs

2. **Anthropic Console:**
   - API usage
   - Cost tracking
   - Rate limits

## Scaling

If you hit limits:

1. **Add caching:**
   - Cache HN posts for 5-10 minutes
   - Cache extraction results per keyword

2. **Add rate limiting:**
   - Limit requests per IP
   - Add user authentication

3. **Optimize extraction:**
   - Reduce posts analyzed per request
   - Batch smaller requests

4. **Upgrade plans:**
   - Vercel Pro for longer function timeouts
   - Anthropic's volume discounts kick in at scale

## Security Notes

- ✅ API key stored in environment variables (not in code)
- ✅ Next.js API routes server-side only
- ✅ No user data stored (stateless MVP)
- ⚠️ Add rate limiting before public launch
- ⚠️ Consider adding CORS restrictions

## Next Steps After Deployment

1. Share the link and get feedback
2. Monitor usage and costs
3. Iterate based on user feedback
4. Add Reddit when API approval comes through
5. Consider adding user accounts + saved searches

---

**Your app is ready to ship!** 🚀
