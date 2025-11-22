# Security Hardening Guide

**Version**: 1.0.0
**Date**: November 22, 2025
**Week**: 21-22 - Security Hardening

---

## 🎯 Overview

This guide documents the comprehensive security measures implemented in the SACRINT Tienda Online platform. All security features are production-ready and follow industry best practices.

## 🛡️ Security Layers

### Layer 1: Rate Limiting

**Purpose**: Prevent brute-force attacks, DDoS, and API abuse

**Implementation**: `src/lib/security/rate-limiter.ts`

```typescript
import { rateLimiters, getIdentifier } from "@/lib/security";

// Check rate limit
const identifier = getIdentifier(request, userId);
const result = rateLimiters.auth.check(identifier);

if (!result.success) {
  return Response.json({ error: "Too many requests" }, { status: 429 });
}
```

**Pre-configured Limiters**:

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `auth` | 15 min | 5 | Login attempts |
| `api` | 1 min | 60 | General API calls |
| `checkout` | 1 min | 10 | Payment processing |
| `search` | 1 min | 120 | Search queries |
| `passwordReset` | 1 hour | 3 | Password resets |
| `email` | 1 min | 5 | Email sending |

**Features**:
- Token bucket algorithm with sliding window
- LRU cache for performance (10,000 IPs tracked)
- Automatic expiration
- X-RateLimit headers in responses
- IP-based + user-based tracking

**Usage in API Routes**:

```typescript
import { withRateLimit } from "@/lib/security";

export const POST = withRateLimit(
  async (req) => {
    // Your handler logic
  },
  "auth" // Limiter name
);
```

---

### Layer 2: CSRF Protection

**Purpose**: Prevent Cross-Site Request Forgery attacks

**Implementation**: `src/lib/security/csrf.ts`

**How it works**:
1. Server generates cryptographically secure token
2. Token stored in httpOnly cookie
3. Client sends token in header or body
4. Server validates with constant-time comparison

**Server-side Usage**:

```typescript
import { withCsrfProtection } from "@/lib/security";

export async function POST(req: Request) {
  return withCsrfProtection(req, async () => {
    // Your protected handler
  });
}
```

**Client-side Usage**:

```typescript
import { csrfFetch, useCsrfToken } from "@/lib/security";

// Option 1: Use wrapper
await csrfFetch("/api/endpoint", {
  method: "POST",
  body: JSON.stringify(data),
});

// Option 2: Use hook
const { token, headers } = useCsrfToken();
await fetch("/api/endpoint", {
  method: "POST",
  headers,
  body: JSON.stringify(data),
});
```

**Features**:
- Automatic token generation
- Multiple validation methods (header, body, form data)
- Timing-safe comparison
- 24-hour token expiration
- Strict SameSite cookies

---

### Layer 3: Input Sanitization

**Purpose**: Prevent XSS, SQL injection, and code injection

**Implementation**: `src/lib/security/sanitization.ts`

**Available Sanitizers**:

```typescript
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename,
  sanitizePhone,
  sanitizeSearchQuery,
  sanitizePagination,
  removeNullBytes,
} from "@/lib/security";

// HTML sanitization (removes scripts, iframes, event handlers)
const clean = sanitizeHtml(userInput);

// Strip all HTML
const plain = sanitizeText(userInput);

// Email normalization
const email = sanitizeEmail("User@Example.COM"); // "user@example.com"

// URL validation (only http/https)
const url = sanitizeUrl(untrustedUrl);

// Filename safety (prevent path traversal)
const filename = sanitizeFilename("../../etc/passwd"); // "etc_passwd"

// Phone number cleaning
const phone = sanitizePhone("+1 (555) 123-4567"); // "+15551234567"

// Search query escaping
const query = sanitizeSearchQuery("user input with $pecial chars");

// Pagination validation
const { page, limit } = sanitizePagination({
  page: req.query.page,
  limit: req.query.limit,
  maxLimit: 100,
});
```

**Best Practices**:
- ✅ Sanitize ALL user input
- ✅ Use Zod for schema validation (first line of defense)
- ✅ Sanitize before database storage
- ✅ Sanitize before rendering to browser
- ✅ Use Prisma parameterized queries (prevents SQL injection)

---

### Layer 4: Security Headers

**Purpose**: Configure browser security policies

**Implementation**: `src/lib/security/security-headers.ts`

**Configured Headers**:

```typescript
{
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME sniffing
  "X-Content-Type-Options": "nosniff",

  // XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",

  // Force HTTPS
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // Content Security Policy (CSP)
  "Content-Security-Policy": "default-src 'self'; ..."
}
```

**CSP Configuration**:
- ✅ Default to self-origin only
- ✅ Strict script-src with nonce support
- ✅ Allow Stripe.js for payments
- ✅ Fonts from Google Fonts
- ✅ Images from any HTTPS source
- ✅ Block object embeds
- ✅ Upgrade insecure requests

**Usage in Middleware**:

```typescript
// middleware.ts
import { applySecurityHeaders } from "@/lib/security";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}
```

---

### Layer 5: Audit Logging

**Purpose**: Track security-critical events for compliance and forensics

**Implementation**: `src/lib/security/audit-logger.ts`

**Event Types**:

```typescript
enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS,
  LOGIN_FAILED,
  LOGOUT,
  PASSWORD_RESET_REQUESTED,
  PASSWORD_CHANGED,

  // Authorization
  UNAUTHORIZED_ACCESS,
  PERMISSION_DENIED,

  // Data operations
  USER_CREATED,
  PRODUCT_UPDATED,
  ORDER_CREATED,

  // Payments
  PAYMENT_SUCCESS,
  REFUND_ISSUED,

  // Security
  RATE_LIMIT_EXCEEDED,
  CSRF_TOKEN_INVALID,
  SUSPICIOUS_ACTIVITY,

  // Admin
  SETTINGS_CHANGED,
  ROLE_CHANGED,
}
```

**Usage**:

```typescript
import { auditLog } from "@/lib/security";

// Convenience functions
await auditLog.loginSuccess(userId, request);
await auditLog.loginFailed(email, request);
await auditLog.unauthorizedAccess(userId, resource, request);
await auditLog.suspiciousActivity(userId, reason, request);

// Custom events
await logAuditEvent({
  eventType: AuditEventType.PAYMENT_SUCCESS,
  severity: AuditSeverity.INFO,
  userId,
  resourceId: orderId,
  details: { amount, currency },
});
```

**Features**:
- Severity levels (INFO, WARNING, ERROR, CRITICAL)
- Automatic IP and User-Agent capture
- Metadata support for custom data
- Critical event alerts
- Query interface for admin dashboard

**Logged Information**:
- Timestamp
- Event type
- User ID
- Tenant ID
- IP address
- User agent
- Resource affected
- Event details
- Metadata

---

## 🔐 Authentication & Authorization

### NextAuth Configuration

**File**: `src/lib/auth/auth.ts`

**Security Features**:
- ✅ Google OAuth integration
- ✅ Session tokens in httpOnly cookies
- ✅ CSRF protection built-in
- ✅ Secure session storage
- ✅ Auto token rotation

### Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",    // Full system access
  STORE_OWNER = "STORE_OWNER",     // Tenant management
  CUSTOMER = "CUSTOMER",           // Shopping only
}
```

**Middleware Example**:

```typescript
import { auth } from "@/lib/auth/auth";

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!allowedRoles.includes(user.role)) {
    await auditLog.unauthorizedAccess(session.user.id, "resource", request);
    throw new Error("Forbidden");
  }

  return user;
}
```

---

## 🏢 Multi-Tenant Security

### Tenant Isolation

**Critical Rule**: ALWAYS filter by tenantId

```typescript
// ✅ CORRECT
const products = await db.product.findMany({
  where: {
    tenantId: currentUser.tenantId, // REQUIRED
    isActive: true,
  },
});

// ❌ WRONG - Data leak!
const products = await db.product.findMany({
  where: { isActive: true },
});
```

**Data Access Layer (DAL)**:

```typescript
// lib/dal/products.ts
export async function getProductsForTenant(tenantId: string) {
  return db.product.findMany({
    where: { tenantId }, // Enforced at DAL level
  });
}
```

---

## 💳 Payment Security

### PCI DSS Compliance

**What we DO**:
- ✅ Use Stripe.js (client-side tokenization)
- ✅ Never store card numbers
- ✅ Use Stripe Customer IDs
- ✅ Server-side payment intent creation
- ✅ Webhook signature verification
- ✅ HTTPS only

**What we DON'T do**:
- ❌ Never handle raw card data
- ❌ Never log sensitive payment info
- ❌ Never store CVV
- ❌ Never transmit card data via URL

**Webhook Security**:

```typescript
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: Request) {
  const provider = getPaymentProvider();
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  const isValid = provider.verifyWebhookSignature(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  if (!isValid) {
    await auditLog.suspiciousActivity(
      undefined,
      "Invalid webhook signature",
      req,
    );
    return new Response("Invalid signature", { status: 400 });
  }

  // Process webhook
}
```

---

## 🧪 Security Testing

### Testing Utilities

**File**: `src/lib/testing/api-test-helpers.ts`

```typescript
import { createMockRequest, expectStatus, mockSession } from "@/lib/testing";

// Test rate limiting
test("should block after 5 failed login attempts", async () => {
  for (let i = 0; i < 5; i++) {
    await POST(createMockRequest("/api/auth/login", {
      method: "POST",
      body: { email: "test@test.com", password: "wrong" },
    }));
  }

  const response = await POST(createMockRequest("/api/auth/login", {
    method: "POST",
    body: { email: "test@test.com", password: "wrong" },
  }));

  await expectStatus(response, 429); // Too Many Requests
});

// Test CSRF protection
test("should reject request without CSRF token", async () => {
  const response = await POST(createMockRequest("/api/products", {
    method: "POST",
    body: { name: "Test Product" },
  }));

  await expectStatus(response, 403); // Forbidden
});

// Test tenant isolation
test("should not access other tenant's data", async () => {
  const session = mockSession("user1", "STORE_OWNER");
  // Test that user1 cannot access tenant2's products
});
```

---

## 📋 Security Checklist

### Before Production Deployment

- [ ] All environment variables set
- [ ] HTTPS enforced (Vercel automatic)
- [ ] CSP headers configured
- [ ] Rate limiting enabled on all public endpoints
- [ ] CSRF protection on all mutation endpoints
- [ ] Input validation with Zod on all APIs
- [ ] Audit logging for critical events
- [ ] Webhook signatures verified
- [ ] Session tokens in httpOnly cookies
- [ ] No secrets in client-side code
- [ ] No console.log in production
- [ ] Database queries use Prisma (parameterized)
- [ ] Multi-tenant isolation verified
- [ ] RBAC enforced on all protected routes
- [ ] Security headers tested
- [ ] Dependencies updated (no known CVEs)

### Security Headers Check

```bash
curl -I https://your-domain.com | grep -E "(X-Frame|X-Content|Strict-Transport|Content-Security)"
```

### Rate Limiting Test

```bash
# Should return 429 after 5 attempts
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

---

## 🚨 Incident Response

### Steps if Security Breach Detected

1. **Immediate Actions**:
   - Rotate all secrets (API keys, JWT secrets)
   - Review audit logs
   - Block suspicious IPs
   - Notify users if data compromised

2. **Investigation**:
   ```typescript
   // Query audit logs
   const logs = await queryAuditLogs({
     severity: AuditSeverity.CRITICAL,
     startDate: new Date("2025-11-20"),
   });
   ```

3. **Remediation**:
   - Patch vulnerability
   - Deploy fix
   - Monitor for repeat attempts

4. **Post-Incident**:
   - Document incident
   - Update security measures
   - Team training

---

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [Vercel Security](https://vercel.com/docs/security)

---

## 📞 Security Contact

For security vulnerabilities, please report to:
- Email: security@sacrint.com (setup required)
- GitHub Security Advisories
- Direct message to admin

**Do NOT** open public issues for security vulnerabilities.

---

**Last Updated**: November 22, 2025
**Security Lead**: Development Team
**Next Review**: Monthly
