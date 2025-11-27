# Manual Vercel Deployment Instructions

**Status**: GitHub webhook is not triggering automatic deployments to Vercel

**Solution**: Force a manual redeploy using Vercel Dashboard

## Option 1: Manual Redeploy via Vercel Dashboard (RECOMMENDED - No setup needed)

1. Go to: https://vercel.com/dashboard
2. Find and click on your project: `sacrint-tienda-on-line`
3. Look for the "Deployments" tab
4. Find the latest failed/stuck deployment
5. Click the "Redeploy" or "Deploy" button in the top right
6. Select the branch: `main`
7. Click "Deploy"
8. Wait 2-5 minutes for the deployment to complete

**Expected Result**: New pages (blog, contact, cookies, privacy, terms, security) will become accessible

---

## Option 2: Force Redeploy via Vercel CLI

If Option 1 doesn't work, use the Vercel CLI:

```bash
# Install Vercel CLI globally if not already installed
npm install -g vercel

# Login to your Vercel account
vercel login

# Navigate to project directory
cd "C:\03_Tienda digital"

# Force a production deployment
vercel --prod --yes
```

---

## Option 3: Check Deployment Limits

If you're seeing deployment limit errors:

1. Go to: https://vercel.com/account/billing
2. Check your plan and monthly deployment limit
3. If limit exceeded, either:
   - Upgrade plan
   - Wait for next month's reset
   - Contact Vercel support

---

## What Changed Since Last Deployment

These commits need to be deployed:

- **9fb663a**: Add .vercelignore to force fresh build
- **52bde7b**: Trigger vercel deployment
- **16260be**: Fix parsing errors and generate PWA assets
- **893abd4**: Repair page errors and add missing functionality

**New Files Added**:

- `src/app/blog/page.tsx` - Blog page
- `src/app/security/page.tsx` - Security page
- `src/app/contact/page.tsx` - Contact page
- `src/app/cookies/page.tsx` - Cookies policy
- `src/app/privacy/page.tsx` - Privacy policy
- `src/app/terms/page.tsx` - Terms and conditions
- `public/icons/` - 8 PWA icons in various sizes
- `public/screenshots/` - 4 PWA screenshots

**Fixes Applied**:

- Fixed legacy Image component props
- Fixed TypeScript parsing errors (JSX in .ts files)
- Fixed syntax errors (spaces in property names)
- Fixed ChunkLoadError by clearing .next cache
- Added missing function exports (withTiming, captureMessage)

---

## Verification After Deployment

Once deployment completes, verify these pages are accessible:

```bash
curl -s https://your-vercel-domain.vercel.app/blog -w "\nStatus: %{http_code}\n"
curl -s https://your-vercel-domain.vercel.app/security -w "\nStatus: %{http_code}\n"
curl -s https://your-vercel-domain.vercel.app/contact -w "\nStatus: %{http_code}\n"
curl -s https://your-vercel-domain.vercel.app/cookies -w "\nStatus: %{http_code}\n"
curl -s https://your-vercel-domain.vercel.app/privacy -w "\nStatus: %{http_code}\n"
curl -s https://your-vercel-domain.vercel.app/terms -w "\nStatus: %{http_code}\n"
```

All should return **Status: 200** (not 404)

---

## If Manual Redeploy Still Doesn't Work

1. **Disconnect and reconnect GitHub integration**:
   - Go to https://vercel.com/integrations/github
   - Disconnect the integration
   - Wait 30 seconds
   - Reconnect and re-authorize

2. **Check Vercel Project Settings**:
   - Project Settings → Git
   - Ensure branch is set to `main`
   - Ensure production branch is correct

3. **Contact Vercel Support**:
   - If webhook is broken, Vercel support can help

---

**Current Git Status**:

- Local branch: develop (switched to main for deployment)
- Remote: origin/main (up to date)
- Latest commit: 9fb663a (2025-11-27)
- Build status: ✅ Successful locally
- Deployment needed: YES - 3 new commits since last Vercel deployment
