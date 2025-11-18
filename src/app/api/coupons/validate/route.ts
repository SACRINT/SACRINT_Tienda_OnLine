// Coupon Validation API
// POST /api/coupons/validate - Validate and calculate coupon discount

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { z } from 'zod'
import { db } from '@/lib/db/client'

// Coupon validation schema
const CouponValidationSchema = z.object({
  tenantId: z.string().uuid(),
  code: z.string().min(1).max(50).toUpperCase(),
  cartTotal: z.number().positive(),
  userId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        categoryId: z.string().optional(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .min(1),
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate user (optional - allow guest checkout)
    const session = await auth()

    // Parse and validate request body
    const body = await req.json()
    const validation = CouponValidationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { tenantId, code, cartTotal, userId, items } = validation.data

    // Verify tenant access (if authenticated)
    if (session?.user?.tenantId && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find coupon by code and tenant
    const coupon = await db.coupon.findFirst({
      where: {
        tenantId,
        code: code.toUpperCase(),
        isActive: true,
      },
      include: {
        // Include usage tracking if needed
        _count: {
          select: {
            orders: true, // Count how many times this coupon was used
          },
        },
      },
    })

    // Coupon not found
    if (!coupon) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'INVALID_CODE',
          message: 'Invalid coupon code',
        },
        { status: 400 }
      )
    }

    // Check if coupon is inactive
    if (!coupon.isActive) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'INACTIVE',
          message: 'This coupon is no longer active',
        },
        { status: 400 }
      )
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'EXPIRED',
          message: 'This coupon has expired',
          expiresAt: coupon.expiresAt,
        },
        { status: 400 }
      )
    }

    // Check if coupon has reached max uses
    if (coupon.maxUses && coupon._count.orders >= coupon.maxUses) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'MAX_USES_REACHED',
          message: 'This coupon has reached its usage limit',
        },
        { status: 400 }
      )
    }

    // Check minimum purchase requirement
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'MIN_PURCHASE_NOT_MET',
          message: `Minimum purchase of $${coupon.minPurchase.toFixed(2)} required`,
          required: coupon.minPurchase,
          current: cartTotal,
          remaining: coupon.minPurchase - cartTotal,
        },
        { status: 400 }
      )
    }

    // Check if user has already used this coupon (if user-specific validation needed)
    if (userId && coupon.maxUsesPerUser) {
      const userUsageCount = await db.order.count({
        where: {
          tenantId,
          userId,
          couponId: coupon.id,
        },
      })

      if (userUsageCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          {
            isValid: false,
            error: 'USER_LIMIT_REACHED',
            message: 'You have already used this coupon the maximum number of times',
          },
          { status: 400 }
        )
      }
    }

    // Check category restrictions (if applicable)
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const hasApplicableItems = items.some((item) =>
        coupon.applicableCategories?.includes(item.categoryId || '')
      )

      if (!hasApplicableItems) {
        return NextResponse.json(
          {
            isValid: false,
            error: 'CATEGORY_MISMATCH',
            message: 'This coupon is not applicable to items in your cart',
          },
          { status: 400 }
        )
      }
    }

    // Check product restrictions (if applicable)
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicableItems = items.some((item) =>
        coupon.applicableProducts?.includes(item.productId)
      )

      if (!hasApplicableItems) {
        return NextResponse.json(
          {
            isValid: false,
            error: 'PRODUCT_MISMATCH',
            message: 'This coupon is not applicable to items in your cart',
          },
          { status: 400 }
        )
      }
    }

    // Calculate discount amount
    let discountAmount = 0

    if (coupon.type === 'PERCENTAGE') {
      // Percentage discount
      discountAmount = cartTotal * (coupon.value / 100)

      // Apply max discount cap if exists
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else if (coupon.type === 'FIXED') {
      // Fixed amount discount
      discountAmount = coupon.value

      // Discount cannot exceed cart total
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal
      }
    }

    // Calculate final total
    const finalTotal = cartTotal - discountAmount

    // Return successful validation
    return NextResponse.json(
      {
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description,
        },
        discount: {
          amount: parseFloat(discountAmount.toFixed(2)),
          percentage:
            coupon.type === 'PERCENTAGE'
              ? coupon.value
              : parseFloat(((discountAmount / cartTotal) * 100).toFixed(2)),
        },
        totals: {
          subtotal: parseFloat(cartTotal.toFixed(2)),
          discount: parseFloat(discountAmount.toFixed(2)),
          total: parseFloat(finalTotal.toFixed(2)),
        },
        metadata: {
          expiresAt: coupon.expiresAt,
          remainingUses:
            coupon.maxUses && coupon.maxUses > 0
              ? coupon.maxUses - coupon._count.orders
              : null,
          minPurchase: coupon.minPurchase,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Coupon validation error:', error)

    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Prisma')) {
        return NextResponse.json(
          { error: 'Database error', message: 'Failed to validate coupon' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
