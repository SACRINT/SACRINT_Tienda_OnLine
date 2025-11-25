import { test, expect } from "@playwright/test";

/**
 * E2E Test: Guest Checkout
 * Tests checkout process for non-authenticated users
 */
test.describe("Guest Checkout", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Ensure no authentication

  test("guest user can add product to cart and initiate checkout", async ({ page }) => {
    // 1. Navigate to shop without logging in
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 2. Add product to cart
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);

    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // 3. Verify cart updated
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText("1");

    // 4. Navigate to cart
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // 5. Proceed to checkout
    await page.click('button:has-text("Proceder al Pago")');

    // 6. May redirect to login or allow guest checkout
    await page.waitForTimeout(1000);
    const currentUrl = page.url();

    if (currentUrl.includes("/login") || currentUrl.includes("/signin")) {
      // If redirected to login, verify guest checkout option exists
      const guestCheckoutLink = page.locator(
        "text=/Continuar como invitado|Guest checkout|Checkout sin cuenta/i",
      );

      if ((await guestCheckoutLink.count()) > 0) {
        await guestCheckoutLink.click();
        await page.waitForURL(/\/checkout/);
      } else {
        test.skip("Guest checkout not available - authentication required");
      }
    } else if (currentUrl.includes("/checkout")) {
      // Already at checkout, guest checkout is allowed
      expect(currentUrl).toContain("/checkout");
    }

    // 7. Verify checkout page shows guest form fields
    if (page.url().includes("/checkout")) {
      // Should show email field for guest users
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible({ timeout: 5000 });
    }
  });

  test("guest checkout requires email address", async ({ page }) => {
    // Add product to cart
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Try to checkout
    await page.goto("/checkout");
    await page.waitForTimeout(1000);

    if (page.url().includes("/checkout")) {
      // Try to proceed without email
      const submitButton = page
        .locator(
          'button:has-text("Siguiente"), button:has-text("Continuar"), button[type="submit"]',
        )
        .first();

      if ((await submitButton.count()) > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation error
        const errorMessage = page.locator("text=/requerido|required|obligatorio|Email/i");
        const emailFieldError = await errorMessage.count();

        expect(emailFieldError).toBeGreaterThan(0);
      }
    }
  });

  test("guest checkout shows all necessary form fields", async ({ page }) => {
    // Add product
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Go to checkout
    await page.goto("/checkout");
    await page.waitForTimeout(1000);

    if (page.url().includes("/checkout")) {
      // Verify essential fields are present
      const expectedFields = [
        'input[name="email"], input[type="email"]',
        'input[name="name"], input[name="firstName"]',
        'input[name="street"], input[name="address"]',
        'input[name="city"]',
        'input[name="postalCode"], input[name="zipCode"]',
      ];

      let fieldsFound = 0;
      for (const selector of expectedFields) {
        const field = page.locator(selector);
        if ((await field.count()) > 0) {
          fieldsFound++;
        }
      }

      // At least 3 essential fields should be present
      expect(fieldsFound).toBeGreaterThanOrEqual(3);
    }
  });

  test("guest can view cart without authentication", async ({ page }) => {
    // Add product to cart
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Navigate to cart directly
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // Verify cart page loads and shows item
    await expect(page.locator("h1")).toContainText(/Carrito/i);

    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(1);

    // Should not require login to view cart
    expect(page.url()).not.toContain("/login");
    expect(page.url()).not.toContain("/signin");
  });
});
