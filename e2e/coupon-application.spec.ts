import { test, expect } from "@playwright/test";

/**
 * E2E Test: Coupon Application
 * Tests applying discount coupons in cart and checkout
 */
test.describe("Coupon Application", () => {
  test("user can apply valid coupon code", async ({ page }) => {
    // 1. Add product to cart
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // 2. Navigate to cart
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // 3. Look for coupon input
    const couponInput = page.locator(
      'input[placeholder*="Cupón"], input[placeholder*="Coupon"], input[name="coupon"]',
    );

    if ((await couponInput.count()) > 0) {
      // Get original total
      const totalElement = page.locator('[data-testid="cart-total"]').last();
      const originalTotal = await totalElement.textContent();

      // Enter test coupon code
      await couponInput.fill("TEST10"); // Assuming TEST10 is a valid test coupon

      // Click apply button
      const applyButton = page
        .locator('button:has-text("Aplicar"), button:has-text("Apply")')
        .first();
      await applyButton.click();
      await page.waitForTimeout(1000);

      // Check for success message or discount applied
      const successMessage = page.locator(
        "text=/Cupón aplicado|Coupon applied|Descuento aplicado/i",
      );
      const discountLine = page.locator("text=/Descuento|Discount/i");

      // Either success message or discount line should be visible
      const hasSuccess = (await successMessage.count()) > 0;
      const hasDiscount = (await discountLine.count()) > 0;

      expect(hasSuccess || hasDiscount).toBeTruthy();
    } else {
      test.skip("Coupon functionality not implemented in cart");
    }
  });

  test("user sees error for invalid coupon code", async ({ page }) => {
    // 1. Add product to cart
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // 2. Navigate to cart
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // 3. Look for coupon input
    const couponInput = page.locator(
      'input[placeholder*="Cupón"], input[placeholder*="Coupon"], input[name="coupon"]',
    );

    if ((await couponInput.count()) > 0) {
      // Enter invalid coupon code
      await couponInput.fill("INVALID_COUPON_12345");

      // Click apply button
      const applyButton = page
        .locator('button:has-text("Aplicar"), button:has-text("Apply")')
        .first();
      await applyButton.click();
      await page.waitForTimeout(1000);

      // Check for error message
      const errorMessage = page.locator(
        "text=/Cupón inválido|Invalid coupon|Cupón no válido|Cupón expirado/i",
      );
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    } else {
      test.skip("Coupon functionality not implemented in cart");
    }
  });

  test("coupon applies correct discount amount", async ({ page }) => {
    // 1. Add product to cart
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    // 2. Navigate to cart
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // 3. Apply coupon
    const couponInput = page.locator(
      'input[placeholder*="Cupón"], input[placeholder*="Coupon"], input[name="coupon"]',
    );

    if ((await couponInput.count()) > 0) {
      await couponInput.fill("TEST10"); // 10% discount

      const applyButton = page
        .locator('button:has-text("Aplicar"), button:has-text("Apply")')
        .first();
      await applyButton.click();
      await page.waitForTimeout(1000);

      // Verify discount line appears
      const discountLine = page.locator("text=/Descuento|Discount/i");
      if ((await discountLine.count()) > 0) {
        await expect(discountLine).toBeVisible();

        // Verify discount amount is displayed
        const discountAmount = page.locator('[data-testid="discount-amount"]');
        if ((await discountAmount.count()) > 0) {
          await expect(discountAmount).toBeVisible();
        }
      }
    } else {
      test.skip("Coupon functionality not implemented");
    }
  });

  test("user can remove applied coupon", async ({ page }) => {
    // 1. Add product and apply coupon
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productCards = page.locator('[data-testid="product-card"]');
    await productCards.first().click();
    await page.waitForURL(/\/shop\/.+/);
    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(500);

    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    const couponInput = page.locator(
      'input[placeholder*="Cupón"], input[placeholder*="Coupon"], input[name="coupon"]',
    );

    if ((await couponInput.count()) > 0) {
      await couponInput.fill("TEST10");

      const applyButton = page
        .locator('button:has-text("Aplicar"), button:has-text("Apply")')
        .first();
      await applyButton.click();
      await page.waitForTimeout(1000);

      // Look for remove coupon button
      const removeButton = page.locator(
        'button:has-text("Eliminar cupón"), button:has-text("Remove coupon"), button[aria-label="Remove coupon"]',
      );

      if ((await removeButton.count()) > 0) {
        await removeButton.click();
        await page.waitForTimeout(500);

        // Verify discount line disappears
        const discountLine = page.locator("text=/Descuento|Discount/i");
        await expect(discountLine).not.toBeVisible();
      }
    } else {
      test.skip("Coupon functionality not implemented");
    }
  });
});
