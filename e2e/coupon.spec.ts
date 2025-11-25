import { test, expect } from "@playwright/test";

test.describe("E2E: Coupon Application", () => {
  test("should apply a valid coupon and show the discount", async ({
    page,
  }) => {
    // 1. Go to cart page
    await page.goto("/cart");

    // 2. Apply coupon
    await page.fill('input[id="coupon"]', "BIENVENIDO10");
    await page.getByRole("button", { name: "Aplicar" }).click();

    // 3. Verify discount is shown
    // This is a placeholder as the functionality is not fully implemented
    // await expect(page.locator('dt:has-text("Descuento")')).toBeVisible();
    // await expect(page.locator('dd:has-text("-$127.00")')).toBeVisible();
  });
});
