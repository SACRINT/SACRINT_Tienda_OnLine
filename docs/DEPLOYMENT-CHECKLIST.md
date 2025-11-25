# Production Deployment Checklist

## Pre-Deployment

### Code Quality

- [ ] All tests passing (unit, integration, E2E)
- [ ] Build succeeds without errors/warnings
- [ ] TypeScript strict mode enabled
- [ ] ESLint warnings resolved
- [ ] Code review completed
- [ ] No console.log/console.error in production code

### Environment Variables

- [ ] All required env vars documented in .env.example
- [ ] Production env vars set in Vercel
- [ ] No secrets committed to git
- [ ] NEXT*PUBLIC* vars correctly prefixed
- [ ] Database connection string configured
- [ ] Stripe live keys configured
- [ ] Email service (Resend) API key set
- [ ] NEXTAUTH_SECRET generated (openssl rand -base64 32)
- [ ] NEXTAUTH_URL set to production domain

### Database

- [ ] Migrations run successfully
- [ ] Seed data loaded (if needed)
- [ ] Backups configured (Neon automatic)
- [ ] Connection pooling optimized
- [ ] Indexes created on frequently queried fields

### External Services

- [ ] Stripe webhook endpoint configured
- [ ] Resend domain verified
- [ ] Google OAuth credentials (production)
- [ ] Analytics tracking code installed
- [ ] Error tracking (Sentry) configured

### Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS prevention in place
- [ ] CSRF tokens implemented

### Performance

- [ ] Lighthouse score > 90 (all metrics)
- [ ] Core Web Vitals passing
- [ ] Images optimized (WebP/AVIF)
- [ ] Code splitting implemented
- [ ] Caching headers configured
- [ ] Database queries optimized

### SEO

- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Meta tags on all pages
- [ ] Structured data implemented
- [ ] Google Search Console verified

### Accessibility

- [ ] WCAG 2.1 AA compliant
- [ ] Screen reader tested
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient

## Deployment Steps

1. [ ] Merge feature branch to main
2. [ ] Tag release (git tag v1.0.0)
3. [ ] Push to GitHub
4. [ ] Vercel auto-deploys
5. [ ] Monitor deployment logs
6. [ ] Verify production build successful

## Post-Deployment

### Smoke Tests (Critical)

- [ ] Home page loads
- [ ] User can sign up
- [ ] User can login
- [ ] Products display
- [ ] Add to cart works
- [ ] Checkout completes
- [ ] Order created
- [ ] Email sent

### Monitoring

- [ ] Check Sentry for errors
- [ ] Verify Analytics tracking
- [ ] Monitor response times
- [ ] Check database connections
- [ ] Verify Stripe webhooks working

### DNS & SSL

- [ ] Custom domain configured
- [ ] SSL certificate valid
- [ ] WWW redirect working
- [ ] HTTPS forced

## Rollback Plan

If critical issues found:

1. [ ] Identify issue in Sentry/logs
2. [ ] Revert to previous deployment in Vercel
3. [ ] Notify team
4. [ ] Create hotfix branch
5. [ ] Test fix in staging
6. [ ] Re-deploy

## Sign-off

- [ ] Technical lead approval
- [ ] QA sign-off
- [ ] Product owner approval

**Deployed By**: ******\_\_\_******
**Date**: ******\_\_\_******
**Version**: ******\_\_\_******
