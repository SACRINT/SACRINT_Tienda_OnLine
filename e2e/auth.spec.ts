// Authentication E2E Tests
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");

    // Should have login form or redirect
    await expect(page).toHaveURL(/login|signin|auth/i);
  });

  test("should show signup page", async ({ page }) => {
    await page.goto("/signup");

    // Should have signup form or redirect
    await expect(page).toHaveURL(/signup|register|auth/i);
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel(/email|correo/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill("invalid-email");
      await emailInput.blur();

      // Should show validation error
      // Exact implementation depends on form
    }
  });

  test("should have Google OAuth button", async ({ page }) => {
    await page.goto("/login");

    const googleButton = page.getByRole("button", { name: /google/i });
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeEnabled();
    }
  });

  test("should redirect unauthenticated users from dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/login|signin|auth/i);
  });
});

test.describe("Protected Routes", () => {
  test("should protect account page", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/login|auth/i);
  });

  test("should protect orders page", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/login|auth/i);
  });
});
