// src/lib/payments/coupons.ts
import { db } from "@/lib/db";
import { Coupon, CouponType, Prisma } from "@prisma/client";

// Custom error for validation
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

/**
 * Applies a coupon to a given cart total.
 * 
 * @param code - The coupon code.
 * @param cartTotal - The total amount of the cart.
 * @returns An object with the discount amount and the coupon details.
 * @throws {ValidationError} If the coupon is invalid or requirements are not met.
 */
export async function applyCoupon(
  code: string,
  cartTotal: number
): Promise<{ discount: number; coupon: Coupon }> {
  const coupon = await db.coupon.findFirst({
    where: { code: code as string }, // Only search by code
  });

  if (!coupon || !(coupon as any).isActive) { // Added type assertion as a workaround
    throw new ValidationError("El cupón ingresado no es válido o ha expirado.");
  }

  if (coupon.minPurchase && cartTotal < coupon.minPurchase.toNumber()) {
    throw new ValidationError(
      `Se requiere una compra mínima de $${coupon.minPurchase} para usar este cupón.`
    );
  }

  let discount = 0;
  if (coupon.type === CouponType.PERCENTAGE) { // Corrected enum usage
    discount = (cartTotal * coupon.value.toNumber()) / 100;
  } else {
    discount = coupon.value.toNumber();
  }

  return { discount, coupon };
}
