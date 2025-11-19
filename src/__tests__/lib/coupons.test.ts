// Coupon Service Tests

import {
  validateCoupon,
  formatCoupon,
  findCoupon,
  getActiveCoupons,
  givesFreeShipping,
} from "@/lib/coupons";

describe("Coupon Service", () => {
  describe("validateCoupon", () => {
    it("should reject invalid coupon code", () => {
      const result = validateCoupon("INVALID_CODE", 500);

      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("should return validation result structure", () => {
      const result = validateCoupon("DESCUENTO10", 500);

      // Result should have the expected structure
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
    });
  });

  describe("findCoupon", () => {
    it("should find coupon by code (case insensitive)", () => {
      const coupon = findCoupon("descuento10");
      expect(coupon).toBeDefined();
      expect(coupon?.code).toBe("DESCUENTO10");
    });

    it("should return undefined for non-existent coupon", () => {
      const coupon = findCoupon("NOTEXIST");
      expect(coupon).toBeUndefined();
    });
  });

  describe("formatCoupon", () => {
    it("should format percentage coupon", () => {
      const coupon = findCoupon("DESCUENTO10");
      if (coupon) {
        const formatted = formatCoupon(coupon);
        expect(formatted).toContain("10");
        expect(formatted).toContain("OFF");
      }
    });

    it("should format free shipping coupon", () => {
      const coupon = findCoupon("ENVIOGRATIS");
      if (coupon) {
        const formatted = formatCoupon(coupon);
        expect(formatted.toLowerCase()).toContain("envío");
      }
    });
  });

  describe("getActiveCoupons", () => {
    it("should return array of coupons", () => {
      const coupons = getActiveCoupons();
      expect(Array.isArray(coupons)).toBe(true);
      // If there are coupons, they should all be active
      coupons.forEach((coupon) => {
        expect(coupon.status).toBe("active");
      });
    });
  });

  describe("givesFreeShipping", () => {
    it("should return true for free shipping coupon", () => {
      const coupon = findCoupon("ENVIOGRATIS");
      if (coupon) {
        expect(givesFreeShipping(coupon)).toBe(true);
      }
    });

    it("should return false for percentage coupon", () => {
      const coupon = findCoupon("DESCUENTO10");
      if (coupon) {
        expect(givesFreeShipping(coupon)).toBe(false);
      }
    });
  });
});
