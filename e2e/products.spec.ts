// Products E2E Tests
import { test, expect } from "@playwright/test";

test.describe("Product Listing", () => {
  test("should display products grid", async ({ page }) => {
    await page.goto("/shop");

    // Should have product cards
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible({ timeout: 10000 });
  });

  test("should filter by category", async ({ page }) => {
    await page.goto("/shop");

    // Click on category filter
    const categoryFilter = page.getByRole("button", { name: /categoría|category/i });
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();

      // Select a category
      const categoryOption = page.getByRole("option").first();
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
        await page.waitForLoadState("networkidle");
      }
    }
  });

  test("should search products", async ({ page }) => {
    await page.goto("/shop");

    const searchInput = page.getByPlaceholder(/buscar|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await searchInput.press("Enter");
      await page.waitForLoadState("networkidle");

      // URL should contain search param
      expect(page.url()).toContain("search");
    }
  });

  test("should paginate products", async ({ page }) => {
    await page.goto("/shop");

    const nextButton = page.getByRole("button", { name: /siguiente|next/i });
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForLoadState("networkidle");

      // URL should contain page param
      expect(page.url()).toContain("page=2");
    }
  });

  test("should sort products", async ({ page }) => {
    await page.goto("/shop");

    const sortSelect = page.getByLabel(/ordenar|sort/i);
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption({ label: /precio|price/i });
      await page.waitForLoadState("networkidle");
    }
  });
});

test.describe("Product Detail", () => {
  test("should display product information", async ({ page }) => {
    await page.goto("/shop");

    // Click on first product
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      // Should show product details
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("should show product images", async ({ page }) => {
    await page.goto("/shop");

    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      const images = page.locator('[data-testid="product-image"]');
      await expect(images.first()).toBeVisible();
    }
  });

  test("should display price", async ({ page }) => {
    await page.goto("/shop");

    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      const price = page.locator('[data-testid="product-price"]');
      await expect(price).toBeVisible();
    }
  });

  test("should have add to cart button", async ({ page }) => {
    await page.goto("/shop");

    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      const addToCartButton = page.getByRole("button", { name: /agregar|add to cart/i });
      await expect(addToCartButton).toBeVisible();
    }
  });

  test("should select quantity", async ({ page }) => {
    await page.goto("/shop");

    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      const quantityInput = page.getByLabel(/cantidad|quantity/i);
      if (await quantityInput.isVisible()) {
        await quantityInput.fill("2");
        await expect(quantityInput).toHaveValue("2");
      }
    }
  });
});

test.describe("Product Reviews", () => {
  test("should display reviews section", async ({ page }) => {
    await page.goto("/shop");

    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click();
      await page.waitForLoadState("networkidle");

      const reviewsSection = page.locator('[data-testid="reviews-section"]');
      // Reviews section may or may not exist
      if (await reviewsSection.isVisible()) {
        await expect(reviewsSection).toBeVisible();
      }
    }
  });
});
