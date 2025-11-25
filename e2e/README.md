# End-to-End Tests

This directory contains Playwright E2E tests for the Tienda Online application.

## Test Files

1. **complete-purchase-flow.spec.ts** - Tests the complete user journey from browsing to checkout
2. **authenticated-purchase.spec.ts** - Tests purchase flow for logged-in users
3. **multiple-items-cart.spec.ts** - Tests adding and managing multiple items in cart
4. **coupon-application.spec.ts** - Tests applying discount coupons
5. **guest-checkout.spec.ts** - Tests checkout process for non-authenticated users

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/complete-purchase-flow.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Prerequisites

1. **Test Database**: Ensure you have a test database configured
2. **Test Data**: Seed the database with test products and users
3. **Environment Variables**: Set `PLAYWRIGHT_TEST_BASE_URL` if testing against deployed version

## Test Data Requirements

### Products

- At least 3 products in the shop for multi-item cart tests
- Some products should be marked as "out of stock"

### Users

- Test user: `test@example.com` with password `TestPassword123!`

### Coupons

- Test coupon code: `TEST10` (10% discount)

## CI/CD Integration

Tests are configured to run in CI with:

- 2 retries on failure
- Single worker (sequential execution)
- HTML reporter for results

## Viewing Test Results

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Troubleshooting

### Tests Failing Due to Timeouts

- Increase timeout in test configuration
- Check if dev server is running properly
- Verify network connectivity

### Elements Not Found

- Check if selectors match actual DOM structure
- Use Playwright Inspector: `npm run test:e2e:debug`
- Verify test data is properly seeded

### Authentication Issues

- Ensure test user exists in database
- Check NextAuth configuration
- Verify session handling

## Best Practices

1. **Test Independence**: Each test should be able to run independently
2. **Cleanup**: Clear cart/session state between tests
3. **Selectors**: Use data-testid attributes for stable selectors
4. **Waits**: Use `waitForLoadState` instead of arbitrary timeouts
5. **Assertions**: Always include meaningful expect statements

## Coverage

These E2E tests cover:

- ✅ Product browsing and search
- ✅ Add to cart functionality
- ✅ Cart management (add, remove, update quantity)
- ✅ Checkout process
- ✅ Authentication flows
- ✅ Guest checkout
- ✅ Coupon application
- ✅ Multi-item purchases
- ✅ Out of stock handling

## Future Tests

Consider adding tests for:

- Payment processing (with Stripe test mode)
- Order confirmation emails
- Admin dashboard functionality
- Mobile responsiveness
- Accessibility (using axe-playwright)
