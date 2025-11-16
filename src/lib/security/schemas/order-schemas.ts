// Order, Cart and Checkout Validation Schemas
// Complete Zod schemas for Sprint 3 - Cart, Checkout & Orders

import { z } from 'zod'

// ============ CART SCHEMAS ============

export const AddCartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid('Invalid variant ID').optional().nullable(),
  quantity: z.coerce
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(99, 'Quantity cannot exceed 99'),
})

export const UpdateCartItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(99, 'Quantity cannot exceed 99'),
})

// ============ CHECKOUT SCHEMAS ============

export const CheckoutSchema = z.object({
  cartId: z.string().uuid('Invalid cart ID'),
  shippingAddressId: z.string().uuid('Invalid shipping address ID'),
  billingAddressId: z
    .string()
    .uuid('Invalid billing address ID')
    .optional()
    .nullable(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'STRIPE', 'PAYPAL'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  couponCode: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code must not exceed 50 characters')
    .toUpperCase()
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
})

// ============ ORDER SCHEMAS ============

export const OrderFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ])
    .optional(),
  paymentStatus: z
    .enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'])
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  customerId: z.string().uuid('Invalid customer ID').optional(),
  sort: z
    .enum([
      'date-desc',
      'date-asc',
      'total-desc',
      'total-asc',
      'status-asc',
      'status-desc',
    ])
    .default('date-desc'),
})

export const OrderStatusUpdateSchema = z.object({
  status: z.enum([
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  trackingNumber: z
    .string()
    .min(5, 'Tracking number must be at least 5 characters')
    .max(100, 'Tracking number must not exceed 100 characters')
    .optional(),
  adminNotes: z
    .string()
    .max(1000, 'Admin notes must not exceed 1000 characters')
    .optional(),
})

export const RefundSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.coerce
    .number()
    .positive('Refund amount must be positive')
    .optional(), // If not provided, refund full amount
  reason: z
    .string()
    .min(10, 'Refund reason must be at least 10 characters')
    .max(500, 'Refund reason must not exceed 500 characters'),
})

// ============ ADDRESS SCHEMAS ============

export const CreateAddressSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  phone: z
    .string()
    .regex(
      /^(\+?\d{1,3})?[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{4}$/,
      'Invalid phone number'
    ),
  street: z
    .string()
    .min(5, 'Street address must be at least 5 characters')
    .max(255, 'Street address must not exceed 255 characters'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State must not exceed 100 characters'),
  postalCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code (format: 12345 or 12345-6789)'),
  country: z
    .string()
    .length(2, 'Country must be 2-letter ISO code')
    .toUpperCase()
    .default('MX'),
})

export const UpdateAddressSchema = CreateAddressSchema.partial()

// ============ TYPE EXPORTS ============

export type AddCartItemInput = z.infer<typeof AddCartItemSchema>
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>
export type CheckoutInput = z.infer<typeof CheckoutSchema>
export type OrderFilters = z.infer<typeof OrderFilterSchema>
export type OrderStatusUpdate = z.infer<typeof OrderStatusUpdateSchema>
export type RefundInput = z.infer<typeof RefundSchema>
export type CreateAddressInput = z.infer<typeof CreateAddressSchema>
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>
