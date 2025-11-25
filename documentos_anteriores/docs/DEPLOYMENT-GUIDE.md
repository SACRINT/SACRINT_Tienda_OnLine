# Deployment Guide

## Environment Setup

### Prerequisites

- Node.js 18+ installed
- Git repository access
- Vercel account
- Neon PostgreSQL database
- Stripe account
- Google OAuth credentials
- Sentry account (optional but recommended)
- Resend account for emails

### Required Environment Variables

#### Production (.env.production)

```bash
# Database
DATABASE_URL="postgresql://user:password@host.neon.tech/db?sslmode=require"

# Auth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="[GENERATE_WITH: openssl rand -base64 32]"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Payments
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@your-domain.com"

# File Upload
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="..."

# App Config
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_APP_NAME="Tu Tienda Online"

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Encryption (for sensitive data)
ENCRYPTION_KEY="[GENERATE_WITH: openssl rand -hex 32]"

# Logging (optional)
LOGTAIL_TOKEN="..."
```

#### Staging (.env.staging)

Same as production but with staging credentials:

- Use Stripe test keys (`sk_test_...`, `pk_test_...`)
- Different database (staging environment)
- Different Sentry environment
- NEXTAUTH_URL points to staging domain

## Deployment Process

### Initial Setup

#### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### 2. Configure Environment Variables

**Via Vercel Dashboard:**

1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.production`
3. Set environment: Production
4. Save

**Via CLI:**

```bash
# Production
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... repeat for all variables

# Preview/Staging
vercel env add DATABASE_URL preview
# ... repeat for all variables
```

#### 3. Setup Database

```bash
# Run migrations on production database
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

#### 4. Configure Custom Domain

**In Vercel Dashboard:**

1. Project Settings > Domains
2. Add your domain (e.g., `your-domain.com`)
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### Deployment Methods

#### Method 1: Git Push (Recommended)

**Automatic deployment on git push:**

```bash
# Push to main branch triggers production deployment
git checkout main
git merge develop
git push origin main

# Push to develop triggers preview deployment
git checkout develop
git push origin develop
```

**GitHub Actions automatically:**

- Runs tests
- Checks linting
- Builds project
- Deploys to Vercel
- Runs smoke tests

#### Method 2: Vercel CLI

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

#### Method 3: Manual Deploy (Emergency)

```bash
# Build locally
npm run build

# Deploy build
vercel deploy --prod --prebuilt
```

### Post-Deployment Verification

#### 1. Health Check

```bash
# Check deployment status
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected"
}
```

#### 2. Smoke Tests

**Manual checks:**

- [ ] Homepage loads
- [ ] Login with Google works
- [ ] Dashboard accessible
- [ ] Product creation works
- [ ] Checkout flow completes
- [ ] Email notifications sent
- [ ] Images upload correctly
- [ ] API responses < 2s

**Automated checks:**

```bash
# Run smoke tests
npm run test:smoke

# Run E2E tests against production
NEXT_PUBLIC_APP_URL=https://your-domain.com npm run test:e2e
```

#### 3. Monitor Initial Traffic

```bash
# Check Vercel logs
vercel logs --follow

# Check Sentry for errors
# Visit: https://sentry.io/organizations/your-org/issues/

# Check database connections
# Visit Neon dashboard
```

## Database Migrations

### Running Migrations

**Production:**

```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
npx prisma generate
```

**Rollback (if needed):**

```bash
# Restore from backup
psql $DATABASE_URL < backups/backup_YYYYMMDD_HHMMSS.sql

# Or use Neon point-in-time recovery
# Via Neon dashboard: Restore > Select timestamp
```

### Migration Safety Checklist

Before deploying migrations:

- [ ] Tested in development
- [ ] Tested in staging
- [ ] Backup created
- [ ] Migration is reversible
- [ ] No data loss expected
- [ ] Downtime planned (if required)
- [ ] Team notified

## Stripe Configuration

### Production Setup

1. **Get API Keys:**
   - Visit: https://dashboard.stripe.com/apikeys
   - Copy Live Secret Key → `STRIPE_SECRET_KEY`
   - Copy Live Publishable Key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

2. **Setup Webhook:**

   ```bash
   # Webhook endpoint
   https://your-domain.com/api/webhooks/stripe

   # Events to listen:
   - checkout.session.completed
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   ```

3. **Get Webhook Secret:**
   - Visit: https://dashboard.stripe.com/webhooks
   - Click on your webhook
   - Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

4. **Test Webhook:**

   ```bash
   # Send test event
   stripe trigger checkout.session.completed

   # Check logs
   vercel logs --follow | grep stripe
   ```

## Monitoring Setup

### Sentry Configuration

```bash
# Install Sentry Wizard
npx @sentry/wizard@latest -i nextjs

# Follow prompts:
# - Select organization
# - Create/select project
# - Configure source maps upload
```

### Vercel Analytics

**Enable in dashboard:**

1. Project Settings > Analytics
2. Enable Web Analytics
3. Enable Speed Insights

### Custom Monitoring

**Create `/api/health` endpoint:**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
```

**Setup uptime monitoring:**

- Use UptimeRobot, Pingdom, or similar
- Monitor: `https://your-domain.com/api/health`
- Alert if: Status code ≠ 200 or response time > 5s
- Frequency: Every 5 minutes

## SSL/TLS Configuration

### Automatic (Vercel)

Vercel automatically provisions SSL certificates via Let's Encrypt.

**Verify SSL:**

```bash
# Check SSL grade
curl -I https://your-domain.com | grep -i ssl

# Use SSL Labs
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

### Custom Certificate (Advanced)

1. Project Settings > Domains > Custom Certificates
2. Upload certificate files
3. Configure

## CDN & Caching

### Vercel Edge Network

**Automatic optimizations:**

- Static assets cached at edge
- Image optimization via `next/image`
- API routes cached with `revalidate`

**Custom cache headers:**

```typescript
// app/api/products/route.ts
export async function GET() {
  const products = await getProducts();

  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
```

### Cache Invalidation

```bash
# Purge cache via API
curl -X PURGE https://your-domain.com/api/products

# Or via Vercel CLI
vercel env pull
```

## Rollback Procedure

### Quick Rollback

**Via Vercel Dashboard:**

1. Deployments tab
2. Find last working deployment
3. Click "..." menu > Promote to Production

**Via CLI:**

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel alias set <deployment-url> your-domain.com
```

### Full Rollback with Database

```bash
# 1. Rollback deployment
vercel alias set <previous-deployment> your-domain.com

# 2. Restore database
psql $DATABASE_URL < backups/backup_YYYYMMDD_HHMMSS.sql

# 3. Verify
curl https://your-domain.com/api/health
```

## Performance Optimization

### Before Launch

```bash
# Build analysis
npm run build -- --profile

# Bundle analysis
npm run analyze

# Lighthouse audit
npx lighthouse https://your-domain.com --view
```

### Optimization Checklist

- [ ] Image optimization enabled (next/image)
- [ ] Code splitting configured
- [ ] API routes cached appropriately
- [ ] Database queries optimized (indexes)
- [ ] Static pages pre-rendered
- [ ] Font optimization (next/font)
- [ ] Third-party scripts optimized
- [ ] Compression enabled (gzip/brotli)

## Security Hardening

### Pre-Launch Security Checklist

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials in code
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React auto-escape)
- [ ] CSRF protection (NextAuth.js)
- [ ] File upload validation
- [ ] Dependencies updated
- [ ] Vulnerability scan passed

### Security Scanning

```bash
# Dependency audit
npm audit

# Fix vulnerabilities
npm audit fix

# Snyk scan
npx snyk test

# OWASP ZAP scan (advanced)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://your-domain.com
```

## Backup & Recovery

### Automated Backups

**Neon PostgreSQL:**

- Automatic daily backups
- 30-day retention
- Point-in-time recovery available

**Manual backup:**

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

### Recovery Testing

**Monthly recovery drill:**

```bash
# 1. Create test database
# 2. Restore latest backup
psql $TEST_DATABASE_URL < backup_latest.sql

# 3. Verify data integrity
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM \"Product\";"

# 4. Document results
```

## Troubleshooting

### Common Issues

**Issue: Build fails on Vercel**

```bash
# Check build logs
vercel logs

# Common causes:
# - Missing environment variables
# - Type errors
# - Missing dependencies

# Fix:
# 1. Verify .env variables in Vercel
# 2. Run `npm run build` locally
# 3. Check package.json
```

**Issue: Database connection fails**

```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Common causes:
# - Wrong connection string
# - SSL mode not set
# - IP not whitelisted

# Fix:
# 1. Check DATABASE_URL format
# 2. Add `?sslmode=require`
# 3. Verify Neon settings
```

**Issue: OAuth login fails**

```bash
# Check OAuth config
# - NEXTAUTH_URL must match domain
# - Google Console redirect URIs must include:
#   https://your-domain.com/api/auth/callback/google

# Verify in browser console
# - Check redirect URL
# - Check for CORS errors
```

**Issue: Stripe webhooks not working**

```bash
# Verify webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/stripe

# Check Stripe dashboard > Webhooks > Events
# - Look for failed deliveries
# - Check response codes

# Common causes:
# - Wrong webhook secret
# - Signature verification failing
# - Endpoint not accessible

# Fix:
# 1. Verify STRIPE_WEBHOOK_SECRET
# 2. Check webhook URL
# 3. Test with Stripe CLI:
stripe listen --forward-to https://your-domain.com/api/webhooks/stripe
```

## Performance Monitoring

### Key Metrics to Track

**Application Performance:**

- Response time (P50, P95, P99)
- Error rate
- Request throughput
- Database query time

**Business Metrics:**

- Active users
- Orders per day
- Revenue
- Conversion rate

**Infrastructure:**

- CPU usage
- Memory usage
- Database connections
- Disk space

### Monitoring Tools

- **Vercel Analytics**: Built-in metrics
- **Sentry**: Error tracking & performance
- **Neon**: Database metrics
- **Stripe Dashboard**: Payment metrics
- **Custom**: `/api/health` endpoint

## Launch Checklist

### Pre-Launch (1 week before)

- [ ] All tests passing
- [ ] Staging environment tested
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Backup system verified
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Team trained

### Launch Day

- [ ] Final backup created
- [ ] Monitoring alerts active
- [ ] Support team ready
- [ ] Rollback plan ready
- [ ] Deploy to production
- [ ] Verify health check
- [ ] Run smoke tests
- [ ] Monitor for 1 hour
- [ ] Announce launch

### Post-Launch (First 24 hours)

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Fix critical issues immediately
- [ ] Document any issues
- [ ] Team debrief

## Support & Maintenance

### Daily Tasks

- Check error logs (Sentry)
- Monitor uptime
- Review performance metrics

### Weekly Tasks

- Review slow queries
- Update dependencies
- Check backup integrity
- Review security alerts

### Monthly Tasks

- Database maintenance
- Performance optimization
- Security audit
- Backup recovery test

---

**Last updated**: 2025-01-15
**Maintained by**: DevOps Team
**Contact**: devops@your-company.com
