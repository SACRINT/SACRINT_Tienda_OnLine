// Zod Validation Schemas - Coupons
// Input validation for coupon management endpoints

import { z } from 'zod'

/**
 * Schema for creating a new coupon
 */
export const CreateCouponSchema = z.object({
  code: z.string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code must be at most 50 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code must contain only uppercase letters, numbers, hyphens, and underscores'),

  type: z.enum(['PERCENTAGE', 'FIXED'] as const),

  value: z.number()
    .positive('Value must be positive'),

  maxDiscount: z.number()
    .positive('Max discount must be positive')
    .optional()
    .nullable(),

  minPurchase: z.number()
    .positive('Min purchase must be positive')
    .optional()
    .nullable(),

  maxUses: z.number()
    .int('Max uses must be an integer')
    .positive('Max uses must be positive')
    .optional()
    .nullable(),

  startDate: z.string()
    .datetime('Invalid date format')
    .transform((str) => new Date(str))
    .optional(),

  expiresAt: z.string()
    .datetime('Invalid date format')
    .transform((str) => new Date(str))
    .refine(
      (date) => date > new Date(),
      { message: 'Expiration date must be in the future' }
    )
    .optional()
    .nullable(),

  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
})

/**
 * Schema for updating a coupon
 */
export const UpdateCouponSchema = z.object({
  value: z.number()
    .positive('Value must be positive')
    .optional(),

  maxDiscount: z.number()
    .positive('Max discount must be positive')
    .optional()
    .nullable(),

  minPurchase: z.number()
    .positive('Min purchase must be positive')
    .optional()
    .nullable(),

  maxUses: z.number()
    .int('Max uses must be an integer')
    .positive('Max uses must be positive')
    .optional()
    .nullable(),

  expiresAt: z.string()
    .datetime('Invalid date format')
    .transform((str) => new Date(str))
    .optional()
    .nullable(),

  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
})

/**
 * Schema for validating a coupon code
 */
export const ValidateCouponSchema = z.object({
  code: z.string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code must be at most 50 characters'),

  orderTotal: z.number()
    .positive('Order total must be positive'),
})

/**
 * Schema for filtering coupons
 */
export const CouponFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  includeExpired: z.string()
    .transform((val) => val === 'true')
    .optional(),
})
