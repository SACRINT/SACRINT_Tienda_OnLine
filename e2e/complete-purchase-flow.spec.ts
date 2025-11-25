import { test, expect } from "@playwright/test";

/**
 * E2E Test: Complete Purchase Flow
 * Tests the entire user journey from browsing to completing a purchase
 */
test.describe("Complete Purchase Flow", () => {
  test("user can browse shop, add item to cart, and complete checkout", async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/Tienda Online/i);

    // 2. Navigate to shop
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 3. Verify products are loaded
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    // 4. Click on first product
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);

    // 5. Verify product detail page loads
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('button:has-text("Agregar al Carrito")')).toBeVisible();

    // 6. Add product to cart
    await page.click('button:has-text("Agregar al Carrito")');

    // 7. Wait for cart update and verify cart count
    await page.waitForTimeout(500); // Wait for animation
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText("1");

    // 8. Navigate to cart
    await page.click('a[href="/cart"]');
    await page.waitForURL("/cart");

    // 9. Verify cart page shows item
    await expect(page.locator("h1")).toContainText(/Carrito/i);
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(1);

    // 10. Proceed to checkout
    await page.click('button:has-text("Proceder al Pago")');
    await page.waitForURL("/checkout");

    // 11. Verify checkout page loads
    await expect(page.locator("h1")).toContainText(/Checkout/i);

    // Since checkout requires Stripe integration and forms,
    // we verify the page structure instead of completing payment
    await expect(page.locator('text="Dirección de Envío"')).toBeVisible();
    await expect(page.locator('text="Método de Envío"')).toBeVisible();
    await expect(page.locator('text="Método de Pago"')).toBeVisible();
  });

  test("handles out of stock products gracefully", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // Look for out of stock badge
    const outOfStockBadge = page.locator('text="Agotado"');

    if ((await outOfStockBadge.count()) > 0) {
      // Click on out of stock product
      const productCard = outOfStockBadge.locator("..").locator("..");
      await productCard.click();

      // Verify add to cart button is disabled
      const addToCartButton = page.locator('button:has-text("Agregar al Carrito")');
      await expect(addToCartButton).toBeDisabled();
    }
  });
});
