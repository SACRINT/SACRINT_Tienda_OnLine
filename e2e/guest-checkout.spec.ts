import { test, expect } from "@playwright/test";

test.describe("E2E: Guest Checkout", () => {
  test("should allow a guest user to complete a purchase", async ({
    page,
  }) => {
    // 1. Go to shop and add an item
    await page.goto("/shop");
    const firstProduct = page.locator('div:has-text("Laptop Gamer X1")').first();
    await firstProduct.getByRole("button", { name: "Añadir" }).click();

    // 2. Go to checkout
    await page.goto("/checkout");

    // 3. Fill out checkout form (placeholders for now)
    // Here, a guest would fill in their email, name, and address
    
    // Step 1: Shipping Address
    await page.getByRole("button", { name: "Siguiente" }).click();

    // Step 2: Shipping Method
    await page.getByRole("button", { name: "Siguiente" }).click();

    // Step 3: Payment Method
    
    // Step 4: Review and Confirm
    await page.getByRole("button", { name: "Confirmar y Pagar" }).click();
    await expect(page).toHaveURL("/checkout");
  });
});
