// Homepage Visual Regression Tests
import { test, expect } from "@playwright/test";

test.describe("Homepage Visual Regression", () => {
  test("homepage full page screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("homepage-full.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test("homepage hero section", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator('[data-testid="hero-section"]');
    if (await hero.isVisible()) {
      await expect(hero).toHaveScreenshot("hero-section.png", {
        threshold: 0.1,
      });
    }
  });

  test("homepage navigation", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav").first();
    await expect(nav).toHaveScreenshot("navigation.png", {
      threshold: 0.1,
    });
  });

  test("homepage featured products", async ({ page }) => {
    await page.goto("/");

    const featured = page.locator('[data-testid="featured-products"]');
    if (await featured.isVisible()) {
      await expect(featured).toHaveScreenshot("featured-products.png", {
        threshold: 0.2,
      });
    }
  });

  test("homepage footer", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot("footer.png", {
        threshold: 0.1,
      });
    }
  });
});

test.describe("Homepage Responsive Visual", () => {
  test("mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("homepage-mobile.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test("tablet view", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("homepage-tablet.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test("desktop view", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("homepage-desktop.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
