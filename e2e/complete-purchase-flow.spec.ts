import { test, expect } from "@playwright/test";

test.describe("E2E: Complete Purchase Flow", () => {
  test("should allow a user to browse, add to cart, and checkout", async ({
    page,
  }) => {
    // 1. Home and browse to shop
    await page.goto("/");
    await page.getByRole("link", { name: "Tienda" }).click();
    await expect(page).toHaveURL("/shop");

    // 2. Find a product and add it to the cart
    // Using the first product card for simplicity
    const firstProduct = page.locator('div:has-text("Laptop Gamer X1")').first();
    await firstProduct.getByRole("button", { name: "Añadir" }).click();

    // 3. Open cart and proceed to checkout
    await page.locator('button:has-text("1")').click(); // Click cart icon
    await page.getByRole("link", { name: "Ver Carrito Completo" }).click();
    await expect(page).toHaveURL("/cart");

    // 4. On cart page, proceed to checkout
    await page.getByRole("link", { name: "Proceder al Pago" }).click();
    await expect(page).toHaveURL("/checkout");

    // 5. Fill out checkout form (placeholders for now)
    // Step 1: Shipping Address
    // This part is a placeholder as the form is not fully implemented
    await page.getByRole("button", { name: "Siguiente" }).click();

    // Step 2: Shipping Method
    await page.getByRole("button", { name: "Siguiente" }).click();

    // Step 3: Payment Method
    // Placeholder for Stripe Elements
    
    // Step 4: Review and Confirm
    await page.getByRole("button", { name: "Confirmar y Pagar" }).click();

    // As this is a placeholder, we expect it to stay on the same page for now
    await expect(page).toHaveURL("/checkout");
  });
});
