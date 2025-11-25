# Security Documentation

## Overview

This document outlines the security measures implemented in the SACRINT Tienda Online platform.

## Authentication & Authorization

### Authentication Methods

1. **NextAuth.js v5** - Google OAuth integration
2. **Session-based authentication** - Secure session tokens
3. **API key authentication** - For programmatic access

### Role-Based Access Control (RBAC)

Three user roles with granular permissions:

- **SUPER_ADMIN**: Full system access
- **STORE_OWNER**: Store management access
- **CUSTOMER**: Shopping and profile access

### Permissions

| Permission   | SUPER_ADMIN |        STORE_OWNER        |         CUSTOMER         |
| ------------ | :---------: | :-----------------------: | :----------------------: |
| tenant:\*    |     ✅      |        Read/Update        |            ❌            |
| user:\*      |     ✅      |    Read/Create/Update     |    Read/Update (self)    |
| product:\*   |     ✅      |            ✅             |           Read           |
| order:\*     |     ✅      | Read/Update/Cancel/Refund | Read/Create/Cancel (own) |
| analytics:\* |     ✅      |            ✅             |            ❌            |
| settings:\*  |     ✅      |            ✅             |            ❌            |
| api_key:\*   |     ✅      |            ✅             |            ❌            |
| audit:read   |     ✅      |            ❌             |            ❌            |

## Data Protection

### Encryption

- **At Rest**: AES-256-GCM encryption for sensitive data
- **In Transit**: TLS 1.3 for all connections
- **Password Hashing**: bcrypt with 12 rounds

### Personal Data

- PII is encrypted before storage
- Data access is logged for audit
- Right to deletion supported (GDPR)

## Security Headers

All responses include:

```
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Rate Limiting

Endpoint-specific rate limits:

| Endpoint Type  | Window | Max Requests |
| -------------- | ------ | ------------ |
| General API    | 1 min  | 100          |
| Authentication | 15 min | 5            |
| Password Reset | 1 hour | 3            |
| Checkout       | 1 min  | 10           |
| Search         | 1 min  | 30           |
| Uploads        | 1 min  | 10           |

## Input Validation

- **Zod schemas** for all inputs
- **SQL injection prevention** via Prisma prepared statements
- **XSS protection** via content sanitization
- **CSRF protection** via tokens

## Audit Logging

All security-relevant events are logged:

- Authentication events (login, logout, failed attempts)
- Authorization changes (role changes, permission updates)
- Data access (sensitive data views)
- Configuration changes (settings, API keys)
- Payment events

Logs include:

- Timestamp
- Actor (user ID, IP, user agent)
- Target resource
- Changes (before/after)
- Success/failure status

## Session Security

- **HttpOnly cookies** - Not accessible via JavaScript
- **Secure flag** - HTTPS only in production
- **SameSite=Lax** - CSRF protection
- **Session renewal** - Extended on activity
- **Absolute max age** - 7 days maximum

## API Security

### API Keys

- Prefix: `sk_` for identification
- SHA-256 hashed storage
- Scoped permissions
- Rate limiting per key
- Expiration support

### Webhook Security

- HMAC signature verification
- Timestamp validation (prevent replay)
- IP allowlisting (Stripe, etc.)

## Compliance

### GDPR

- Data minimization
- Purpose limitation
- Right to access
- Right to deletion
- Data portability

### PCI DSS

- No card data storage (Stripe tokenization)
- Secure transmission
- Access control
- Audit trails

## Monitoring & Alerting

### Security Monitoring

- Failed authentication attempts
- Rate limit violations
- Suspicious activity patterns
- Error rate spikes

### Incident Response

1. Detection (automated monitoring)
2. Analysis (log review)
3. Containment (block/revoke)
4. Eradication (fix vulnerability)
5. Recovery (restore service)
6. Lessons learned (post-mortem)

## Vulnerability Management

### Regular Scanning

- Dependency audit (weekly)
- CodeQL analysis (on PR)
- Secret scanning (on push)
- SAST scanning (Semgrep)

### Responsible Disclosure

Report security issues to: security@example.com

## Security Checklist

### Development

- [ ] Input validation on all endpoints
- [ ] Authentication required for protected routes
- [ ] Authorization checks for resource access
- [ ] Tenant isolation enforced
- [ ] Sensitive data encrypted
- [ ] No secrets in code

### Deployment

- [ ] Environment variables configured
- [ ] TLS certificates valid
- [ ] Security headers enabled
- [ ] Rate limiting active
- [ ] Monitoring enabled
- [ ] Backups configured

### Maintenance

- [ ] Dependencies updated
- [ ] Security patches applied
- [ ] Access reviewed
- [ ] Logs reviewed
- [ ] Keys rotated

## Contact

For security concerns, contact the security team at security@example.com
