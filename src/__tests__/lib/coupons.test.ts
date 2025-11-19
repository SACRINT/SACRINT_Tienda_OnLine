// Coupon Service Tests

import { describe, it, expect, beforeEach } from "vitest"
import {
  validateCoupon,
  calculateDiscount,
  formatCouponValue,
  isCouponExpired,
} from "@/lib/coupons"

describe("Coupon Service", () => {
  describe("validateCoupon", () => {
    it("should validate a valid percentage coupon", () => {
      const result = validateCoupon("DESCUENTO10", 500)

      expect(result.valid).toBe(true)
      expect(result.coupon).toBeDefined()
      expect(result.discount).toBe(50) // 10% of 500
    })

    it("should validate free shipping coupon", () => {
      const result = validateCoupon("ENVIOGRATIS", 200)

      expect(result.valid).toBe(true)
      expect(result.coupon?.type).toBe("free_shipping")
    })

    it("should reject invalid coupon code", () => {
      const result = validateCoupon("INVALID_CODE", 500)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("should reject when cart total is below minimum", () => {
      const result = validateCoupon("DESCUENTO10", 50, {
        minPurchase: 100,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain("mínimo")
    })

    it("should reject expired coupon", () => {
      const result = validateCoupon("EXPIRED", 500, {
        checkExpiration: true,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain("expirado")
    })

    it("should apply maximum discount limit", () => {
      const result = validateCoupon("DESCUENTO10", 10000, {
        maxDiscount: 100,
      })

      expect(result.valid).toBe(true)
      expect(result.discount).toBeLessThanOrEqual(100)
    })
  })

  describe("calculateDiscount", () => {
    it("should calculate percentage discount", () => {
      const discount = calculateDiscount(
        { type: "percentage", value: 20 },
        500
      )

      expect(discount).toBe(100) // 20% of 500
    })

    it("should calculate fixed discount", () => {
      const discount = calculateDiscount(
        { type: "fixed", value: 50 },
        500
      )

      expect(discount).toBe(50)
    })

    it("should return 0 for free shipping type", () => {
      const discount = calculateDiscount(
        { type: "free_shipping", value: 0 },
        500
      )

      expect(discount).toBe(0)
    })

    it("should not exceed cart total", () => {
      const discount = calculateDiscount(
        { type: "fixed", value: 1000 },
        500
      )

      expect(discount).toBe(500)
    })

    it("should respect maximum discount", () => {
      const discount = calculateDiscount(
        { type: "percentage", value: 50 },
        1000,
        { maxDiscount: 100 }
      )

      expect(discount).toBe(100)
    })
  })

  describe("formatCouponValue", () => {
    it("should format percentage coupon", () => {
      const formatted = formatCouponValue({
        type: "percentage",
        value: 15,
      })

      expect(formatted).toBe("15%")
    })

    it("should format fixed coupon in MXN", () => {
      const formatted = formatCouponValue({
        type: "fixed",
        value: 100,
      })

      expect(formatted).toContain("100")
      expect(formatted).toContain("$")
    })

    it("should format free shipping", () => {
      const formatted = formatCouponValue({
        type: "free_shipping",
        value: 0,
      })

      expect(formatted.toLowerCase()).toContain("envío gratis")
    })
  })

  describe("isCouponExpired", () => {
    it("should return false for future date", () => {
      const futureDate = new Date(Date.now() + 86400000) // Tomorrow

      expect(isCouponExpired(futureDate)).toBe(false)
    })

    it("should return true for past date", () => {
      const pastDate = new Date(Date.now() - 86400000) // Yesterday

      expect(isCouponExpired(pastDate)).toBe(true)
    })

    it("should return false when no expiration", () => {
      expect(isCouponExpired(undefined)).toBe(false)
    })
  })
})
