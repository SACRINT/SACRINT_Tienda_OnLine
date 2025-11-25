# Operations Runbook

## Table of Contents

1. [Incident Response](#incident-response)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Monitoring & Alerts](#monitoring--alerts)
4. [Database Operations](#database-operations)
5. [Deployment Procedures](#deployment-procedures)
6. [Backup & Recovery](#backup--recovery)
7. [Security Incidents](#security-incidents)
8. [Performance Issues](#performance-issues)
9. [Emergency Contacts](#emergency-contacts)

---

## Incident Response

### Severity Levels

**P0 - Critical (Site Down)**

- Service completely unavailable
- Data loss occurring
- Security breach active
- **Response Time**: Immediate (24/7)
- **Resolution Time**: < 1 hour

**P1 - High (Major Impact)**

- Core features broken (checkout, login)
- Partial outage
- Security vulnerability
- **Response Time**: < 15 minutes
- **Resolution Time**: < 4 hours

**P2 - Medium (Minor Impact)**

- Non-critical features broken
- Performance degradation
- **Response Time**: < 1 hour
- **Resolution Time**: < 24 hours

**P3 - Low (Minor Issues)**

- Cosmetic issues
- Enhancement requests
- **Response Time**: < 8 hours
- **Resolution Time**: < 1 week

### Incident Response Workflow

```
1. DETECT → Alert received or issue reported
   ↓
2. ASSESS → Determine severity (P0-P3)
   ↓
3. ESCALATE → Notify team if P0/P1
   ↓
4. INVESTIGATE → Check logs, metrics, errors
   ↓
5. MITIGATE → Quick fix or rollback
   ↓
6. RESOLVE → Permanent fix
   ↓
7. DOCUMENT → Post-mortem for P0/P1
```

### P0 Response Checklist

When site is down:

```bash
# 1. Check Vercel status
vercel status

# 2. Check health endpoint
curl -I https://your-domain.com/api/health

# 3. Check error logs
vercel logs --follow

# 4. Check Sentry for errors
# Visit: https://sentry.io/organizations/your-org/issues/

# 5. Check database status
# Visit: Neon dashboard

# 6. If needed, rollback
vercel ls
vercel alias set <previous-deployment> your-domain.com

# 7. Notify team
# Post in #incidents Slack channel

# 8. Update status page
# (if you have one)
```

---

## Common Issues & Solutions

### Issue: Site Returns 500 Error

**Symptoms:**

- Users see "500 Internal Server Error"
- Error rate spike in Sentry
- Logs show uncaught exceptions

**Investigation:**

```bash
# 1. Check recent deployments
vercel ls

# 2. Check error logs
vercel logs | grep ERROR

# 3. Check Sentry
# Look for error patterns in Sentry dashboard

# 4. Check database connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Common Causes & Solutions:**

**Cause 1: Database connection pool exhausted**

```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Solution: Restart application or increase pool size
# In Prisma schema:
# datasource db {
#   provider = "postgresql"
#   url = env("DATABASE_URL")
#   relationMode = "prisma"
# }
```

**Cause 2: Unhandled exception in API route**

```typescript
// Fix: Add try-catch to all API routes
export async function GET(req: NextRequest) {
  try {
    // Your code
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Cause 3: Missing environment variables**

```bash
# Check environment variables
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME production
```

### Issue: Slow Response Times

**Symptoms:**

- Page load time > 3 seconds
- API responses > 1 second
- User complaints about slowness

**Investigation:**

```bash
# 1. Check Vercel Analytics
# Visit: Vercel Dashboard > Analytics

# 2. Check database query performance
# Enable slow query logging in Prisma

# 3. Check Sentry Performance
# Visit: Sentry > Performance

# 4. Run Lighthouse audit
npx lighthouse https://your-domain.com --view
```

**Solutions:**

**Slow Database Queries:**

```sql
-- Find slow queries in PostgreSQL
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX idx_products_tenant ON "Product"("tenantId");
CREATE INDEX idx_orders_user ON "Order"("userId");
```

**Large Payload Size:**

```typescript
// Use pagination
const products = await db.product.findMany({
  take: 20,
  skip: page * 20,
  // Only select needed fields
  select: {
    id: true,
    name: true,
    price: true,
    images: { take: 1 },
  },
});
```

**Unoptimized Images:**

```typescript
// Use next/image for automatic optimization
import Image from 'next/image'

<Image
  src="/product.jpg"
  width={500}
  height={500}
  alt="Product"
  loading="lazy"
/>
```

### Issue: Authentication Not Working

**Symptoms:**

- Users cannot log in
- OAuth redirect fails
- Session errors

**Investigation:**

```bash
# 1. Check NextAuth.js logs
vercel logs | grep NextAuth

# 2. Check environment variables
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# 3. Check Google OAuth console
# Verify redirect URIs include:
# https://your-domain.com/api/auth/callback/google

# 4. Test auth endpoint
curl https://your-domain.com/api/auth/session
```

**Common Causes:**

**Wrong NEXTAUTH_URL:**

```bash
# Must match production domain exactly
NEXTAUTH_URL=https://your-domain.com  # ✅ Correct
NEXTAUTH_URL=http://localhost:3000    # ❌ Wrong for production
```

**Google OAuth misconfigured:**

```
Google Console > Credentials > OAuth 2.0 Client

Authorized redirect URIs must include:
✅ https://your-domain.com/api/auth/callback/google
✅ https://www.your-domain.com/api/auth/callback/google
```

**Session cookie issues:**

```typescript
// In NextAuth config, ensure:
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true, // HTTPS only
    },
  },
}
```

### Issue: Stripe Payments Failing

**Symptoms:**

- Checkout fails
- Payment webhook not received
- Orders stuck in "pending" status

**Investigation:**

```bash
# 1. Check Stripe dashboard
# Visit: https://dashboard.stripe.com/test/events

# 2. Check webhook logs
vercel logs | grep stripe

# 3. Test webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "stripe-signature: test"

# 4. Check Stripe webhook settings
# Visit: Dashboard > Webhooks
```

**Solutions:**

**Webhook signature verification failing:**

```typescript
// Ensure STRIPE_WEBHOOK_SECRET is correct
const sig = headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
```

**Payment intent fails:**

```typescript
// Check for common issues:
// 1. Test vs Live keys mismatch
// 2. Insufficient funds
// 3. Card declined
// 4. 3D Secure required

// Add better error handling:
try {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "usd",
    metadata: { orderId },
  });
} catch (error) {
  if (error.code === "card_declined") {
    // Handle card declined
  }
  if (error.code === "insufficient_funds") {
    // Handle insufficient funds
  }
}
```

### Issue: Email Not Sending

**Symptoms:**

- Order confirmations not received
- Password reset emails not sent

**Investigation:**

```bash
# 1. Check Resend logs
# Visit: https://resend.com/emails

# 2. Check application logs
vercel logs | grep email

# 3. Test email endpoint
curl -X POST https://your-domain.com/api/test-email
```

**Solutions:**

**Check Resend API key:**

```bash
# Verify API key is set
vercel env ls | grep RESEND

# Test with Resend CLI
resend emails send --to test@example.com --subject "Test"
```

**Email template errors:**

```typescript
// Ensure React Email templates are valid
import { render } from '@react-email/render'

const html = render(<OrderConfirmation order={order} />)
// If this throws, template has errors
```

**Domain not verified:**

```
Resend Dashboard > Domains
- Verify domain is added
- Check DNS records are configured
- Wait for verification
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Application Health:**

- `/api/health` endpoint status
- Error rate (< 1%)
- Response time (P95 < 2s)
- Uptime (> 99.9%)

**Business Metrics:**

- Orders per hour
- Revenue per hour
- New user signups
- Cart abandonment rate

**Infrastructure:**

- Database connections
- Memory usage
- CPU usage
- Disk space

### Alert Configuration

**Critical Alerts (Immediate Response):**

```yaml
# Uptime Monitor
Alert: Site Down
Condition: /api/health returns non-200
Action: Page on-call engineer
Frequency: Every 1 minute

# Error Rate
Alert: High Error Rate
Condition: Error rate > 5% for 5 minutes
Action: Notify #incidents channel
Frequency: Every 5 minutes

# Database
Alert: Database Connection Failed
Condition: Database health check fails
Action: Page on-call engineer
Frequency: Every 1 minute
```

**Warning Alerts (Review During Business Hours):**

```yaml
# Performance
Alert: Slow Response Time
Condition: P95 > 3s for 10 minutes
Action: Notify #engineering
Frequency: Every 15 minutes

# Resource Usage
Alert: High Database Connection Usage
Condition: > 80% of connection pool used
Action: Notify #engineering
Frequency: Every 10 minutes
```

### Monitoring Tools Setup

**Sentry Alerts:**

```
Settings > Alerts > New Alert Rule

Alert name: High Error Rate
Conditions:
- When: Error count
- Is: More than 50
- In: 5 minutes
- For: All environments

Actions:
- Send notification to: #incidents
- Email: on-call@your-company.com
```

**Uptime Monitor (UptimeRobot):**

```
Monitor Type: HTTPS
URL: https://your-domain.com/api/health
Interval: 5 minutes
Alert Contacts: on-call@your-company.com
```

---

## Database Operations

### Daily Maintenance

**Check Database Size:**

```sql
SELECT
  pg_size_pretty(pg_database_size('your_database')) as size;
```

**Check Table Sizes:**

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Check Active Connections:**

```sql
SELECT
  count(*) as connections,
  state
FROM pg_stat_activity
GROUP BY state;
```

### Weekly Maintenance

**Analyze Query Performance:**

```sql
-- Find slow queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Check Index Usage:**

```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Vacuum Database (Automatic in Neon):**

```sql
-- Manual vacuum if needed
VACUUM ANALYZE;
```

### Monthly Maintenance

**Archive Old Data:**

```sql
-- Archive orders older than 2 years
INSERT INTO "OrderArchive"
SELECT * FROM "Order"
WHERE "createdAt" < NOW() - INTERVAL '2 years';

DELETE FROM "Order"
WHERE "createdAt" < NOW() - INTERVAL '2 years';
```

**Update Statistics:**

```sql
-- Update table statistics for query planner
ANALYZE;
```

### Backup Verification

**Test Backup Restore:**

```bash
# 1. Download latest backup
aws s3 cp s3://your-backup-bucket/latest.sql.gz ./

# 2. Create test database
createdb test_restore

# 3. Restore backup
gunzip latest.sql.gz
psql test_restore < latest.sql

# 4. Verify data
psql test_restore -c "SELECT COUNT(*) FROM \"Product\";"
psql test_restore -c "SELECT COUNT(*) FROM \"Order\";"

# 5. Cleanup
dropdb test_restore
```

---

## Deployment Procedures

### Standard Deployment

**Pre-Deployment Checklist:**

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Staging tested
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Backup created
- [ ] Team notified

**Deployment Steps:**

```bash
# 1. Merge to main
git checkout main
git merge develop
git push origin main

# 2. Monitor deployment
vercel logs --follow

# 3. Wait for GitHub Actions to complete
# Check: https://github.com/your-org/your-repo/actions

# 4. Verify deployment
curl https://your-domain.com/api/health

# 5. Run smoke tests
npm run test:smoke

# 6. Monitor for 30 minutes
# Check Sentry, logs, metrics
```

### Emergency Hotfix

**When to use:**

- Critical bug in production
- Security vulnerability
- Data corruption issue

**Hotfix Process:**

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-bug-fix

# 2. Make minimal fix
# Edit only necessary files

# 3. Test locally
npm run build
npm run test

# 4. Commit and push
git add .
git commit -m "hotfix: Fix critical bug"
git push origin hotfix/critical-bug-fix

# 5. Create PR and get emergency review
# Require at least 1 approval

# 6. Merge and deploy
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

# 7. Backport to develop
git checkout develop
git merge hotfix/critical-bug-fix
git push origin develop

# 8. Monitor closely
vercel logs --follow
```

### Database Migration Deployment

**Pre-Migration:**

```bash
# 1. Create backup
pg_dump $DATABASE_URL > backup_pre_migration_$(date +%Y%m%d).sql

# 2. Test migration in staging
export DATABASE_URL=$STAGING_DATABASE_URL
npx prisma migrate deploy

# 3. Verify staging
npm run test:e2e
```

**Migration Deployment:**

```bash
# 1. Apply migration to production
export DATABASE_URL=$PRODUCTION_DATABASE_URL
npx prisma migrate deploy

# 2. Verify migration
npx prisma db pull
npx prisma generate

# 3. Deploy application
git push origin main

# 4. Verify application
curl https://your-domain.com/api/health
```

**Rollback Migration (if needed):**

```bash
# 1. Rollback application
vercel alias set <previous-deployment> your-domain.com

# 2. Restore database
psql $DATABASE_URL < backup_pre_migration_YYYYMMDD.sql

# 3. Verify
curl https://your-domain.com/api/health
```

---

## Backup & Recovery

### Automated Backups

**Neon PostgreSQL:**

- Frequency: Daily at 2:00 AM UTC
- Retention: 30 days
- Type: Full database backup
- Storage: Neon infrastructure

**Verify Backup:**

```bash
# Check latest backup in Neon dashboard
# Visit: Neon Console > Backups
```

### Manual Backup

**Create Backup:**

```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backup_*.sql

# Upload to S3
aws s3 cp backup_*.sql.gz s3://your-backup-bucket/
```

**Schedule via Cron:**

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

### Recovery Procedures

**Full Database Restore:**

```bash
# 1. Download backup
aws s3 cp s3://your-backup-bucket/backup_YYYYMMDD_HHMMSS.sql.gz ./

# 2. Decompress
gunzip backup_YYYYMMDD_HHMMSS.sql.gz

# 3. Restore (WARNING: This will overwrite database)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 4. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Product\";"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Order\";"

# 5. Regenerate Prisma client
npx prisma generate
```

**Point-in-Time Recovery (Neon):**

```
1. Visit Neon Console
2. Select your database
3. Click "Restore"
4. Choose timestamp
5. Create new database or overwrite
6. Update DATABASE_URL
7. Restart application
```

**Partial Data Recovery:**

```sql
-- Restore single table
pg_restore -t "Product" backup.sql

-- Restore specific records
-- Export from backup database
pg_dump backup_db -t "Order" --where="id='specific-id'" > order.sql

-- Import to production
psql $DATABASE_URL < order.sql
```

---

## Security Incidents

### Security Incident Response

**Types of Incidents:**

- Data breach
- Unauthorized access
- DDoS attack
- Malware/virus
- Social engineering

### Data Breach Response

**Immediate Actions:**

```bash
# 1. Isolate affected systems
# - Revoke compromised API keys
# - Reset passwords
# - Disable compromised accounts

# 2. Preserve evidence
# - Save logs
# - Take screenshots
# - Document timeline

# 3. Assess scope
# - How many users affected?
# - What data was accessed?
# - When did breach occur?

# 4. Contain breach
# - Patch vulnerability
# - Deploy hotfix
# - Update security rules

# 5. Notify stakeholders
# - Internal team
# - Affected users (if PII exposed)
# - Authorities (if required by law)
```

**Post-Incident:**

```
1. Conduct post-mortem
2. Update security procedures
3. Implement additional controls
4. Train team on lessons learned
5. Document incident fully
```

### Compromised Credentials

**API Key Compromised:**

```bash
# 1. Revoke immediately
# Stripe: Dashboard > Developers > API Keys > Roll key
# Google: Console > Credentials > Delete/Create new

# 2. Update in Vercel
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production

# 3. Redeploy
vercel --prod

# 4. Audit access
# Check Stripe logs for unauthorized charges
# Check database for suspicious activity
```

**Database Credentials Compromised:**

```bash
# 1. Change database password immediately
# Neon: Console > Settings > Reset password

# 2. Update DATABASE_URL
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production

# 3. Restart application
vercel --prod

# 4. Audit database access
SELECT * FROM pg_stat_activity;

# 5. Review recent changes
SELECT * FROM "AuditLog" WHERE "timestamp" > NOW() - INTERVAL '24 hours';
```

### DDoS Attack

**Symptoms:**

- Sudden traffic spike
- Slow response times
- High server load
- Legitimate users cannot access

**Mitigation:**

```bash
# 1. Enable Vercel DDoS protection
# Contact Vercel support

# 2. Implement rate limiting
# Already implemented via middleware

# 3. Block malicious IPs
# Via Vercel firewall

# 4. Enable challenge page
# Vercel > Project > Settings > Firewall

# 5. Monitor traffic
vercel logs --follow | grep -E 'POST|GET'
```

---

## Performance Issues

### High CPU Usage

**Investigation:**

```bash
# 1. Check Vercel metrics
# Visit: Dashboard > Analytics > Resource Usage

# 2. Profile application
# Enable profiling in production briefly

# 3. Check for infinite loops
vercel logs | grep -i "timeout\|loop"

# 4. Check database queries
# Enable slow query logging
```

**Common Causes:**

- Infinite loops in code
- Unoptimized algorithms
- Too many concurrent requests
- Memory leak

### High Memory Usage

**Investigation:**

```bash
# 1. Check memory metrics
# Vercel Dashboard > Analytics

# 2. Look for memory leaks
# Use Node.js --inspect flag locally

# 3. Check payload sizes
vercel logs | grep -i "payload"
```

**Solutions:**

```typescript
// 1. Limit response size
const products = await db.product.findMany({
  take: 100, // Limit results
  select: {
    // Only select needed fields
    id: true,
    name: true,
    price: true,
  },
});

// 2. Stream large responses
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const products = await getProducts();
      controller.enqueue(JSON.stringify(products));
      controller.close();
    },
  });

  return new Response(stream);
}

// 3. Implement caching
const cached = await cache.get("products");
if (cached) return cached;
```

### Database Connection Exhaustion

**Symptoms:**

- "Too many connections" errors
- Requests timing out
- Database unavailable

**Investigation:**

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection limit
SELECT setting FROM pg_settings WHERE name = 'max_connections';
```

**Solutions:**

```typescript
// 1. Use connection pooling (already in Prisma)
// 2. Close connections properly
// 3. Increase connection limit (Neon dashboard)

// 4. Implement connection timeout
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["error"],
  connectionTimeout: 10000, // 10 seconds
});
```

---

## Emergency Contacts

### On-Call Rotation

**Primary On-Call:**

- Name: [Engineer Name]
- Phone: [Phone Number]
- Email: [Email]
- Slack: @engineer

**Secondary On-Call:**

- Name: [Engineer Name]
- Phone: [Phone Number]
- Email: [Email]
- Slack: @engineer2

**Escalation:**

- Engineering Manager: [Name] - [Phone]
- CTO: [Name] - [Phone]
- CEO: [Name] - [Phone]

### External Vendors

**Vercel Support:**

- Email: support@vercel.com
- Priority Support: [Link to support portal]
- Status: https://www.vercel-status.com

**Neon Support:**

- Email: support@neon.tech
- Docs: https://neon.tech/docs
- Status: https://neonstatus.com

**Stripe Support:**

- Support: https://support.stripe.com
- Phone: [Your dedicated support number]
- Status: https://status.stripe.com

**Sentry Support:**

- Support: support@sentry.io
- Docs: https://docs.sentry.io
- Status: https://status.sentry.io

---

**Last Updated**: 2025-01-15
**Version**: 1.0
**Maintained By**: DevOps Team
