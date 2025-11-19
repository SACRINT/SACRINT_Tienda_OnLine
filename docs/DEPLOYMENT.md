# Deployment Guide

## Overview

SACRINT Tienda Online is optimized for deployment on Vercel with Neon PostgreSQL.

---

## Prerequisites

- Vercel account
- Neon database
- Stripe account
- Google Cloud Console project (OAuth)
- Domain name (optional)

---

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Environment variables documented
- [ ] Database migrations applied
- [ ] Stripe webhooks configured
- [ ] OAuth redirect URIs updated
- [ ] Security headers tested
- [ ] Performance audit passed (Lighthouse > 90)

### Production Environment

- [ ] `NODE_ENV=production`
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `NEXT_PUBLIC_SITE_URL` set correctly
- [ ] Stripe live keys (not test)
- [ ] Database connection pooling enabled
- [ ] Error tracking configured (Sentry)
- [ ] Analytics enabled

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import Git Repository
3. Select `SACRINT/SACRINT_Tienda_OnLine`

### 2. Configure Project

**Build Settings:**
```
Framework Preset: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

### 3. Environment Variables

Add all required variables in Vercel dashboard:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-strong-secret>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Deploy

Click "Deploy" - Vercel will:
1. Install dependencies
2. Generate Prisma client
3. Build Next.js app
4. Deploy to edge network

---

## Database Setup (Neon)

### 1. Create Database

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string

### 2. Configure Connection

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### 3. Enable Connection Pooling

For production, use pooled connection:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
```

### 4. Run Migrations

```bash
pnpm prisma migrate deploy
```

---

## Stripe Configuration

### 1. Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret

### 2. Update Keys

Use live keys for production:

```env
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Google OAuth Setup

### 1. Configure Redirect URIs

In Google Cloud Console:

1. Go to APIs & Services > Credentials
2. Edit OAuth client
3. Add authorized redirect URI:
   ```
   https://your-domain.com/api/auth/callback/google
   ```

### 2. Update NextAuth URL

```env
NEXTAUTH_URL=https://your-domain.com
```

---

## Custom Domain

### 1. Add Domain in Vercel

1. Go to Project Settings > Domains
2. Add your domain
3. Configure DNS records

### 2. DNS Configuration

Add these records at your DNS provider:

```
Type  Name    Value
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions SSL via Let's Encrypt.

---

## Security Checklist

### Headers

Verify security headers are applied:

```bash
curl -I https://your-domain.com
```

Expected headers:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: ...
```

### Environment Variables

- Never commit secrets to git
- Use Vercel's encrypted environment variables
- Rotate secrets periodically

### Rate Limiting

Ensure rate limiting is active on:
- Authentication endpoints (5/15min)
- Checkout (10/hour)
- API general (100/min)

---

## Monitoring

### Error Tracking (Sentry)

1. Install Sentry SDK:
   ```bash
   pnpm add @sentry/nextjs
   ```

2. Configure in `sentry.client.config.ts`:
   ```typescript
   Sentry.init({
     dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
     tracesSampleRate: 0.1,
   })
   ```

### Analytics

Configure Google Analytics or Plausible:

```typescript
// lib/analytics.ts
export function trackEvent(name: string, properties?: object) {
  if (typeof gtag !== "undefined") {
    gtag("event", name, properties)
  }
}
```

### Performance Monitoring

Use Vercel Analytics:

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## Scaling

### Database

- Enable connection pooling in Neon
- Use read replicas for heavy queries
- Add indexes for common queries

### Caching

- Vercel Edge caching for static pages
- SWR for client-side data
- Redis for session storage (optional)

### CDN

Vercel Edge Network automatically serves:
- Static assets
- Images (with optimization)
- API routes at edge (if configured)

---

## Rollback

### Instant Rollback

In Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." > "Promote to Production"

### Database Rollback

```bash
# List migrations
pnpm prisma migrate status

# Rollback (if needed)
pnpm prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## Maintenance Mode

Create maintenance page:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE === "true") {
    return NextResponse.rewrite(new URL("/maintenance", request.url))
  }
}
```

Enable by setting `MAINTENANCE_MODE=true` in Vercel.

---

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard. Common issues:
- Missing environment variables
- TypeScript errors
- Prisma client not generated

### 500 Errors

1. Check Vercel function logs
2. Verify database connection
3. Check environment variables

### Slow Performance

1. Check Vercel Analytics
2. Optimize database queries
3. Enable caching
4. Review image sizes

---

## Post-deployment

1. Test all critical flows:
   - User registration/login
   - Product browsing
   - Add to cart
   - Checkout with payment
   - Order confirmation email

2. Monitor:
   - Error rates
   - Response times
   - Database connections

3. Set up alerts for:
   - High error rates
   - Slow responses
   - Failed payments
