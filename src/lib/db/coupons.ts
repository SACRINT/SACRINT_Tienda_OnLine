// Data Access Layer - Coupons
// Database operations for coupon/discount management with tenant isolation

import { db } from './client'
import { ensureTenantAccess } from './tenant'

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT'
export type CouponStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

/**
 * Get all coupons for a tenant
 * @param tenantId - Tenant ID to validate access
 * @param filters - Optional filters (status, type)
 */
export async function getCouponsByTenant(
  tenantId: string,
  filters?: {
    status?: CouponStatus
    type?: CouponType
    includeExpired?: boolean
  }
) {
  await ensureTenantAccess(tenantId)

  const where: any = {
    tenantId,
  }

  if (filters?.status) {
    where.isActive = filters.status === 'ACTIVE'
  }

  if (filters?.type) {
    where.type = filters.type
  }

  if (!filters?.includeExpired) {
    where.expiresAt = {
      gte: new Date(),
    }
  }

  return db.coupon.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get coupon by ID with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param couponId - Coupon ID to retrieve
 */
export async function getCouponById(tenantId: string, couponId: string) {
  await ensureTenantAccess(tenantId)

  return db.coupon.findFirst({
    where: {
      id: couponId,
      tenantId,
    },
  })
}

/**
 * Get coupon by code with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param code - Coupon code to retrieve
 */
export async function getCouponByCode(tenantId: string, code: string) {
  await ensureTenantAccess(tenantId)

  return db.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      tenantId,
    },
  })
}

/**
 * Validate and get coupon by code
 * Checks if coupon is active, not expired, and has usage remaining
 * @param tenantId - Tenant ID to validate access
 * @param code - Coupon code to validate
 * @param orderTotal - Order total to validate minimum purchase
 * @returns Validated coupon or null if invalid
 */
export async function validateCoupon(
  tenantId: string,
  code: string,
  orderTotal: number
) {
  await ensureTenantAccess(tenantId)

  const coupon = await db.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      tenantId,
      isActive: true,
    },
  })

  if (!coupon) {
    throw new Error('Coupon not found or inactive')
  }

  // Check if expired
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error('Coupon has expired')
  }

  // Check if usage limit reached
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new Error('Coupon usage limit reached')
  }

  // Check minimum purchase amount
  if (coupon.minPurchase && orderTotal < coupon.minPurchase) {
    throw new Error(`Minimum purchase amount is $${coupon.minPurchase}`)
  }

  return coupon
}

/**
 * Calculate discount amount for a coupon
 * @param coupon - Coupon to calculate discount for
 * @param orderTotal - Order total to calculate discount from
 * @returns Discount amount
 */
export function calculateDiscount(
  coupon: {
    type: string
    discount: number
    maxDiscount?: number | null
  },
  orderTotal: number
): number {
  let discountAmount = 0

  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (orderTotal * coupon.discount) / 100

    // Apply max discount limit if set
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }
  } else if (coupon.type === 'FIXED_AMOUNT') {
    discountAmount = coupon.discount

    // Discount cannot exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal
    }
  }

  return Math.round(discountAmount * 100) / 100 // Round to 2 decimals
}

/**
 * Create new coupon with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param data - Coupon data to create
 */
export async function createCoupon(tenantId: string, data: {
  code: string
  type: CouponType
  discount: number
  maxDiscount?: number | null
  minPurchase?: number | null
  maxUses?: number | null
  expiresAt?: Date | null
  description?: string | null
}) {
  await ensureTenantAccess(tenantId)

  // Check if code already exists
  const existing = await db.coupon.findFirst({
    where: {
      code: data.code.toUpperCase(),
      tenantId,
    },
  })

  if (existing) {
    throw new Error('Coupon code already exists')
  }

  return db.coupon.create({
    data: {
      ...data,
      code: data.code.toUpperCase(),
      tenantId,
      isActive: true,
      usedCount: 0,
    },
  })
}

/**
 * Update coupon with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param couponId - Coupon ID to update
 * @param data - Update data
 */
export async function updateCoupon(
  tenantId: string,
  couponId: string,
  data: {
    isActive?: boolean
    discount?: number
    maxDiscount?: number | null
    minPurchase?: number | null
    maxUses?: number | null
    expiresAt?: Date | null
    description?: string | null
  }
) {
  await ensureTenantAccess(tenantId)

  // Verify coupon belongs to tenant
  const coupon = await db.coupon.findFirst({
    where: { id: couponId, tenantId },
  })

  if (!coupon) {
    throw new Error('Coupon not found or does not belong to tenant')
  }

  return db.coupon.update({
    where: { id: couponId },
    data,
  })
}

/**
 * Delete coupon with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param couponId - Coupon ID to delete
 */
export async function deleteCoupon(tenantId: string, couponId: string) {
  await ensureTenantAccess(tenantId)

  // Verify coupon belongs to tenant
  const coupon = await db.coupon.findFirst({
    where: { id: couponId, tenantId },
  })

  if (!coupon) {
    throw new Error('Coupon not found or does not belong to tenant')
  }

  return db.coupon.delete({
    where: { id: couponId },
  })
}

/**
 * Increment coupon usage count
 * Called when an order is placed with a coupon
 * @param couponId - Coupon ID to increment usage
 */
export async function incrementCouponUsage(couponId: string) {
  return db.coupon.update({
    where: { id: couponId },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  })
}

/**
 * Get coupon usage statistics
 * @param tenantId - Tenant ID to validate access
 * @param couponId - Coupon ID to get stats for
 */
export async function getCouponStats(tenantId: string, couponId: string) {
  await ensureTenantAccess(tenantId)

  const coupon = await db.coupon.findFirst({
    where: { id: couponId, tenantId },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  if (!coupon) {
    throw new Error('Coupon not found or does not belong to tenant')
  }

  // Calculate total revenue from coupon usage
  const ordersWithCoupon = await db.order.findMany({
    where: {
      couponCode: coupon.code,
      tenantId,
    },
    select: {
      discount: true,
      total: true,
    },
  })

  const totalDiscountGiven = ordersWithCoupon.reduce(
    (sum, order) => sum + order.discount,
    0
  )

  const totalRevenue = ordersWithCoupon.reduce(
    (sum, order) => sum + order.total,
    0
  )

  return {
    coupon,
    usageCount: coupon._count.orders,
    totalDiscountGiven,
    totalRevenue,
    averageOrderValue: ordersWithCoupon.length > 0 ? totalRevenue / ordersWithCoupon.length : 0,
  }
}
