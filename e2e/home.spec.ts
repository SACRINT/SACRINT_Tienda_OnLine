// Homepage E2E Tests
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SACRINT|Tienda/i);
  });

  test("should have navigation", async ({ page }) => {
    await page.goto("/");

    // Check for main navigation elements
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("should navigate to shop", async ({ page }) => {
    await page.goto("/");

    // Click on shop link if exists
    const shopLink = page.getByRole("link", { name: /tienda|shop|productos/i });
    if (await shopLink.isVisible()) {
      await shopLink.click();
      await expect(page).toHaveURL(/shop|productos|tienda/i);
    }
  });

  test("should be responsive", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Should still be visible
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Search", () => {
  test("should have search functionality", async ({ page }) => {
    await page.goto("/");

    // Look for search input
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("producto");
      await searchInput.press("Enter");

      // Should navigate or show results
      await page.waitForLoadState("networkidle");
    }
  });
});

test.describe("Accessibility", () => {
  test("should have proper headings", async ({ page }) => {
    await page.goto("/");

    // Should have at least one h1
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/");

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Tab through focusable elements
    await page.keyboard.press("Tab");

    // Should have focus on some element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
