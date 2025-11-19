// Cart Visual Regression Tests
import { test, expect } from "@playwright/test";

test.describe("Cart Visual Regression", () => {
  test("cart page full", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("cart-page.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test("empty cart state", async ({ page }) => {
    // Clear any existing cart data
    await page.goto("/cart");

    const emptyState = page.locator('[data-testid="empty-cart"]');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveScreenshot("cart-empty.png", {
        threshold: 0.1,
      });
    }
  });

  test("cart item", async ({ page }) => {
    await page.goto("/cart");

    const cartItem = page.locator('[data-testid="cart-item"]').first();
    if (await cartItem.isVisible()) {
      await expect(cartItem).toHaveScreenshot("cart-item.png", {
        threshold: 0.1,
      });
    }
  });

  test("cart summary", async ({ page }) => {
    await page.goto("/cart");

    const summary = page.locator('[data-testid="cart-summary"]');
    if (await summary.isVisible()) {
      await expect(summary).toHaveScreenshot("cart-summary.png", {
        threshold: 0.1,
      });
    }
  });

  test("quantity controls", async ({ page }) => {
    await page.goto("/cart");

    const controls = page.locator('[data-testid="quantity-controls"]').first();
    if (await controls.isVisible()) {
      await expect(controls).toHaveScreenshot("quantity-controls.png", {
        threshold: 0.1,
      });
    }
  });
});

test.describe("Cart Mobile Visual", () => {
  test("cart mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("cart-mobile.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
