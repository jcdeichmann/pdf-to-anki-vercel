# Deployment Guide: PDF-to-ANKI Vercel

This guide walks you through deploying the PDF-to-ANKI app to Vercel with automatic deployments on Git push.

## Prerequisites

1. **OpenRouter API Key**: Get yours at https://openrouter.ai/keys
   - Free tier available
   - Used for LLM API calls (GPT-4.1-mini)

2. **GitHub Account**: https://github.com
   - You'll push code here to trigger auto-deployments

3. **Vercel Account**: https://vercel.com
   - Sign up with your GitHub account (recommended)

## Step-by-Step Deployment

### 1. Create a GitHub Repository

```bash
# Initialize git if not already done
cd /path/to/pdf-to-anki-vercel
git init
git add .
git commit -m "Initial commit: PDF-to-ANKI Vercel app"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/pdf-to-anki-vercel.git
git branch -M main
git push -u origin main
```

### 2. Set Up Local Development

```bash
# Copy the example env file
cp .env.example .env.local

# Add your OpenRouter API key to .env.local
# OPENROUTER_API_KEY=your_actual_key_here

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Connect to Vercel (Auto-Deploy)

**Option A: Using Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/new
2. Click **"Add GitHub App"** or log in with GitHub
3. Authorize Vercel to access your GitHub account
4. Select your `pdf-to-anki-vercel` repository
5. Click **"Import"**
6. Vercel will auto-detect Next.js framework

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to connect your GitHub repo
```

### 4. Configure Environment Variables

**In Vercel Dashboard:**

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variable:
   - **Key**: `OPENROUTER_API_KEY`
   - **Value**: Your OpenRouter API key from step 1
   - **Environments**: Select "Production", "Preview", and "Development"
3. Click **"Save"**

### 5. Deploy

**Automatic Deployment (Recommended)**

Every time you push to the `main` branch, Vercel automatically deploys:

```bash
git add .
git commit -m "Your message"
git push origin main
```

Vercel will:
- Build your Next.js app
- Deploy to a live URL
- Show deployment status on GitHub

**Manual Deployment**

Go to your Vercel project dashboard and click **"Redeploy"** next to the latest commit.

## Post-Deployment

### Get Your Live URL

After deployment, Vercel provides:
- **Production URL**: `https://pdf-to-anki-vercel.vercel.app` (custom domain optional)
- **Preview URLs**: Auto-generated for pull requests

### Monitor Deployments

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **GitHub Checks**: See deployment status in PR/commit details
3. **Logs**: Click deployment → **"Logs"** tab for troubleshooting

### Share with Friends

Just send them your production URL! They can:
- Upload PDFs
- Edit high-yield points
- Generate cloze cards
- Download ANKI decks

## Cost Breakdown

**Vercel (Free Tier)**
- ✅ Unlimited deployments
- ✅ Unlimited serverless function calls
- ✅ 100 GB bandwidth/month
- Cost: **$0**

**OpenRouter API**
- GPT-4.1-mini is ~$0.0005 per request
- Typical PDF → ~3 API calls (extract points, generate cards, maybe retry)
- Cost per PDF: **~$0.002** ($0.002)
- Cost for 1000 PDFs: **~$2.00**

**Total Monthly Cost**: ~$0 (unless exceeding bandwidth limits, very unlikely)

## Troubleshooting

### Deployment Fails

1. Check build logs: Vercel Dashboard → Deployments → Failed → **"Logs"**
2. Common issues:
   - Missing `OPENROUTER_API_KEY` environment variable
   - TypeScript compilation errors
   - Dependency version conflicts

3. **Reset and rebuild**:
   ```bash
   vercel env pull  # Pull production env vars
   npm install
   npm run build    # Test build locally
   git push         # Push changes
   ```

### API Calls Fail

1. Check OpenRouter API key is correct
2. Verify OpenRouter account has available credits
3. Check Vercel function logs: Dashboard → Deployments → **"Runtime Logs"**

### Slow Performance

- **First request slow?** Normal - serverless cold start (2-3 seconds)
- **Large PDFs?** Client-side processing is instant; only LLM calls hit the API
- **Can optimize**: Upgrade to Vercel Pro ($20/month) for faster cold starts

## Advanced: Custom Domain

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. In Vercel Dashboard → Project Settings → **"Domains"**
3. Add your custom domain
4. Point nameservers to Vercel (follow Vercel's instructions)

Example: `https://pdf-to-anki.yourname.com`

## Support & Updates

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **OpenRouter Docs**: https://openrouter.ai/docs

## Next Steps

1. Test the app thoroughly with sample PDFs
2. Share with friends and get feedback
3. Monitor costs on OpenRouter dashboard
4. Consider adding features:
   - Multiple deck export
   - Custom cloze format options
   - Batch processing
   - User accounts (requires database)

---

**Happy studying!** 📚
