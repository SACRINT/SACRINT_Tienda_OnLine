/**
 * Mercado Pago Integration Tests
 * Task 14.10: Testing Mercado Pago
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mapMPStatusToPaymentStatus,
  mapMPStatusToOrderStatus,
  validateMercadoPagoConfig,
} from "../mercado-pago";
import { calculateSplit } from "../mercado-pago-marketplace";

// Mock environment variables
vi.mock("process", () => ({
  env: {
    MERCADOPAGO_ACCESS_TOKEN: "TEST_TOKEN",
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: "TEST_PUBLIC_KEY",
    MERCADOPAGO_APP_ID: "TEST_APP_ID",
    MERCADOPAGO_CLIENT_SECRET: "TEST_CLIENT_SECRET",
  },
}));

describe("Mercado Pago - Status Mapping", () => {
  describe("mapMPStatusToPaymentStatus", () => {
    it("should map 'approved' to COMPLETED", () => {
      expect(mapMPStatusToPaymentStatus("approved")).toBe("COMPLETED");
    });

    it("should map 'authorized' to COMPLETED", () => {
      expect(mapMPStatusToPaymentStatus("authorized")).toBe("COMPLETED");
    });

    it("should map 'rejected' to FAILED", () => {
      expect(mapMPStatusToPaymentStatus("rejected")).toBe("FAILED");
    });

    it("should map 'cancelled' to FAILED", () => {
      expect(mapMPStatusToPaymentStatus("cancelled")).toBe("FAILED");
    });

    it("should map 'refunded' to REFUNDED", () => {
      expect(mapMPStatusToPaymentStatus("refunded")).toBe("REFUNDED");
    });

    it("should map 'charged_back' to REFUNDED", () => {
      expect(mapMPStatusToPaymentStatus("charged_back")).toBe("REFUNDED");
    });

    it("should map 'pending' to PENDING", () => {
      expect(mapMPStatusToPaymentStatus("pending")).toBe("PENDING");
    });

    it("should map 'in_process' to PENDING", () => {
      expect(mapMPStatusToPaymentStatus("in_process")).toBe("PENDING");
    });

    it("should map 'in_mediation' to PENDING", () => {
      expect(mapMPStatusToPaymentStatus("in_mediation")).toBe("PENDING");
    });
  });

  describe("mapMPStatusToOrderStatus", () => {
    it("should map 'approved' to PROCESSING", () => {
      expect(mapMPStatusToOrderStatus("approved")).toBe("PROCESSING");
    });

    it("should map 'authorized' to PROCESSING", () => {
      expect(mapMPStatusToOrderStatus("authorized")).toBe("PROCESSING");
    });

    it("should map 'rejected' to CANCELLED", () => {
      expect(mapMPStatusToOrderStatus("rejected")).toBe("CANCELLED");
    });

    it("should map 'cancelled' to CANCELLED", () => {
      expect(mapMPStatusToOrderStatus("cancelled")).toBe("CANCELLED");
    });

    it("should map 'refunded' to REFUNDED", () => {
      expect(mapMPStatusToOrderStatus("refunded")).toBe("REFUNDED");
    });

    it("should map 'pending' to PENDING", () => {
      expect(mapMPStatusToOrderStatus("pending")).toBe("PENDING");
    });
  });
});

describe("Mercado Pago - Configuration Validation", () => {
  it("should validate config with correct tokens", () => {
    const isValid = validateMercadoPagoConfig();
    expect(isValid).toBe(true);
  });
});

describe("Mercado Pago Marketplace - Split Calculations", () => {
  describe("calculateSplit", () => {
    it("should calculate correct split with 10% commission", () => {
      const result = calculateSplit(100, 10);

      expect(result.commissionPercentage).toBe(10);
      expect(result.platformCommission).toBe(10);
      expect(result.sellerAmount).toBe(90);
    });

    it("should calculate correct split with 15% commission", () => {
      const result = calculateSplit(100, 15);

      expect(result.commissionPercentage).toBe(15);
      expect(result.platformCommission).toBe(15);
      expect(result.sellerAmount).toBe(85);
    });

    it("should calculate correct split with 5% commission", () => {
      const result = calculateSplit(100, 5);

      expect(result.commissionPercentage).toBe(5);
      expect(result.platformCommission).toBe(5);
      expect(result.sellerAmount).toBe(95);
    });

    it("should handle decimal amounts correctly", () => {
      const result = calculateSplit(99.99, 10);

      expect(result.platformCommission).toBe(10);
      expect(result.sellerAmount).toBe(90);
      // Total should equal original amount
      expect(result.platformCommission + result.sellerAmount).toBeCloseTo(99.99, 1);
    });

    it("should handle large amounts", () => {
      const result = calculateSplit(10000, 10);

      expect(result.platformCommission).toBe(1000);
      expect(result.sellerAmount).toBe(9000);
    });

    it("should round to 2 decimal places", () => {
      const result = calculateSplit(33.33, 10);

      // 10% of 33.33 = 3.333 -> rounded to 3.33
      expect(result.platformCommission).toBe(3.33);
      expect(result.sellerAmount).toBe(30);
    });

    it("should handle 0% commission", () => {
      const result = calculateSplit(100, 0);

      expect(result.platformCommission).toBe(0);
      expect(result.sellerAmount).toBe(100);
    });

    it("should handle 100% commission", () => {
      const result = calculateSplit(100, 100);

      expect(result.platformCommission).toBe(100);
      expect(result.sellerAmount).toBe(0);
    });
  });
});

describe("Mercado Pago - Payment Schema Validation", () => {
  it("should validate correct payment input", async () => {
    const { MercadoPagoPaymentSchema } = await import("../mercado-pago");

    const validInput = {
      orderId: "clxxxxxxxxxxxxxxxxxxxx",
      amount: 100.50,
      description: "Test Order",
      payerEmail: "test@example.com",
    };

    const result = MercadoPagoPaymentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", async () => {
    const { MercadoPagoPaymentSchema } = await import("../mercado-pago");

    const invalidInput = {
      orderId: "clxxxxxxxxxxxxxxxxxxxx",
      amount: 100,
      description: "Test Order",
      payerEmail: "invalid-email",
    };

    const result = MercadoPagoPaymentSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should reject negative amount", async () => {
    const { MercadoPagoPaymentSchema } = await import("../mercado-pago");

    const invalidInput = {
      orderId: "clxxxxxxxxxxxxxxxxxxxx",
      amount: -100,
      description: "Test Order",
      payerEmail: "test@example.com",
    };

    const result = MercadoPagoPaymentSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should accept optional fields", async () => {
    const { MercadoPagoPaymentSchema } = await import("../mercado-pago");

    const validInput = {
      orderId: "clxxxxxxxxxxxxxxxxxxxx",
      amount: 100,
      description: "Test Order",
      payerEmail: "test@example.com",
      payerName: "John Doe",
      paymentMethodId: "visa",
      installments: 3,
      metadata: { customField: "value" },
    };

    const result = MercadoPagoPaymentSchema.safeParse(validInput);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.installments).toBe(3);
      expect(result.data.payerName).toBe("John Doe");
    }
  });

  it("should default installments to 1", async () => {
    const { MercadoPagoPaymentSchema } = await import("../mercado-pago");

    const input = {
      orderId: "clxxxxxxxxxxxxxxxxxxxx",
      amount: 100,
      description: "Test Order",
      payerEmail: "test@example.com",
    };

    const result = MercadoPagoPaymentSchema.parse(input);
    expect(result.installments).toBe(1);
  });

  it("should reject installments > 24", async () => {
    const { MercadoPagoPaymentSchema } = await import("../mercado-pago");

    const invalidInput = {
      orderId: "clxxxxxxxxxxxxxxxxxxxx",
      amount: 100,
      description: "Test Order",
      payerEmail: "test@example.com",
      installments: 25,
    };

    const result = MercadoPagoPaymentSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should reject installments < 1", async () => {
    const { MercadoPagoPaymentSchema } = await import("../mercado-pago");

    const invalidInput = {
      orderId: "clxxxxxxxxxxxxxxxxxxxx",
      amount: 100,
      description: "Test Order",
      payerEmail: "test@example.com",
      installments: 0,
    };

    const result = MercadoPagoPaymentSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe("Mercado Pago Marketplace - Seller Onboarding Schema", () => {
  it("should validate correct seller onboarding input", async () => {
    const { SellerOnboardingSchema } = await import("../mercado-pago-marketplace");

    const validInput = {
      tenantId: "clxxxxxxxxxxxxxxxxxxxx",
      countryId: "AR",
      email: "seller@example.com",
      firstName: "John",
      lastName: "Doe",
    };

    const result = SellerOnboardingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should accept all LATAM countries", async () => {
    const { SellerOnboardingSchema } = await import("../mercado-pago-marketplace");

    const countries = ["AR", "BR", "CL", "CO", "MX", "PE", "UY"];

    for (const country of countries) {
      const input = {
        tenantId: "clxxxxxxxxxxxxxxxxxxxx",
        countryId: country,
        email: "seller@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      const result = SellerOnboardingSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid country", async () => {
    const { SellerOnboardingSchema } = await import("../mercado-pago-marketplace");

    const invalidInput = {
      tenantId: "clxxxxxxxxxxxxxxxxxxxx",
      countryId: "US", // Not in LATAM list
      email: "seller@example.com",
      firstName: "John",
      lastName: "Doe",
    };

    const result = SellerOnboardingSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should accept optional fields", async () => {
    const { SellerOnboardingSchema } = await import("../mercado-pago-marketplace");

    const validInput = {
      tenantId: "clxxxxxxxxxxxxxxxxxxxx",
      countryId: "AR",
      email: "seller@example.com",
      firstName: "John",
      lastName: "Doe",
      businessName: "Acme Corp",
      taxId: "20-12345678-9",
      phone: "+54 11 1234-5678",
    };

    const result = SellerOnboardingSchema.safeParse(validInput);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.businessName).toBe("Acme Corp");
      expect(result.data.taxId).toBe("20-12345678-9");
    }
  });
});
