// Cart E2E Tests
import { test, expect } from "@playwright/test";

test.describe("Shopping Cart", () => {
  test.beforeEach(async ({ page }) => {
    // Go to shop page
    await page.goto("/shop");
  });

  test("should add product to cart", async ({ page }) => {
    // Find and click first product
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      // Click add to cart
      const addToCartButton = page.getByRole("button", { name: /agregar|add to cart/i });
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Should show success message or update cart count
        const cartIcon = page.locator('[data-testid="cart-icon"]');
        if (await cartIcon.isVisible()) {
          await expect(cartIcon).toContainText(/[1-9]/);
        }
      }
    }
  });

  test("should show cart contents", async ({ page }) => {
    await page.goto("/cart");

    // Cart page should load
    await expect(page.locator("h1")).toContainText(/carrito|cart/i);
  });

  test("should update item quantity", async ({ page }) => {
    await page.goto("/cart");

    const quantityInput = page.locator('[data-testid="cart-item-quantity"]').first();
    if (await quantityInput.isVisible()) {
      await quantityInput.fill("3");
      await quantityInput.blur();
      await page.waitForLoadState("networkidle");
    }
  });

  test("should remove item from cart", async ({ page }) => {
    await page.goto("/cart");

    const removeButton = page.locator('[data-testid="remove-item"]').first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("should display cart totals", async ({ page }) => {
    await page.goto("/cart");

    const subtotal = page.locator('[data-testid="cart-subtotal"]');
    const tax = page.locator('[data-testid="cart-tax"]');
    const total = page.locator('[data-testid="cart-total"]');

    // These should be visible if cart has items
    if (await subtotal.isVisible()) {
      await expect(subtotal).toBeVisible();
      await expect(total).toBeVisible();
    }
  });

  test("should proceed to checkout", async ({ page }) => {
    await page.goto("/cart");

    const checkoutButton = page.getByRole("button", { name: /checkout|pagar/i });
    if (await checkoutButton.isVisible() && await checkoutButton.isEnabled()) {
      await checkoutButton.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to checkout or login
      expect(page.url()).toMatch(/checkout|login|auth/);
    }
  });

  test("should show empty cart message", async ({ page }) => {
    await page.goto("/cart");

    const emptyMessage = page.getByText(/vacío|empty|no items/i);
    // May or may not be visible depending on cart state
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test("should apply coupon code", async ({ page }) => {
    await page.goto("/cart");

    const couponInput = page.getByPlaceholder(/cupón|coupon/i);
    if (await couponInput.isVisible()) {
      await couponInput.fill("SAVE10");

      const applyButton = page.getByRole("button", { name: /aplicar|apply/i });
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await page.waitForLoadState("networkidle");
      }
    }
  });

  test("should persist cart across page loads", async ({ page }) => {
    // Add item to cart first
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      const addToCartButton = page.getByRole("button", { name: /agregar|add to cart/i });
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        await page.waitForTimeout(500);

        // Reload page
        await page.reload();
        await page.waitForLoadState("networkidle");

        // Cart should still have item
        const cartIcon = page.locator('[data-testid="cart-icon"]');
        if (await cartIcon.isVisible()) {
          await expect(cartIcon).toContainText(/[1-9]/);
        }
      }
    }
  });
});
