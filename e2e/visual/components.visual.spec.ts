// UI Components Visual Regression Tests
import { test, expect } from "@playwright/test";

test.describe("Button Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with buttons
    await page.goto("/");
  });

  test("primary button", async ({ page }) => {
    const button = page.locator('button[data-variant="default"]').first();
    if (await button.isVisible()) {
      await expect(button).toHaveScreenshot("button-primary.png", {
        threshold: 0.1,
      });
    }
  });

  test("secondary button", async ({ page }) => {
    const button = page.locator('button[data-variant="secondary"]').first();
    if (await button.isVisible()) {
      await expect(button).toHaveScreenshot("button-secondary.png", {
        threshold: 0.1,
      });
    }
  });

  test("outline button", async ({ page }) => {
    const button = page.locator('button[data-variant="outline"]').first();
    if (await button.isVisible()) {
      await expect(button).toHaveScreenshot("button-outline.png", {
        threshold: 0.1,
      });
    }
  });

  test("disabled button", async ({ page }) => {
    const button = page.locator("button:disabled").first();
    if (await button.isVisible()) {
      await expect(button).toHaveScreenshot("button-disabled.png", {
        threshold: 0.1,
      });
    }
  });
});

test.describe("Form Elements Visual Regression", () => {
  test("input field", async ({ page }) => {
    await page.goto("/login");

    const input = page.locator('input[type="email"]').first();
    if (await input.isVisible()) {
      await expect(input).toHaveScreenshot("input-field.png", {
        threshold: 0.1,
      });
    }
  });

  test("input field focused", async ({ page }) => {
    await page.goto("/login");

    const input = page.locator('input[type="email"]').first();
    if (await input.isVisible()) {
      await input.focus();
      await expect(input).toHaveScreenshot("input-field-focused.png", {
        threshold: 0.1,
      });
    }
  });

  test("select dropdown", async ({ page }) => {
    await page.goto("/shop");

    const select = page.locator("select").first();
    if (await select.isVisible()) {
      await expect(select).toHaveScreenshot("select-dropdown.png", {
        threshold: 0.1,
      });
    }
  });

  test("checkbox", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await expect(checkbox).toHaveScreenshot("checkbox.png", {
        threshold: 0.1,
      });
    }
  });
});

test.describe("Modal Visual Regression", () => {
  test("modal dialog", async ({ page }) => {
    await page.goto("/");

    // Open a modal (this depends on your app's triggers)
    const trigger = page.locator('[data-testid="modal-trigger"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();

      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot("modal-dialog.png", {
          threshold: 0.1,
        });
      }
    }
  });
});

test.describe("Toast/Alert Visual Regression", () => {
  test("success toast", async ({ page }) => {
    await page.goto("/");

    const toast = page.locator('[data-testid="toast-success"]');
    if (await toast.isVisible()) {
      await expect(toast).toHaveScreenshot("toast-success.png", {
        threshold: 0.1,
      });
    }
  });

  test("error toast", async ({ page }) => {
    await page.goto("/");

    const toast = page.locator('[data-testid="toast-error"]');
    if (await toast.isVisible()) {
      await expect(toast).toHaveScreenshot("toast-error.png", {
        threshold: 0.1,
      });
    }
  });
});

test.describe("Badge Visual Regression", () => {
  test("product badges", async ({ page }) => {
    await page.goto("/shop");

    const badge = page.locator('[data-testid="product-badge"]').first();
    if (await badge.isVisible()) {
      await expect(badge).toHaveScreenshot("product-badge.png", {
        threshold: 0.1,
      });
    }
  });
});
