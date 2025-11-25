# Security Hardening Checklist

## Environment Variables

### Production Environment

```bash
# .env.production

# ✅ Strong secret keys (32+ characters)
NEXTAUTH_SECRET="[GENERATE_WITH: openssl rand -base64 32]"

# ✅ Production URLs
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# ✅ Database (SSL enabled)
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# ✅ OAuth credentials
GOOGLE_CLIENT_ID="[FROM_GOOGLE_CONSOLE]"
GOOGLE_CLIENT_SECRET="[FROM_GOOGLE_CONSOLE]"

# ✅ Stripe (production keys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ✅ Email service
RESEND_API_KEY="re_..."

# ✅ File upload
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# ✅ Monitoring
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="[FROM_SENTRY]"
```

### Security Rules

- ❌ Never commit `.env` files to git
- ✅ Use Vercel secrets dashboard for production
- ✅ Rotate keys quarterly
- ✅ Use different keys for dev/staging/prod
- ✅ Enable 2FA on all service accounts

## HTTPS & Headers

### Force HTTPS

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http",
          },
        ],
        destination: "https://your-domain.com/:path*",
        permanent: true,
      },
    ];
  },
};
```

### Security Headers

```javascript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )

  return response
}
```

## Database Security

### Connection Security

- ✅ SSL/TLS enabled (`sslmode=require`)
- ✅ Strong passwords (16+ chars, mixed)
- ✅ Network isolation (Neon/Vercel only)
- ✅ IP whitelisting if available

### Query Security

```typescript
// ✅ Always use Prisma (prepared statements)
const user = await db.user.findUnique({
  where: { email: userInput }, // Safe - parameterized
});

// ❌ Never use raw SQL with user input
// BAD: await db.$queryRaw`SELECT * FROM User WHERE email = '${userInput}'`

// ✅ If raw SQL needed, use parameters
await db.$queryRaw`SELECT * FROM User WHERE email = ${userInput}`;
```

### Sensitive Data Encryption

```typescript
// Encrypt sensitive fields before storing
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

## API Security

### Rate Limiting

```typescript
// lib/rate-limit/config.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different endpoints
export const rateLimits = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 min
    analytics: true,
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per min
    analytics: true,
  }),
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 m"), // 3 requests per min
    analytics: true,
  }),
};
```

### Input Validation

- ✅ All inputs validated with Zod
- ✅ File upload size limits enforced
- ✅ File type validation
- ✅ XSS prevention (React auto-escapes)
- ✅ SQL injection prevention (Prisma)

### CORS Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const allowedOrigins = ["https://your-domain.com", "https://www.your-domain.com"];

  const origin = request.headers.get("origin");
  const isAllowed = origin && allowedOrigins.includes(origin);

  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return response;
}
```

## Authentication & Authorization

### Session Security

- ✅ HTTP-only cookies
- ✅ Secure flag enabled in production
- ✅ SameSite=Lax for CSRF protection
- ✅ Session expiry: 7 days
- ✅ Refresh token rotation

### Password Security

- ✅ bcrypt with 12 rounds minimum
- ✅ Password requirements enforced
- ✅ Account lockout after 5 failed attempts
- ✅ Password reset tokens expire in 1 hour

### RBAC Implementation

```typescript
// lib/auth/permissions.ts
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy = {
    SUPER_ADMIN: 3,
    STORE_OWNER: 2,
    CUSTOMER: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

// Usage in API routes
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!hasPermission(session.user.role, "STORE_OWNER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ... proceed with request
}
```

## File Upload Security

### Validation

```typescript
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Only JPEG, PNG, WEBP allowed." };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File too large. Maximum size: 5MB." };
  }

  return { valid: true };
}
```

### Content Scanning

- ✅ File type verification (magic bytes)
- ✅ Virus scanning (ClamAV or cloud service)
- ✅ Image validation (dimensions, format)
- ✅ Sanitize filenames

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

### Security Scanning in CI/CD

```yaml
# .github/workflows/security.yml
- name: Run Snyk security scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## Monitoring & Logging

### Security Event Logging

```typescript
// Log security events
export function logSecurityEvent(event: {
  type: "auth_failure" | "permission_denied" | "suspicious_activity";
  userId?: string;
  ip?: string;
  details: any;
}) {
  console.warn("[SECURITY]", {
    timestamp: new Date().toISOString(),
    ...event,
  });

  // Send to monitoring service
  Sentry.captureMessage(`Security event: ${event.type}`, {
    level: "warning",
    extra: event,
  });
}
```

### Failed Login Tracking

```typescript
// Track failed login attempts
const failedAttempts = new Map<string, number>();

export async function trackFailedLogin(email: string) {
  const attempts = (failedAttempts.get(email) || 0) + 1;
  failedAttempts.set(email, attempts);

  if (attempts >= 5) {
    // Lock account for 15 minutes
    logSecurityEvent({
      type: "suspicious_activity",
      details: { email, attempts, action: "account_locked" },
    });
  }

  // Clear after 15 minutes
  setTimeout(() => failedAttempts.delete(email), 15 * 60 * 1000);
}
```

## Compliance

### GDPR

- ✅ Data export functionality
- ✅ Data deletion on request
- ✅ Privacy policy displayed
- ✅ Cookie consent banner
- ✅ Data retention policy (max 7 years)

### PCI DSS

- ✅ No card data stored (Stripe handles)
- ✅ Stripe Elements for card input
- ✅ HTTPS enforced
- ✅ Security logs maintained

## Security Checklist

### Before Launch

- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Database SSL enabled
- [ ] Dependency vulnerabilities fixed
- [ ] Security audit completed
- [ ] Penetration testing done

### Post-Launch

- [ ] Monitor security logs daily
- [ ] Update dependencies weekly
- [ ] Rotate secrets quarterly
- [ ] Security audit annually
- [ ] Backup testing monthly
- [ ] Incident response plan ready
