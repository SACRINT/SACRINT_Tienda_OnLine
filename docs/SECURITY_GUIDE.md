# Security Implementation Guide

## Overview

This document describes the security measures implemented in the Tienda Online 2025 platform and best practices for maintaining security.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [Input Validation](#input-validation)
4. [Rate Limiting](#rate-limiting)
5. [Security Headers](#security-headers)
6. [OWASP Top 10 Protection](#owasp-top-10-protection)
7. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### NextAuth.js v5 Implementation

**Location**: `src/lib/auth/auth.ts`

**Features**:
- OAuth 2.0 with Google Provider
- Session-based authentication
- Secure cookie handling
- CSRF protection (built-in)

**Session Validation**:
```typescript
import { auth } from '@/lib/auth/auth'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Continue with authenticated request
}
```

### Role-Based Access Control (RBAC)

**Roles**:
- `SUPER_ADMIN`: Platform administrator (all access)
- `STORE_OWNER`: Tenant owner (manage their store)
- `CUSTOMER`: Regular user (browse, purchase)

**Role Checking**:
```typescript
import { USER_ROLES } from '@/lib/types/user-role'

if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
  return NextResponse.json(
    { error: 'Forbidden - Insufficient permissions' },
    { status: 403 }
  )
}
```

---

## Data Protection

### Tenant Isolation

**Critical Security Feature**: All data is isolated by `tenantId`

**Implementation Pattern**:
```typescript
// ✅ CORRECT - Always validate tenant access
import { ensureTenantAccess } from '@/lib/db/tenant'

export async function getProducts(tenantId: string) {
  await ensureTenantAccess(tenantId)

  return db.product.findMany({
    where: { tenantId }, // ← MANDATORY
  })
}
```

**Common Pitfalls**:
```typescript
// ❌ WRONG - No tenant filtering
const products = await db.product.findMany()

// ❌ WRONG - Trusting client-provided tenantId without validation
const products = await db.product.findMany({
  where: { tenantId: req.body.tenantId }
})
```

### Password Security

**Hashing**: bcrypt with 12 rounds
```typescript
import bcrypt from 'bcryptjs'

const hashedPassword = await bcrypt.hash(password, 12)
const isValid = await bcrypt.compare(inputPassword, hashedPassword)
```

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Validation Schema**: `StrongPasswordSchema` in `src/lib/security/validators.ts`

### Sensitive Data

**Never Log or Store**:
- Raw credit card numbers (use Stripe tokens)
- Raw passwords
- API keys
- Session tokens
- Personal identification numbers

**Hashing for Logging**:
```typescript
import { hashSensitiveData } from '@/lib/security/validators'

const hashedEmail = await hashSensitiveData(email)
console.log(`User logged in: ${hashedEmail}`)
```

---

## Input Validation

### Two-Layer Validation

**Layer 1 - Frontend (Zod + React Hook Form)**:
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'

const schema = z.object({
  email: z.string().email(),
  password: StrongPasswordSchema,
})

const form = useForm({ resolver: zodResolver(schema) })
```

**Layer 2 - Backend (Zod)**:
```typescript
import { CreateProductSchema } from '@/lib/security/schemas/product-schemas'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = CreateProductSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid data', issues: validation.error.issues },
      { status: 400 }
    )
  }

  // Use validation.data (validated and typed)
}
```

### XSS Prevention

**HTML Sanitization**:
```typescript
import { sanitizeHTML } from '@/lib/security/validators'

const cleanDescription = sanitizeHTML(userInput)
```

**React Automatic Escaping**:
- React escapes all text content by default
- Use `dangerouslySetInnerHTML` only with sanitized content
- Never render user input as raw HTML

### SQL Injection Prevention

**Prisma Prepared Statements** (automatic):
```typescript
// ✅ SAFE - Prisma uses prepared statements
await db.product.findMany({
  where: { name: { contains: userInput } }
})

// ❌ DANGEROUS - Never use raw SQL with user input
await db.$executeRaw`SELECT * FROM products WHERE name LIKE '%${userInput}%'`
```

---

## Rate Limiting

### Implementation

**Location**: `src/lib/security/rate-limiter.ts`

**Usage in API Routes**:
```typescript
import { applyRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter'

export async function POST(req: NextRequest) {
  const session = await auth()

  // Apply rate limit
  const rateLimitResult = applyRateLimit(req, {
    userId: session?.user?.id,
    config: RATE_LIMITS.AUTHENTICATED,
  })

  if (!rateLimitResult.allowed) {
    return rateLimitResult.response // 429 Too Many Requests
  }

  // Continue with request
}
```

### Rate Limit Tiers

| Tier | Limit | Interval | Use Case |
|------|-------|----------|----------|
| ANONYMOUS | 10 req | 1 minute | Unauthenticated users |
| AUTHENTICATED | 100 req | 1 minute | Logged-in users |
| STORE_OWNER | 1000 req | 1 minute | Admin operations |
| UPLOAD | 20 req | 1 minute | File uploads |
| SEARCH | 50 req | 1 minute | Search queries |

### Production Upgrade

For production, use Redis:
```typescript
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

// Atomic rate limiting with Redis
const count = await redis.incr(`rate-limit:${identifier}`)
if (count === 1) {
  await redis.expire(`rate-limit:${identifier}`, 60)
}
```

---

## Security Headers

### HTTP Security Headers

**Location**: `src/lib/security/headers.ts`

**Headers Applied**:
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Legacy XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer info
- `Permissions-Policy` - Restrict browser features

### Content Security Policy (CSP)

**Prevents**: XSS, data injection, clickjacking

**Configuration**: `CONTENT_SECURITY_POLICY` in `src/lib/security/headers.ts`

**Key Directives**:
```
default-src 'self'
script-src 'self' https://js.stripe.com
img-src 'self' https: data: blob:
connect-src 'self' https://api.stripe.com
frame-src 'self' https://js.stripe.com
object-src 'none'
```

**Apply in Middleware**:
```typescript
// src/middleware.ts
import { applySecurityHeaders } from '@/lib/security/headers'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  return applySecurityHeaders(response, {
    includeCsp: true,
    includeHsts: process.env.NODE_ENV === 'production',
  })
}
```

### HTTPS Enforcement (HSTS)

**Production Only**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Vercel Configuration**: Automatic HTTPS on all deployments

---

## OWASP Top 10 Protection

### 1. Broken Access Control ✅

**Protection**:
- RBAC on all endpoints
- Tenant isolation enforced
- Session validation required
- Resource ownership checks

**Example**:
```typescript
// Verify user owns the resource
if (address.userId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 2. Cryptographic Failures ✅

**Protection**:
- HTTPS enforced (Vercel)
- bcrypt for passwords (12 rounds)
- Secure session cookies (httpOnly, secure, sameSite)
- No sensitive data in logs

### 3. Injection ✅

**Protection**:
- Prisma prepared statements (SQL injection)
- Input validation with Zod
- HTML sanitization
- No eval() or Function() with user input

### 4. Insecure Design ✅

**Protection**:
- Multi-tenant architecture with isolation
- Principle of least privilege (RBAC)
- Secure defaults
- Defense in depth (2-layer validation)

### 5. Security Misconfiguration ✅

**Protection**:
- Security headers configured
- CSP implemented
- Error messages sanitized (no stack traces in production)
- Dependencies scanned (`npm audit`)

### 6. Vulnerable Components ✅

**Protection**:
- Regular dependency updates
- `npm audit` in CI/CD
- Use of official, maintained libraries
- Pin major versions

**Check Vulnerabilities**:
```bash
npm audit
npm audit fix
```

### 7. Identification and Authentication Failures ✅

**Protection**:
- NextAuth.js v5 (battle-tested)
- Strong password requirements
- Session management with expiry
- No credential stuffing (rate limiting)

### 8. Software and Data Integrity Failures ✅

**Protection**:
- No dynamic code execution
- Integrity checks on uploads
- Signed webhooks (Stripe)
- Content verification (file type validation)

### 9. Security Logging and Monitoring ⚠️

**Current State**: Basic console logging

**TODO**:
- Centralized logging (Sentry, DataDog)
- Audit logs for critical operations
- Anomaly detection
- Security event alerts

**Implementation Guide**:
```typescript
// Log security events
console.log({
  event: 'LOGIN_ATTEMPT',
  userId: session?.user?.id,
  ip: req.headers.get('x-forwarded-for'),
  timestamp: new Date().toISOString(),
  success: true,
})
```

### 10. Server-Side Request Forgery (SSRF) ✅

**Protection**:
- URL validation for external requests
- Block internal IPs (192.168.x.x, 10.x.x.x, 127.0.0.1)
- Whitelist allowed domains

**Validation**:
```typescript
import { validateSafeURL } from '@/lib/security/validators'

if (!validateSafeURL(url)) {
  throw new Error('Invalid or unsafe URL')
}
```

---

## Security Checklist

### Development

- [ ] All API routes require authentication
- [ ] All database queries filtered by tenantId
- [ ] Input validated with Zod on backend
- [ ] Passwords hashed with bcrypt
- [ ] No secrets in code (use .env)
- [ ] Error messages don't leak sensitive info

### Pre-Production

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Enable HSTS header
- [ ] Configure CSP for production domains
- [ ] Set up rate limiting with Redis
- [ ] Enable security monitoring (Sentry)
- [ ] Review all TODO security items

### Production

- [ ] HTTPS enforced (Vercel automatic)
- [ ] Security headers applied via middleware
- [ ] Rate limiting active
- [ ] Database backups configured
- [ ] Incident response plan documented
- [ ] Security contact published

### Ongoing

- [ ] Weekly `npm audit`
- [ ] Monthly security review
- [ ] Quarterly penetration testing
- [ ] Annual security audit

---

## Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs and alerts
2. **Contain**: Disable affected accounts/features
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix vulnerability
5. **Recover**: Restore service
6. **Learn**: Post-mortem and improvements

### Emergency Contacts

- Security Team: security@example.com
- On-Call Engineer: Use PagerDuty
- Legal: legal@example.com

---

## Additional Resources

### External References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)

### Tools

- **Static Analysis**: ESLint security plugins
- **Dependency Scanning**: npm audit, Snyk
- **Penetration Testing**: OWASP ZAP, Burp Suite
- **Monitoring**: Sentry, DataDog, New Relic

---

**Last Updated**: Week 4
**Security Version**: 1.0
**Next Review**: Week 8
