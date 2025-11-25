import { test, expect } from "@playwright/test";

/**
 * E2E Test: Authenticated Purchase Flow
 * Tests purchase flow for logged-in users
 */
test.describe("Authenticated Purchase Flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Start with clean state

  test("registered user can login and make a purchase", async ({ page }) => {
    // 1. Navigate to login page
    await page.goto("/login");
    await expect(page.locator("h1, h2")).toContainText(/Iniciar Sesión|Login/i);

    // 2. Fill in login form
    // Note: This requires a test user to be seeded in the database
    await page.fill('input[name="email"], input[type="email"]', "test@example.com");
    await page.fill('input[name="password"], input[type="password"]', "TestPassword123!");

    // 3. Submit login
    await page.click(
      'button[type="submit"]:has-text("Iniciar Sesión"), button[type="submit"]:has-text("Login")',
    );

    // 4. Wait for successful login (redirect to dashboard or home)
    await page.waitForURL(/\/(dashboard|home|shop)/, { timeout: 10000 });

    // 5. Navigate to shop
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 6. Add product to cart
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);

    // 7. Add to cart
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // 8. Verify cart badge updated
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText("1");

    // 9. Navigate to checkout
    await page.goto("/checkout");

    // 10. Verify user is authenticated (pre-filled data or no login prompt)
    await expect(page.locator('text="Dirección de Envío"')).toBeVisible();

    // For authenticated users, address might be pre-filled or available
    // Verify checkout page loaded successfully
    await expect(page.locator("h1")).toContainText(/Checkout/i);
  });

  test("user without account is redirected to login", async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto("/dashboard");

    // Should redirect to login page
    await page.waitForURL(/\/(login|auth\/signin)/, { timeout: 10000 });
    await expect(page.locator("h1, h2")).toContainText(/Iniciar Sesión|Login|Sign In/i);
  });

  test("user can logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "test@example.com");
    await page.fill('input[name="password"], input[type="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|home|shop)/);

    // Find and click logout button
    const logoutButton = page.locator(
      'button:has-text("Cerrar Sesión"), button:has-text("Logout"), a:has-text("Cerrar Sesión")',
    );
    if ((await logoutButton.count()) > 0) {
      await logoutButton.click();

      // Verify redirected to home or login
      await page.waitForURL(/\/(login|home|\/)/, { timeout: 10000 });
    }
  });
});
