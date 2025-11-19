// Validation Schemas Tests
import { z } from "zod";
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/lib/security/schemas/product-schemas";
import {
  orderCreateSchema,
  orderUpdateSchema,
} from "@/lib/security/schemas/order-schemas";
import {
  reviewCreateSchema,
  reviewUpdateSchema,
} from "@/lib/security/schemas/review-schemas";
import {
  couponCreateSchema,
  couponUpdateSchema,
} from "@/lib/security/schemas/coupon-schemas";

describe("Validation Schemas", () => {
  describe("Product Schemas", () => {
    describe("productCreateSchema", () => {
      const validProduct = {
        name: "Test Product",
        slug: "test-product",
        description: "A test product description",
        basePrice: 99.99,
        stock: 100,
        categoryId: "cat_123",
        images: ["/img1.jpg"],
        isActive: true,
      };

      it("should validate correct product data", () => {
        const result = productCreateSchema.safeParse(validProduct);
        expect(result.success).toBe(true);
      });

      it("should require name", () => {
        const { name, ...invalid } = validProduct;
        const result = productCreateSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });

      it("should require positive price", () => {
        const result = productCreateSchema.safeParse({
          ...validProduct,
          basePrice: -10,
        });
        expect(result.success).toBe(false);
      });

      it("should require non-negative stock", () => {
        const result = productCreateSchema.safeParse({
          ...validProduct,
          stock: -5,
        });
        expect(result.success).toBe(false);
      });

      it("should validate slug format", () => {
        const result = productCreateSchema.safeParse({
          ...validProduct,
          slug: "Invalid Slug With Spaces",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("productUpdateSchema", () => {
      it("should allow partial updates", () => {
        const result = productUpdateSchema.safeParse({
          name: "Updated Name",
        });
        expect(result.success).toBe(true);
      });

      it("should validate fields when present", () => {
        const result = productUpdateSchema.safeParse({
          basePrice: -10,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Order Schemas", () => {
    describe("orderCreateSchema", () => {
      const validOrder = {
        items: [
          {
            productId: "prod_123",
            quantity: 2,
            price: 50,
          },
        ],
        shippingAddressId: "addr_123",
        billingAddressId: "addr_456",
        paymentMethodId: "pm_123",
      };

      it("should validate correct order data", () => {
        const result = orderCreateSchema.safeParse(validOrder);
        expect(result.success).toBe(true);
      });

      it("should require at least one item", () => {
        const result = orderCreateSchema.safeParse({
          ...validOrder,
          items: [],
        });
        expect(result.success).toBe(false);
      });

      it("should require positive quantity", () => {
        const result = orderCreateSchema.safeParse({
          ...validOrder,
          items: [{ productId: "prod_123", quantity: 0, price: 50 }],
        });
        expect(result.success).toBe(false);
      });

      it("should require addresses", () => {
        const { shippingAddressId, ...invalid } = validOrder;
        const result = orderCreateSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });
    });

    describe("orderUpdateSchema", () => {
      it("should validate status updates", () => {
        const result = orderUpdateSchema.safeParse({
          status: "SHIPPED",
        });
        expect(result.success).toBe(true);
      });

      it("should reject invalid status", () => {
        const result = orderUpdateSchema.safeParse({
          status: "INVALID_STATUS",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Review Schemas", () => {
    describe("reviewCreateSchema", () => {
      const validReview = {
        productId: "prod_123",
        rating: 5,
        title: "Great Product",
        comment: "I really enjoyed this product!",
      };

      it("should validate correct review data", () => {
        const result = reviewCreateSchema.safeParse(validReview);
        expect(result.success).toBe(true);
      });

      it("should require rating between 1 and 5", () => {
        expect(
          reviewCreateSchema.safeParse({ ...validReview, rating: 0 }).success
        ).toBe(false);
        expect(
          reviewCreateSchema.safeParse({ ...validReview, rating: 6 }).success
        ).toBe(false);
      });

      it("should require productId", () => {
        const { productId, ...invalid } = validReview;
        const result = reviewCreateSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });

      it("should allow optional title and comment", () => {
        const result = reviewCreateSchema.safeParse({
          productId: "prod_123",
          rating: 4,
        });
        expect(result.success).toBe(true);
      });
    });

    describe("reviewUpdateSchema", () => {
      it("should allow partial updates", () => {
        const result = reviewUpdateSchema.safeParse({
          rating: 4,
        });
        expect(result.success).toBe(true);
      });

      it("should validate rating when present", () => {
        const result = reviewUpdateSchema.safeParse({
          rating: 10,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Coupon Schemas", () => {
    describe("couponCreateSchema", () => {
      const validCoupon = {
        code: "SAVE20",
        type: "PERCENTAGE",
        value: 20,
        minPurchase: 50,
        maxUses: 100,
        expiresAt: new Date("2025-12-31").toISOString(),
        isActive: true,
      };

      it("should validate correct coupon data", () => {
        const result = couponCreateSchema.safeParse(validCoupon);
        expect(result.success).toBe(true);
      });

      it("should require code", () => {
        const { code, ...invalid } = validCoupon;
        const result = couponCreateSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });

      it("should require valid type", () => {
        const result = couponCreateSchema.safeParse({
          ...validCoupon,
          type: "INVALID",
        });
        expect(result.success).toBe(false);
      });

      it("should require positive value", () => {
        const result = couponCreateSchema.safeParse({
          ...validCoupon,
          value: -10,
        });
        expect(result.success).toBe(false);
      });

      it("should validate percentage <= 100", () => {
        const result = couponCreateSchema.safeParse({
          ...validCoupon,
          type: "PERCENTAGE",
          value: 150,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("couponUpdateSchema", () => {
      it("should allow partial updates", () => {
        const result = couponUpdateSchema.safeParse({
          isActive: false,
        });
        expect(result.success).toBe(true);
      });

      it("should validate value when present", () => {
        const result = couponUpdateSchema.safeParse({
          value: -10,
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
