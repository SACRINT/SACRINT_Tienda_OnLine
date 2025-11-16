// Review and Inventory Validation Schemas
// Complete Zod schemas for Sprint 4 - Reviews & Inventory Management

import { z } from 'zod'

// ============ REVIEW SCHEMAS ============

/**
 * Schema for creating a new product review
 * Used in POST /api/products/[id]/reviews
 */
export const CreateReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.coerce
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .trim(),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must not exceed 500 characters')
    .trim(),
})

/**
 * Schema for updating an existing review
 * Used in PATCH /api/reviews/[id]
 * At least one field must be provided
 */
export const UpdateReviewSchema = z
  .object({
    rating: z.coerce
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5')
      .optional(),
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must not exceed 100 characters')
      .trim()
      .optional(),
    comment: z
      .string()
      .min(10, 'Comment must be at least 10 characters')
      .max(500, 'Comment must not exceed 500 characters')
      .trim()
      .optional(),
  })
  .refine(
    (data) => data.rating !== undefined || data.title !== undefined || data.comment !== undefined,
    {
      message: 'At least one field (rating, title, or comment) must be provided',
    }
  )

/**
 * Schema for filtering/paginating reviews
 * Used in GET /api/products/[id]/reviews
 */
export const ReviewFilterSchema = z.object({
  productId: z.string().uuid('Invalid product ID').optional(),
  minRating: z.coerce
    .number()
    .int('Minimum rating must be an integer')
    .min(1, 'Minimum rating must be at least 1')
    .max(5, 'Minimum rating must be at most 5')
    .optional(),
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .positive('Page must be a positive number')
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive number')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
})

// ============ INVENTORY SCHEMAS ============

/**
 * Schema for manual inventory adjustments
 * Used in PATCH /api/inventory
 */
export const AdjustInventorySchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  adjustment: z.coerce
    .number()
    .int('Adjustment must be an integer')
    .refine(
      (val) => val !== 0,
      { message: 'Adjustment cannot be zero' }
    ),
  reason: z.enum(['RECOUNT', 'RETURN', 'DAMAGE', 'PURCHASE', 'OTHER'] as const),
})

/**
 * Schema for a single reservation item
 * Used as part of ReserveInventorySchema
 */
export const ReservationItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid('Invalid variant ID').optional().nullable(),
  quantity: z.coerce
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be a positive number')
    .max(999, 'Quantity cannot exceed 999'),
})

/**
 * Schema for reserving inventory for an order
 * Used in POST /api/inventory/reserve
 */
export const ReserveInventorySchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  items: z
    .array(ReservationItemSchema)
    .min(1, 'At least one item must be provided')
    .max(100, 'Cannot reserve more than 100 different items at once'),
})

/**
 * Schema for confirming an inventory reservation
 * Used in POST /api/inventory/confirm
 */
export const ConfirmReservationSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
})

/**
 * Schema for cancelling an inventory reservation
 * Used in POST /api/inventory/cancel (if needed)
 */
export const CancelReservationSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
})

/**
 * Schema for inventory report filters
 * Used in GET /api/inventory
 */
export const InventoryFilterSchema = z.object({
  lowStock: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  threshold: z.coerce
    .number()
    .int('Threshold must be an integer')
    .positive('Threshold must be a positive number')
    .default(10)
    .optional(),
})

// ============ TYPE EXPORTS ============

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>
export type ReviewFilters = z.infer<typeof ReviewFilterSchema>
export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>
export type ReservationItem = z.infer<typeof ReservationItemSchema>
export type ReserveInventoryInput = z.infer<typeof ReserveInventorySchema>
export type ConfirmReservationInput = z.infer<typeof ConfirmReservationSchema>
export type CancelReservationInput = z.infer<typeof CancelReservationSchema>
export type InventoryFilters = z.infer<typeof InventoryFilterSchema>
