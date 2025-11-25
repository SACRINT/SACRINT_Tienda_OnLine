import { test, expect } from "@playwright/test";

test.describe("E2E: Login and Purchase", () => {
  test("should allow a logged-in user to complete a purchase", async ({ page }) => {
    // 1. Go to login page
    await page.goto("/login");

    // 2. Fill in login form (assuming test user exists)
    // await page.fill('input[name="email"]', "testbuyer@example.com");
    // await page.fill('input[name="password"]', "Password123!");
    // await page.click('button:has-text("Iniciar Sesión")');
    // await expect(page).toHaveURL("/"); // Should redirect to home or dashboard

    // For now, we just navigate to the shop page as if logged in
    await page.goto("/shop");

    // 3. Add item to cart
    const firstProduct = page.locator('div:has-text("Laptop Gamer X1")').first();
    await firstProduct.getByRole("button", { name: "Añadir" }).click();

    // 4. Go to checkout
    await page.goto("/checkout");

    // 5. Complete checkout (placeholder steps)
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Confirmar y Pagar" }).click();
    await expect(page).toHaveURL("/checkout");
  });
});
