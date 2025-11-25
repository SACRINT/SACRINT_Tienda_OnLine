import { test, expect } from "@playwright/test";

test.describe("E2E: Multiple Items in Cart", () => {
  test("should handle multiple items correctly in the cart", async ({ page }) => {
    // 1. Go to shop
    await page.goto("/shop");

    // 2. Add multiple items
    const firstProduct = page.locator('div:has-text("Laptop Gamer X1")').first();
    await firstProduct.getByRole("button", { name: "Añadir" }).click();
    await firstProduct.getByRole("button", { name: "Añadir" }).click(); // Add it twice

    const secondProduct = page.locator('div:has-text("Teclado Mecánico RGB")').first();
    await secondProduct.getByRole("button", { name: "Añadir" }).click();

    // 3. Open cart and verify quantities
    await page.locator('button:has-text("3")').click(); // Cart icon should show 3 items

    // 4. Verify items in the cart page
    await page.goto("/cart");
    const laptop = page.locator('li:has-text("Laptop Gamer X1")');
    await expect(laptop.locator('span:text("2")')).toBeVisible(); // Quantity of 2

    const keyboard = page.locator('li:has-text("Teclado Mecánico RGB")');
    await expect(keyboard.locator('span:text("1")')).toBeVisible(); // Quantity of 1
  });
});
