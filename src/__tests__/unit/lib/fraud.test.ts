// Fraud Detection Tests
import {
  checkFraud,
  isBlockedIp,
  isDisposableEmail,
  RISK_FACTORS,
  TransactionData,
} from "@/lib/security/fraud";

describe("Fraud Detection", () => {
  const baseTransaction: TransactionData = {
    amount: 100,
    currency: "MXN",
    userId: "user_123",
    email: "test@example.com",
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    shippingAddress: {
      country: "MX",
      postalCode: "12345",
    },
    billingAddress: {
      country: "MX",
      postalCode: "12345",
    },
    isNewCustomer: false,
    previousOrders: 5,
    cartItems: 2,
  };

  describe("checkFraud", () => {
    it("should allow low-risk transaction", () => {
      const result = checkFraud(baseTransaction);

      expect(result.decision).toBe("allow");
      expect(result.score).toBeLessThan(30);
      expect(result.signals.length).toBe(0);
    });

    it("should flag high-value transaction", () => {
      const result = checkFraud({
        ...baseTransaction,
        amount: 15000,
      });

      expect(result.score).toBeGreaterThan(0);
      expect(result.signals.some((s) => s.type === "high_value")).toBe(true);
    });

    it("should flag new customer with high value", () => {
      const result = checkFraud({
        ...baseTransaction,
        amount: 2000,
        isNewCustomer: true,
        previousOrders: 0,
      });

      expect(
        result.signals.some((s) => s.type === "new_customer_high_value"),
      ).toBe(true);
    });

    it("should flag address country mismatch", () => {
      const result = checkFraud({
        ...baseTransaction,
        shippingAddress: { country: "US", postalCode: "12345" },
        billingAddress: { country: "MX", postalCode: "12345" },
      });

      expect(
        result.signals.some((s) => s.type === "address_country_mismatch"),
      ).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(25);
    });

    it("should flag large cart", () => {
      const result = checkFraud({
        ...baseTransaction,
        cartItems: 25,
      });

      expect(result.signals.some((s) => s.type === "large_cart")).toBe(true);
    });

    it("should flag email alias", () => {
      const result = checkFraud({
        ...baseTransaction,
        email: "test+alias@example.com",
      });

      expect(result.signals.some((s) => s.type === "email_alias")).toBe(true);
    });

    it("should recommend review for moderate risk", () => {
      const result = checkFraud({
        ...baseTransaction,
        amount: 3000,
        isNewCustomer: true,
        cartItems: 15,
      });

      expect(result.decision).toBe("review");
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.score).toBeLessThan(60);
    });

    it("should block high-risk transaction", () => {
      const result = checkFraud({
        ...baseTransaction,
        amount: 15000,
        isNewCustomer: true,
        shippingAddress: { country: "US", postalCode: "12345" },
        billingAddress: { country: "MX", postalCode: "12345" },
        cartItems: 25,
      });

      expect(result.decision).toBe("block");
      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it("should include recommendations", () => {
      const result = checkFraud({
        ...baseTransaction,
        amount: 5000,
        shippingAddress: { country: "US", postalCode: "12345" },
        billingAddress: { country: "MX", postalCode: "12345" },
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should cap score at 100", () => {
      const result = checkFraud({
        ...baseTransaction,
        amount: 20000,
        isNewCustomer: true,
        shippingAddress: { country: "US", postalCode: "12345" },
        billingAddress: { country: "MX", postalCode: "12345" },
        cartItems: 50,
        email: "test+spam@tempmail.com",
      });

      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe("isBlockedIp", () => {
    const originalEnv = process.env.BLOCKED_IPS;

    beforeEach(() => {
      process.env.BLOCKED_IPS = "10.0.0.1,10.0.0.2";
    });

    afterEach(() => {
      process.env.BLOCKED_IPS = originalEnv;
    });

    it("should return true for blocked IP", () => {
      expect(isBlockedIp("10.0.0.1")).toBe(true);
    });

    it("should return false for allowed IP", () => {
      expect(isBlockedIp("192.168.1.1")).toBe(false);
    });
  });

  describe("isDisposableEmail", () => {
    it("should detect disposable email domains", () => {
      expect(isDisposableEmail("test@tempmail.com")).toBe(true);
      expect(isDisposableEmail("test@mailinator.com")).toBe(true);
    });

    it("should allow legitimate domains", () => {
      expect(isDisposableEmail("test@gmail.com")).toBe(false);
      expect(isDisposableEmail("test@company.com")).toBe(false);
    });
  });

  describe("RISK_FACTORS", () => {
    it("should have reasonable thresholds", () => {
      expect(RISK_FACTORS.HIGH_VALUE_THRESHOLD).toBeGreaterThan(1000);
      expect(RISK_FACTORS.NEW_CUSTOMER_HIGH_VALUE_THRESHOLD).toBeLessThan(
        RISK_FACTORS.HIGH_VALUE_THRESHOLD,
      );
      expect(RISK_FACTORS.LARGE_CART_THRESHOLD).toBeGreaterThan(10);
    });
  });
});
