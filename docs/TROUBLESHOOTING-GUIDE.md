# Troubleshooting Guide

## Overview

Comprehensive troubleshooting guide for common issues in the SACRINT E-commerce Platform.

**Last Updated**: November 25, 2025
**Support**: support@yourdomain.com

---

## Table of Contents

1. [Application Won't Start](#application-wont-start)
2. [Database Issues](#database-issues)
3. [Authentication Problems](#authentication-problems)
4. [Payment Processing Errors](#payment-processing-errors)
5. [Email Delivery Issues](#email-delivery-issues)
6. [Performance Problems](#performance-problems)
7. [Deployment Failures](#deployment-failures)
8. [API Errors](#api-errors)
9. [Build Errors](#build-errors)
10. [Common Error Messages](#common-error-messages)

---

## Application Won't Start

### Problem: "Port 3000 is already in use"

**Symptoms**:

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# OR use different port
PORT=3001 npm run dev
```

---

### Problem: "Cannot find module '@prisma/client'"

**Symptoms**:

```
Error: Cannot find module '@prisma/client'
```

**Solution**:

```bash
# Generate Prisma Client
npx prisma generate

# If still failing, reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

---

### Problem: ".env file not loading"

**Symptoms**:

- Environment variables are undefined
- Database connection failing

**Solution**:

```bash
# Ensure .env.local exists
ls -la .env.local

# Check file format (no quotes needed)
cat .env.local

# Correct format:
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=abc123

# Restart dev server
npm run dev
```

---

## Database Issues

### Problem: "Database connection failed"

**Symptoms**:

```
PrismaClientInitializationError: Can't reach database server
```

**Solution**:

1. **Check connection string**:

```bash
# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

2. **Check Neon dashboard**:

- Database isn't suspended (free tier)
- Connection limit not exceeded
- SSL is required

3. **Check network**:

```bash
# Test DNS resolution
nslookup <your-database-host>

# Test port connectivity
nc -zv <host> 5432
```

---

### Problem: "Too many database connections"

**Symptoms**:

```
Error: Too many connections
```

**Solution**:

1. **Check active connections**:

```sql
SELECT count(*) FROM pg_stat_activity;
```

2. **Close idle connections**:

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '5 minutes';
```

3. **Adjust connection pool**:

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  connection_limit = 5  // Reduce from default 10
  pool_timeout = 5
}
```

---

### Problem: "Migration failed"

**Symptoms**:

```
Error: Migration failed to apply cleanly
```

**Solution**:

1. **Check migration status**:

```bash
npx prisma migrate status
```

2. **Resolve failed migration**:

```bash
# Mark migration as applied (if safe)
npx prisma migrate resolve --applied <migration-name>

# OR rollback
npx prisma migrate resolve --rolled-back <migration-name>
```

3. **Reset database (development only)**:

```bash
npx prisma migrate reset
```

---

## Authentication Problems

### Problem: "Session not persisting"

**Symptoms**:

- User logs in but immediately logged out
- Session cookie not set

**Solution**:

1. **Check NEXTAUTH_URL**:

```bash
# Must match your domain exactly
NEXTAUTH_URL=https://yourdomain.com  # Production
NEXTAUTH_URL=http://localhost:3000    # Development
```

2. **Check cookies in browser**:

```javascript
// DevTools → Application → Cookies
// Should see: next-auth.session-token
```

3. **Check NEXTAUTH_SECRET**:

```bash
# Must be set and consistent
echo $NEXTAUTH_SECRET

# Generate new secret if needed
openssl rand -base64 32
```

---

### Problem: "Google OAuth not working"

**Symptoms**:

```
Error: redirect_uri_mismatch
```

**Solution**:

1. **Check authorized redirect URIs in Google Console**:

```
http://localhost:3000/api/auth/callback/google  # Development
https://yourdomain.com/api/auth/callback/google # Production
```

2. **Verify credentials**:

```bash
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

3. **Check OAuth consent screen**:

- Publishing status must be "In Production" for public access
- Add authorized domains

---

## Payment Processing Errors

### Problem: "Stripe webhook not receiving events"

**Symptoms**:

- Orders stuck in "pending" status
- No payment confirmation

**Solution**:

1. **Check webhook endpoint**:

```bash
# Must be publicly accessible
curl -X POST https://yourdomain.com/api/webhooks/stripe
```

2. **Verify webhook secret**:

```bash
# In Stripe dashboard: Developers → Webhooks → Signing secret
echo $STRIPE_WEBHOOK_SECRET
```

3. **Test webhook locally**:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. **Check Stripe dashboard**:

- Webhooks → View logs
- Look for failed deliveries

---

### Problem: "Payment intent creation failed"

**Symptoms**:

```
Error: No such customer: cus_...
```

**Solution**:

1. **Check Stripe API version**:

- Ensure using compatible version
- Update @stripe/stripe-js

2. **Verify API keys**:

```bash
# Test mode vs Live mode
echo $STRIPE_SECRET_KEY  # Should start with sk_live_ in production
```

3. **Check amount calculation**:

```typescript
// Must be in cents and integer
const amount = Math.round(total * 100); // Convert to cents
```

---

## Email Delivery Issues

### Problem: "Emails not sending"

**Symptoms**:

- Order confirmation not received
- No error in logs

**Solution**:

1. **Check Resend API key**:

```bash
echo $RESEND_API_KEY
```

2. **Verify domain**:

- Resend dashboard → Domains
- DNS records configured
- Domain status: "Verified"

3. **Check email queue**:

```typescript
// Add logging to email function
console.log("[EMAIL] Attempting to send to:", recipient);
const result = await resend.emails.send(emailData);
console.log("[EMAIL] Result:", result);
```

4. **Check spam folder**:

- Initial emails may go to spam
- Add "no-reply@yourdomain.com" to contacts

---

## Performance Problems

### Problem: "Slow page load times"

**Symptoms**:

- Pages taking > 3 seconds to load
- High Time to First Byte (TTFB)

**Diagnosis**:

1. **Check Lighthouse report**:

```bash
# Chrome DevTools → Lighthouse → Analyze page load
```

2. **Check slow database queries**:

```bash
# In Neon dashboard: Monitoring → Slow Queries
```

3. **Profile API endpoints**:

```typescript
// Add timing to API routes
console.time("API /products");
const products = await getProducts();
console.timeEnd("API /products");
```

**Solutions**:

1. **Add database indexes**:

```sql
CREATE INDEX idx_products_category ON Product(categoryId);
CREATE INDEX idx_orders_user ON Order(userId);
```

2. **Implement caching**:

```typescript
// Cache product list for 5 minutes
export const revalidate = 300; // seconds
```

3. **Optimize images**:

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/product.jpg"
  width={800}
  height={600}
  alt="Product"
  loading="lazy"
/>
```

---

### Problem: "High memory usage"

**Symptoms**:

- Vercel function timeouts
- 502 errors intermittently

**Solution**:

1. **Check function memory limit**:

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024 // Increase from default 256
    }
  }
}
```

2. **Identify memory leaks**:

```typescript
// Add heap snapshot before/after
const heapBefore = process.memoryUsage().heapUsed;
// ... operation
const heapAfter = process.memoryUsage().heapUsed;
console.log("Memory used:", (heapAfter - heapBefore) / 1024 / 1024, "MB");
```

---

## Deployment Failures

### Problem: "Vercel deployment failing"

**Symptoms**:

```
Error: Command "npm run build" exited with 1
```

**Solution**:

1. **Check build logs**:

```
# In Vercel dashboard: Deployments → Failed deployment → View logs
```

2. **Reproduce build locally**:

```bash
npm run build

# Check for TypeScript errors
npm run type-check
```

3. **Common issues**:
   - Missing environment variables
   - TypeScript errors
   - ESLint errors
   - Prisma schema issues

4. **Skip build if needed** (temporary):

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build",
    "build:skip-lint": "SKIP_ENV_VALIDATION=1 next build"
  }
}
```

---

### Problem: "Environment variables not loading"

**Symptoms**:

- Build succeeds but runtime errors
- Database connection fails in production

**Solution**:

1. **Check Vercel environment variables**:

```bash
# Vercel dashboard → Settings → Environment Variables
# Ensure all required vars are set for Production
```

2. **Redeploy after adding variables**:

```bash
vercel --prod
```

3. **Verify variables are loaded**:

```typescript
// Add debug endpoint (remove after testing)
export async function GET() {
  return Response.json({
    hasDB: !!process.env.DATABASE_URL,
    hasAuth: !!process.env.NEXTAUTH_SECRET,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
  });
}
```

---

## API Errors

### Problem: "CORS errors in browser"

**Symptoms**:

```
Access to fetch at '...' has been blocked by CORS policy
```

**Solution**:

1. **Add CORS headers**:

```typescript
// middleware.ts
export function middleware(req: Request) {
  const res = NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", "https://yourdomain.com");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return res;
}
```

2. **Handle OPTIONS requests**:

```typescript
// app/api/endpoint/route.ts
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    },
  });
}
```

---

### Problem: "API returning 500 errors"

**Symptoms**:

```
Internal Server Error
```

**Diagnosis**:

1. **Check Sentry**:

```
# Sentry dashboard → Issues
```

2. **Check Vercel logs**:

```
# Vercel dashboard → Deployments → Production → Logs
```

3. **Add error logging**:

```typescript
export async function GET(req: Request) {
  try {
    // API logic
  } catch (error) {
    console.error("[API ERROR]", error);

    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
```

---

## Build Errors

### Problem: "TypeScript errors during build"

**Symptoms**:

```
Type 'X' is not assignable to type 'Y'
```

**Solution**:

1. **Run type check locally**:

```bash
npm run type-check
```

2. **Generate Prisma types**:

```bash
npx prisma generate
```

3. **Check tsconfig.json**:

```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true // Skip node_modules type checking
  }
}
```

---

### Problem: "Out of memory during build"

**Symptoms**:

```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solution**:

1. **Increase Node memory**:

```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 next build"
  }
}
```

2. **Optimize build**:

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};
```

---

## Common Error Messages

### "Invalid JSON"

```
SyntaxError: Unexpected token < in JSON at position 0
```

**Cause**: API returning HTML instead of JSON (usually 404/500 page)

**Fix**: Check API endpoint URL is correct

---

### "Network request failed"

```
TypeError: Failed to fetch
```

**Causes**:

- No internet connection
- CORS error
- API endpoint down
- SSL certificate invalid

**Fix**: Check network, CORS config, and API status

---

### "Too many redirects"

```
ERR_TOO_MANY_REDIRECTS
```

**Cause**: Redirect loop in middleware or config

**Fix**: Check middleware.ts and next.config.js redirects

---

## Emergency Contacts

- **On-call Engineer**: [Phone]
- **Technical Lead**: [Phone]
- **Vercel Support**: https://vercel.com/support
- **Neon Support**: https://neon.tech/docs/introduction/support
- **Stripe Support**: https://support.stripe.com/

---

## Useful Debug Commands

```bash
# Check environment variables
printenv | grep -E "(DATABASE|NEXTAUTH|STRIPE)"

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check Node/npm versions
node -v
npm -v

# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Rebuild everything
rm -rf node_modules .next package-lock.json
npm install
npm run build

# Check port usage
lsof -i :<port>

# View logs in production
vercel logs --prod

# Test API endpoint
curl -X GET https://yourdomain.com/api/health -v
```

---

**Last Updated**: November 25, 2025
**Version**: 1.0.0
