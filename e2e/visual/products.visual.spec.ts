// Products Visual Regression Tests
import { test, expect } from "@playwright/test";

test.describe("Products Page Visual Regression", () => {
  test("products grid", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const grid = page.locator('[data-testid="products-grid"]');
    if (await grid.isVisible()) {
      await expect(grid).toHaveScreenshot("products-grid.png", {
        threshold: 0.2,
      });
    }
  });

  test("product filters", async ({ page }) => {
    await page.goto("/shop");

    const filters = page.locator('[data-testid="product-filters"]');
    if (await filters.isVisible()) {
      await expect(filters).toHaveScreenshot("product-filters.png", {
        threshold: 0.1,
      });
    }
  });

  test("product card", async ({ page }) => {
    await page.goto("/shop");

    const card = page.locator('[data-testid="product-card"]').first();
    if (await card.isVisible()) {
      await expect(card).toHaveScreenshot("product-card.png", {
        threshold: 0.1,
      });
    }
  });

  test("product card hover state", async ({ page }) => {
    await page.goto("/shop");

    const card = page.locator('[data-testid="product-card"]').first();
    if (await card.isVisible()) {
      await card.hover();
      await expect(card).toHaveScreenshot("product-card-hover.png", {
        threshold: 0.1,
      });
    }
  });

  test("pagination", async ({ page }) => {
    await page.goto("/shop");

    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      await expect(pagination).toHaveScreenshot("pagination.png", {
        threshold: 0.1,
      });
    }
  });
});

test.describe("Product Detail Visual Regression", () => {
  test("product detail page", async ({ page }) => {
    await page.goto("/shop");

    const card = page.locator('[data-testid="product-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("product-detail.png", {
        fullPage: true,
        threshold: 0.2,
      });
    }
  });

  test("product images gallery", async ({ page }) => {
    await page.goto("/shop");

    const card = page.locator('[data-testid="product-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForLoadState("networkidle");

      const gallery = page.locator('[data-testid="product-gallery"]');
      if (await gallery.isVisible()) {
        await expect(gallery).toHaveScreenshot("product-gallery.png", {
          threshold: 0.2,
        });
      }
    }
  });

  test("add to cart button", async ({ page }) => {
    await page.goto("/shop");

    const card = page.locator('[data-testid="product-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForLoadState("networkidle");

      const addToCart = page.getByRole("button", { name: /agregar|add/i });
      if (await addToCart.isVisible()) {
        await expect(addToCart).toHaveScreenshot("add-to-cart-button.png", {
          threshold: 0.1,
        });
      }
    }
  });
});
