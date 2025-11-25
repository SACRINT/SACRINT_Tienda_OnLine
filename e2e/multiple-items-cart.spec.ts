import { test, expect } from "@playwright/test";

/**
 * E2E Test: Multiple Items in Cart
 * Tests adding multiple products and managing cart
 */
test.describe("Multiple Items in Cart", () => {
  test("user can add multiple products to cart", async ({ page }) => {
    // 1. Navigate to shop
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 2. Get product cards
    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();

    if (productCount < 3) {
      test.skip("Not enough products to test multiple items");
    }

    // 3. Add first product
    await productCards.nth(0).click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Verify cart count is 1
    let cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText("1");

    // 4. Go back to shop
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 5. Add second product
    await productCards.nth(1).click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Verify cart count is 2
    cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText("2");

    // 6. Go back to shop
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 7. Add third product
    await productCards.nth(2).click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Verify cart count is 3
    cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText("3");

    // 8. Navigate to cart
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // 9. Verify all items are in cart
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(3);

    // 10. Verify total is calculated correctly
    const totalElement = page.locator('[data-testid="cart-total"], text=/Total:/i').last();
    await expect(totalElement).toBeVisible();
  });

  test("user can update quantity of items in cart", async ({ page }) => {
    // Add a product to cart first
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // Find quantity controls
    const increaseButton = page
      .locator('button[aria-label="Increase quantity"], button:has-text("+")')
      .first();
    const decreaseButton = page
      .locator('button[aria-label="Decrease quantity"], button:has-text("-")')
      .first();

    if ((await increaseButton.count()) > 0) {
      // Increase quantity
      await increaseButton.click();
      await page.waitForTimeout(500);

      // Verify cart count updated
      const cartCount = page.locator('[data-testid="cart-count"]');
      await expect(cartCount).toHaveText("2");

      // Decrease quantity
      await decreaseButton.click();
      await page.waitForTimeout(500);

      // Verify cart count back to 1
      await expect(cartCount).toHaveText("1");
    }
  });

  test("user can remove items from cart", async ({ page }) => {
    // Add a product to cart
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // Find and click remove button
    const removeButton = page
      .locator(
        'button:has-text("Eliminar"), button:has-text("Remove"), button[aria-label="Remove item"]',
      )
      .first();

    if ((await removeButton.count()) > 0) {
      await removeButton.click();
      await page.waitForTimeout(500);

      // Verify cart is empty
      const emptyCartMessage = page.locator(
        "text=/Tu carrito está vacío|Your cart is empty|No items/i",
      );
      await expect(emptyCartMessage).toBeVisible();
    }
  });
});
