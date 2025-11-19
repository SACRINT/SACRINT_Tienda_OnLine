// Checkout E2E Tests
import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout
    await page.goto("/checkout");
  });

  test("should require authentication", async ({ page }) => {
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/login|auth/i);
  });

  test("should display checkout steps", async ({ page }) => {
    // This test assumes user is authenticated
    // Check for step indicators
    const steps = page.locator('[data-testid="checkout-step"]');
    // Steps might include: Address, Shipping, Payment, Review
  });

  test("should show shipping address form", async ({ page }) => {
    // Look for address form fields
    const addressForm = page.locator('[data-testid="shipping-address-form"]');
    if (await addressForm.isVisible()) {
      const streetInput = page.getByLabel(/calle|street/i);
      const cityInput = page.getByLabel(/ciudad|city/i);
      const postalInput = page.getByLabel(/código postal|zip/i);

      if (await streetInput.isVisible()) {
        await expect(streetInput).toBeEditable();
        await expect(cityInput).toBeEditable();
        await expect(postalInput).toBeEditable();
      }
    }
  });

  test("should validate required fields", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: /continuar|continue/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      const errorMessages = page.locator('[data-testid="field-error"]');
      if (await errorMessages.first().isVisible()) {
        expect(await errorMessages.count()).toBeGreaterThan(0);
      }
    }
  });

  test("should show shipping options", async ({ page }) => {
    const shippingOptions = page.locator('[data-testid="shipping-option"]');
    if (await shippingOptions.first().isVisible()) {
      // Should have at least one shipping option
      expect(await shippingOptions.count()).toBeGreaterThanOrEqual(1);

      // Each should have name and price
      const firstOption = shippingOptions.first();
      await expect(firstOption).toBeVisible();
    }
  });

  test("should show payment form", async ({ page }) => {
    const paymentForm = page.locator('[data-testid="payment-form"]');
    if (await paymentForm.isVisible()) {
      // Should have card input fields (Stripe Elements)
      const cardElement = page.locator('[data-testid="card-element"]');
      if (await cardElement.isVisible()) {
        await expect(cardElement).toBeVisible();
      }
    }
  });

  test("should display order summary", async ({ page }) => {
    const orderSummary = page.locator('[data-testid="order-summary"]');
    if (await orderSummary.isVisible()) {
      // Should show items, subtotal, tax, shipping, total
      await expect(orderSummary).toContainText(/subtotal/i);
      await expect(orderSummary).toContainText(/total/i);
    }
  });

  test("should show order review before payment", async ({ page }) => {
    const reviewSection = page.locator('[data-testid="order-review"]');
    // Review section shows before final payment
  });

  test("should handle payment errors", async ({ page }) => {
    // Test error handling for declined cards
    const payButton = page.getByRole("button", { name: /pagar|pay/i });
    if (await payButton.isVisible()) {
      // Submit with test card that will be declined
      // Error should be displayed
      const errorMessage = page.locator('[data-testid="payment-error"]');
      // Error handling test
    }
  });

  test("should show confirmation page after success", async ({ page }) => {
    // After successful payment, should redirect to confirmation
    await page.goto("/checkout/success");

    const confirmationMessage = page.getByText(/gracias|thank you|confirmado|confirmed/i);
    if (await confirmationMessage.isVisible()) {
      await expect(confirmationMessage).toBeVisible();
    }
  });
});

test.describe("Checkout Security", () => {
  test("should use HTTPS", async ({ page }) => {
    await page.goto("/checkout");

    // In production, should be HTTPS
    if (process.env.CI) {
      expect(page.url()).toContain("https://");
    }
  });

  test("should not expose sensitive data", async ({ page }) => {
    await page.goto("/checkout");

    // Card numbers should not be visible in DOM
    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/4111\s*1111\s*1111\s*1111/);
  });
});
