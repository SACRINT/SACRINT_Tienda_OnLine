/**
 * UserRole Type Definition
 *
 * This file defines the UserRole type as a type literal instead of importing from @prisma/client.
 * This is necessary in environments where Prisma Client cannot be regenerated (e.g., remote CI/CD).
 *
 * The values MUST match the enum defined in prisma/schema.prisma:
 * enum UserRole {
 *   SUPER_ADMIN
 *   STORE_OWNER
 *   CUSTOMER
 * }
 *
 * TODO: When Prisma Client is regenerated, change back to:
 * export { UserRole } from '@prisma/client'
 */

export type UserRole = 'SUPER_ADMIN' | 'STORE_OWNER' | 'CUSTOMER'

// Inventory Reason Type (from validation schema)
// Used in InventoryLog to track why stock was adjusted
// IMPORTANT: Must match AdjustInventorySchema enum values in /lib/security/schemas/review-schemas.ts
export type InventoryReason = 'RECOUNT' | 'RETURN' | 'DAMAGE' | 'PURCHASE' | 'OTHER'

// Order Status Type (from Zod validation schema)
// enum OrderStatus { PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED }
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

// Payment Status Type (from Prisma schema)
// enum PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED }
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

// Payment Method Type (from Zod validation schema)
// enum PaymentMethod { STRIPE, CREDIT_CARD, BANK_TRANSFER, PAYMENT_ON_DELIVERY, MERCADO_PAGO, PAYPAL, OXXO }
export type PaymentMethod = 'STRIPE' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYMENT_ON_DELIVERY' | 'MERCADO_PAGO' | 'PAYPAL' | 'OXXO'

// Helper to check if a string is a valid UserRole
export function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && ['SUPER_ADMIN', 'STORE_OWNER', 'CUSTOMER'].includes(role)
}

// Constants for cleaner code
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN' as const,
  STORE_OWNER: 'STORE_OWNER' as const,
  CUSTOMER: 'CUSTOMER' as const,
} as const
