# QA Test Plan - MVP Semana 8

## Overview

Comprehensive testing checklist for the e-commerce platform MVP before production deployment.

**Testing Date**: November 25, 2025  
**Version**: 1.0.0  
**Status**: In Progress

---

## 1. Smoke Tests (Critical)

These tests must pass for deployment to proceed.

### Core Functionality

- [ ] Home page loads without errors
- [ ] Signup creates new user account
- [ ] Login authenticates existing users
- [ ] Shop page displays product catalog
- [ ] Product detail page shows complete information
- [ ] Cart adds/removes items correctly
- [ ] Checkout wizard completes all steps
- [ ] Order is created successfully
- [ ] Confirmation email is sent

### Database Connectivity

- [ ] Application connects to database
- [ ] Queries execute without errors
- [ ] Transactions complete successfully
- [ ] Foreign key constraints work correctly

### External Services

- [ ] Stripe payment intent creates successfully
- [ ] Email service (Resend) sends emails
- [ ] Image uploads work (if implemented)
- [ ] Analytics tracking fires

**Pass Criteria**: 100% of smoke tests must pass

---

## 2. Functionality Tests

### Authentication & Authorization

#### Sign Up

- [ ] Email validation works (invalid email rejected)
- [ ] Password requirements enforced (min length, complexity)
- [ ] Duplicate email rejected
- [ ] Welcome email sent
- [ ] User redirected to dashboard after signup
- [ ] User session created correctly

#### Login

- [ ] Valid credentials authenticate successfully
- [ ] Invalid credentials show error
- [ ] "Remember me" persists session
- [ ] Password reset link sent via email
- [ ] Logout clears session

#### Google OAuth

- [ ] OAuth flow completes successfully
- [ ] User profile populated from Google
- [ ] Existing users linked correctly
- [ ] New users created automatically

#### Role-Based Access Control (RBAC)

- [ ] CUSTOMER can access /account
- [ ] CUSTOMER cannot access /dashboard
- [ ] STORE_OWNER can access /dashboard
- [ ] STORE_OWNER can manage products
- [ ] SUPER_ADMIN can access all areas

### Product Catalog

#### Product Listing

- [ ] Products display with images
- [ ] Prices shown correctly
- [ ] Out of stock items marked appropriately
- [ ] Pagination works (if >20 products)
- [ ] Load more/infinite scroll functions
- [ ] Grid/list view toggles correctly

#### Filters

- [ ] Category filter shows correct products
- [ ] Price range filter works
- [ ] Color/size filters apply correctly
- [ ] Multiple filters combine (AND logic)
- [ ] Clear filters resets to all products
- [ ] Filter count updates dynamically

#### Search

- [ ] Search by product name returns results
- [ ] Search by partial name works
- [ ] Search by SKU returns exact match
- [ ] No results message displays appropriately
- [ ] Search suggestions appear (if implemented)
- [ ] Recent searches saved (if implemented)

#### Sorting

- [ ] Sort by price (low to high)
- [ ] Sort by price (high to low)
- [ ] Sort by newest first
- [ ] Sort by best sellers (if implemented)
- [ ] Sort by highest rated (if implemented)

#### Product Detail

- [ ] All product information displayed
- [ ] Image gallery navigates correctly
- [ ] Variant selection updates price
- [ ] Add to cart button functional
- [ ] Quantity selector works
- [ ] Reviews displayed (if implemented)
- [ ] Related products shown

### Shopping Cart

#### Add to Cart

- [ ] Product added to cart
- [ ] Quantity increments correctly
- [ ] Cart badge updates
- [ ] Success message/toast shown
- [ ] Duplicate items increment quantity

#### Cart Page

- [ ] All items displayed correctly
- [ ] Images and details shown
- [ ] Quantity can be updated
- [ ] Remove item works
- [ ] Subtotal calculates correctly
- [ ] Tax calculated accurately
- [ ] Shipping cost added
- [ ] Total is correct

#### Cart Persistence

- [ ] Cart persists after page reload
- [ ] Cart syncs across tabs
- [ ] Cart saved in localStorage
- [ ] Cart restored on login (if implemented)

### Checkout

#### Wizard Steps

- [ ] Step 1: Shipping address form validates
- [ ] Step 2: Shipping method selectable
- [ ] Step 3: Payment method (Stripe) loads
- [ ] Step 4: Review shows all details
- [ ] Navigation between steps works
- [ ] Cannot skip required steps

#### Shipping Address

- [ ] Form validation works
- [ ] Saved addresses selectable (if logged in)
- [ ] New address saved
- [ ] "Use as billing" checkbox works
- [ ] Required fields enforced

#### Payment Processing

- [ ] Stripe Elements loads correctly
- [ ] Test card (4242...) accepts payment
- [ ] Invalid card shows error
- [ ] Declined card handled gracefully
- [ ] Payment confirmation received
- [ ] Order status updated to PAID

#### Guest Checkout

- [ ] Guest can checkout without account
- [ ] Email required for guest
- [ ] Order confirmation sent to email
- [ ] Order tracking link works

### Coupons & Discounts

#### Coupon Application

- [ ] Valid coupon applies discount
- [ ] Invalid coupon shows error
- [ ] Expired coupon rejected
- [ ] Minimum purchase enforced
- [ ] Discount calculates correctly
- [ ] Coupon can be removed
- [ ] One coupon per order enforced

### Orders

#### Order Creation

- [ ] Order number generated
- [ ] Order appears in account/orders
- [ ] Order details complete
- [ ] Stock reduced correctly
- [ ] Payment recorded
- [ ] Timestamps accurate

#### Order Status Page

- [ ] Order details displayed
- [ ] Timeline shows progress
- [ ] Tracking number shown (if shipped)
- [ ] Invoice downloadable (if implemented)
- [ ] Contact support link works

#### Order History

- [ ] All orders listed
- [ ] Sorted by date (newest first)
- [ ] Filter by status works
- [ ] Search by order number works
- [ ] Pagination functions

---

## 3. Security Tests

### Authentication

- [ ] Cannot access /dashboard without login
- [ ] Cannot access other user's data
- [ ] Session expires after timeout
- [ ] Password hashed in database
- [ ] SQL injection prevented (test with: `' OR 1=1--`)

### CSRF Protection

- [ ] Forms include CSRF token
- [ ] Requests without token rejected
- [ ] Token validated on submission

### XSS Prevention

- [ ] User input sanitized
- [ ] Script tags in product name don't execute
- [ ] HTML entities encoded in output

### Multi-Tenant Isolation

- [ ] Tenant A cannot see tenant B's products
- [ ] Tenant A cannot access tenant B's orders
- [ ] Queries filtered by tenantId
- [ ] No data leakage between tenants

### Rate Limiting

- [ ] Excessive requests (>100/min) rate limited
- [ ] Login attempts limited (5 per 15 min)
- [ ] API endpoints throttled
- [ ] 429 status returned when limited

### Payment Security

- [ ] No card numbers stored in database
- [ ] Stripe handles all payment data
- [ ] HTTPS enforced on all pages
- [ ] PCI compliance maintained

---

## 4. Compatibility Tests

### Browsers

#### Desktop

- [ ] Chrome latest version
- [ ] Firefox latest version
- [ ] Safari latest version
- [ ] Edge latest version
- [ ] Opera latest version (optional)

#### Mobile

- [ ] Chrome on Android
- [ ] Safari on iOS
- [ ] Samsung Internet (optional)

### Devices

#### Mobile Phones

- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13 (390px width)
- [ ] Pixel 4/5 (412px width)
- [ ] Galaxy S21 (360px width)

#### Tablets

- [ ] iPad (768px width)
- [ ] iPad Pro (1024px width)
- [ ] Android Tablet (800px width)

#### Desktop

- [ ] 1920x1080 (Full HD)
- [ ] 1366x768 (Laptop)
- [ ] 2560x1440 (QHD)
- [ ] 3840x2160 (4K)

---

## 5. Performance Tests

### Page Load Times

- [ ] Home page FCP < 1.5s
- [ ] Shop page LCP < 2.5s
- [ ] Product detail LCP < 2.5s
- [ ] Cart page interactive < 1s
- [ ] Checkout responsive < 2s

### Core Web Vitals

- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

### API Response Times

- [ ] GET /api/products < 500ms
- [ ] GET /api/products/[id] < 300ms
- [ ] POST /api/orders < 1s
- [ ] GET /api/orders/[id] < 400ms

### Search Performance

- [ ] Autocomplete responds < 200ms
- [ ] Search results load < 500ms
- [ ] Filters apply < 300ms

### Lighthouse Scores

- [ ] Performance > 90
- [ ] Accessibility > 95
- [ ] Best Practices > 90
- [ ] SEO > 90

---

## 6. Accessibility Tests (WCAG 2.1 AA)

### Keyboard Navigation

- [ ] All interactive elements reachable by Tab
- [ ] Focus visible on all elements
- [ ] Dropdown menus keyboard accessible
- [ ] Modal dialogs trap focus
- [ ] Escape key closes modals

### Screen Reader

- [ ] Page structure announced correctly
- [ ] Images have alt text
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Dynamic content changes announced

### Color Contrast

- [ ] Text contrast ratio ≥ 4.5:1
- [ ] Large text contrast ratio ≥ 3:1
- [ ] Buttons/icons have sufficient contrast
- [ ] Links distinguishable from text

### Semantic HTML

- [ ] Proper heading hierarchy (h1 > h2 > h3)
- [ ] Landmarks used (header, nav, main, footer)
- [ ] Lists use <ul>/<ol> elements
- [ ] Tables have <th> headers

### ARIA Attributes

- [ ] Buttons have aria-label if no text
- [ ] Icons have aria-hidden or label
- [ ] Live regions for dynamic updates
- [ ] Form errors use aria-describedby

---

## 7. Mobile Responsiveness

### Layout

- [ ] Text readable without zooming
- [ ] No horizontal scrolling
- [ ] Images scale appropriately
- [ ] Touch targets ≥ 44x44px
- [ ] Adequate spacing between elements

### Navigation

- [ ] Hamburger menu functional
- [ ] Drawer/sidebar opens smoothly
- [ ] Bottom navigation works (if implemented)
- [ ] Sticky header remains accessible

### Forms

- [ ] Input fields large enough to type
- [ ] Keyboard opens correctly
- [ ] Select dropdowns usable
- [ ] Date pickers mobile-friendly
- [ ] Form submission works

### Gestures

- [ ] Swipe to navigate (if implemented)
- [ ] Pinch to zoom images
- [ ] Pull to refresh (if implemented)
- [ ] Long press actions (if implemented)

---

## 8. Error Handling

### Network Errors

- [ ] Offline mode message shown
- [ ] Retry mechanism available
- [ ] Graceful degradation
- [ ] Error logged to console

### API Errors

- [ ] 400 errors show user-friendly message
- [ ] 404 shows "Not Found" page
- [ ] 500 errors show "Something went wrong"
- [ ] Timeout errors handled

### Validation Errors

- [ ] Required fields highlighted
- [ ] Specific error messages shown
- [ ] Errors cleared when fixed
- [ ] Form remains populated on error

### Payment Errors

- [ ] Card declined message clear
- [ ] Insufficient funds explained
- [ ] Expired card prompted
- [ ] CVC error specific

---

## 9. Edge Cases

### Empty States

- [ ] Empty cart shows message
- [ ] No search results displays properly
- [ ] No orders shows placeholder
- [ ] Empty wishlist handled

### Large Data

- [ ] 1000+ products paginate correctly
- [ ] Long product names truncate
- [ ] Large images optimized
- [ ] Many cart items (50+) display

### Special Characters

- [ ] Product names with quotes
- [ ] Addresses with special chars
- [ ] Email with + or . work
- [ ] URLs with spaces handled

### Concurrent Users

- [ ] Multiple users checkout simultaneously
- [ ] Stock doesn't oversell
- [ ] Race conditions prevented
- [ ] Database locks work

---

## 10. Data Integrity

### Database

- [ ] Foreign keys enforce relationships
- [ ] Cascading deletes work correctly
- [ ] Unique constraints enforced
- [ ] Timestamps auto-update

### Order Data

- [ ] Prices match at order creation
- [ ] Tax calculated consistently
- [ ] Discounts applied correctly
- [ ] Total equals sum of parts

### Inventory

- [ ] Stock decrements on order
- [ ] Stock restores on cancellation
- [ ] Negative stock prevented
- [ ] Overselling prevented

---

## Bug Severity Levels

### Critical (P0)

- Application completely broken
- Data loss or corruption
- Security vulnerability
- Payment processing failure

**Action**: Fix immediately, block deployment

### High (P1)

- Major feature not working
- Significant user impact
- Workaround available

**Action**: Fix within 24 hours

### Medium (P2)

- Feature partially working
- Moderate user impact
- Easy workaround exists

**Action**: Fix within 1 week

### Low (P3)

- Minor cosmetic issues
- Minimal user impact
- Nice to have fixes

**Action**: Fix in next sprint

---

## Testing Tools

### Manual Testing

- Browser DevTools (Console, Network, Performance)
- Responsive Design Mode
- Lighthouse (Chrome DevTools)
- WAVE Accessibility Tool

### Automated Testing

- Playwright E2E tests
- Jest unit tests
- Lighthouse CI
- axe DevTools

### External Tools

- Google Search Console
- Stripe Test Mode
- Postman (API testing)
- BrowserStack (cross-browser)

---

## Test Report Template

```markdown
## Test Execution Report

**Date**: [Date]
**Tester**: [Name]
**Version**: [Version]
**Environment**: [Production/Staging/Local]

### Summary

- Total Tests: X
- Passed: Y
- Failed: Z
- Blocked: W
- Pass Rate: Y/X %

### Critical Bugs Found

1. [Bug title] - [Severity] - [Status]
2. [Bug title] - [Severity] - [Status]

### High Priority Bugs

1. [Bug title] - [Severity] - [Status]

### Recommendations

- [Recommendation 1]
- [Recommendation 2]

### Sign-off

- [ ] Approved for deployment
- [ ] Requires fixes before deployment
```

---

## Deployment Readiness Checklist

- [ ] All smoke tests passing
- [ ] Zero critical (P0) bugs
- [ ] High (P1) bugs < 3
- [ ] Lighthouse scores > 90
- [ ] E2E tests passing
- [ ] Security audit complete
- [ ] Performance benchmarks met
- [ ] Accessibility WCAG AA compliant
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility confirmed

**Status**: ✅ Ready / ⚠️ Needs Work / ❌ Not Ready

---

## Notes

- Tests should be run on staging environment that mirrors production
- Automated tests should run on every deployment
- Manual testing required for visual/UX verification
- Document all bugs in GitHub Issues with appropriate labels
- Retest all fixed bugs before marking as resolved

---

**Last Updated**: November 25, 2025  
**Next Review**: After each major feature addition
