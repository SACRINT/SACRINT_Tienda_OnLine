# Launch Checklist

## Pre-Launch (1 Week Before)

### Infrastructure

- [ ] Vercel project created and configured
- [ ] Neon database production instance ready
- [ ] Custom domain configured with SSL
- [ ] DNS propagation complete
- [ ] CDN caching rules configured

### Security

- [ ] All secrets in environment variables (not in code)
- [ ] `NEXTAUTH_SECRET` is strong (32+ characters)
- [ ] Stripe live keys configured
- [ ] Google OAuth production redirect URIs set
- [ ] Security headers verified with securityheaders.com
- [ ] Rate limiting tested and active
- [ ] CSRF protection enabled
- [ ] No debug logs in production

### Database

- [ ] Production migrations applied
- [ ] Indexes created for common queries
- [ ] Connection pooling enabled
- [ ] Backup strategy in place
- [ ] Seed data removed (if test data)

### Third-Party Services

- [ ] Stripe webhooks configured for production URL
- [ ] Email service (Resend) verified
- [ ] Google OAuth credentials are production-ready
- [ ] Analytics tracking code installed

---

## Launch Day

### Final Checks

- [ ] `pnpm build` succeeds without errors
- [ ] All tests passing
- [ ] Environment variables set in Vercel
- [ ] Database connected and responding

### Deployment

- [ ] Deploy to Vercel
- [ ] Verify deployment successful
- [ ] Check function logs for errors
- [ ] DNS pointing to production

### Smoke Tests

- [ ] Homepage loads correctly
- [ ] Products display with images
- [ ] Search works
- [ ] User can register with Google
- [ ] User can login
- [ ] Add to cart works
- [ ] Checkout process completes
- [ ] Payment processes (test transaction)
- [ ] Order confirmation email received
- [ ] Order appears in dashboard

### Performance

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Images optimized and lazy-loaded

---

## Post-Launch

### Monitoring Setup

- [ ] Error tracking active (Sentry)
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up
- [ ] Performance dashboards accessible

### Analytics

- [ ] Google Analytics tracking
- [ ] Conversion tracking installed
- [ ] E-commerce events firing correctly

### Communication

- [ ] Team notified of launch
- [ ] Support channels ready
- [ ] Social media announcement prepared
- [ ] Email to beta users/waitlist

### Documentation

- [ ] README updated with production info
- [ ] CHANGELOG updated
- [ ] API documentation published
- [ ] Internal wiki updated

---

## Critical Paths to Test

### User Registration Flow

1. User arrives at homepage
2. Clicks "Registrarse"
3. Authenticates with Google
4. Account created successfully
5. Redirected to account page

### Purchase Flow

1. Browse products
2. Click product for details
3. Add to cart
4. View cart
5. Proceed to checkout
6. Enter shipping address
7. Select shipping method
8. Choose payment method
9. Complete payment
10. Order confirmation displayed
11. Confirmation email received

### Store Owner Flow

1. Login as store owner
2. Access dashboard
3. View sales analytics
4. Add new product
5. Edit existing product
6. View orders
7. Update order status

---

## Rollback Plan

### Immediate Actions (if critical issue)

1. Identify the issue
2. Check Vercel logs
3. If deployment issue: Rollback to previous deployment
4. If data issue: Restore database backup
5. Communicate status to users

### Vercel Rollback

1. Go to Vercel Dashboard > Deployments
2. Find last working deployment
3. Click "..." > "Promote to Production"
4. Verify site is working

### Database Rollback

```bash
# Check migration status
pnpm prisma migrate status

# If needed, resolve
pnpm prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Tech Lead | [email/phone] | Technical decisions |
| DevOps | [email/phone] | Infrastructure issues |
| Stripe Support | support@stripe.com | Payment issues |
| Neon Support | support@neon.tech | Database issues |
| Vercel Support | support@vercel.com | Hosting issues |

---

## Success Metrics (First Week)

### Technical

- [ ] 99.9% uptime
- [ ] < 500ms average API response
- [ ] < 1% error rate
- [ ] Zero security incidents

### Business

- [ ] First successful order processed
- [ ] User registrations goal met
- [ ] Payment success rate > 95%
- [ ] Zero payment disputes

---

## Sign-off

### Pre-Launch Approval

- [ ] Technical Review: _________________ Date: _______
- [ ] Security Review: _________________ Date: _______
- [ ] Business Review: _________________ Date: _______

### Launch Approval

- [ ] Go-Live Approved: _________________ Date: _______

---

## Notes

_Add any launch-specific notes or considerations here:_

```
[Launch notes go here]
```
