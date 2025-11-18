// Coupon Validation API
// POST /api/coupons/validate - Validate and calculate coupon discount

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { z } from 'zod'
import { db } from '@/lib/db/client'

// Coupon validation schema
const CouponValidationSchema = z.object({
  tenantId: z.string().uuid(),
  code: z.string().min(1).max(50),
  cartTotal: z.number().positive(),
  userId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
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

    const { tenantId, code, cartTotal } = validation.data

    // Find coupon by code and tenant
    const coupon = await db.coupon.findFirst({
      where: {
        tenantId,
        code: code.toUpperCase(),
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

    // Check minimum purchase requirement
    if (coupon.minPurchase && cartTotal < Number(coupon.minPurchase)) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'MIN_PURCHASE_NOT_MET',
          message: `Minimum purchase of $${Number(coupon.minPurchase).toFixed(2)} required`,
          required: Number(coupon.minPurchase),
          current: cartTotal,
        },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0

    if (coupon.type === 'PERCENTAGE') {
      // Percentage discount
      discountAmount = cartTotal * (Number(coupon.value) / 100)

      // Apply max discount cap if exists
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount)
      }
    } else if (coupon.type === 'FIXED') {
      // Fixed amount discount
      discountAmount = Number(coupon.value)

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
          value: Number(coupon.value),
          description: coupon.description,
        },
        discount: {
          amount: parseFloat(discountAmount.toFixed(2)),
          percentage:
            coupon.type === 'PERCENTAGE'
              ? Number(coupon.value)
              : parseFloat(((discountAmount / cartTotal) * 100).toFixed(2)),
        },
        totals: {
          subtotal: parseFloat(cartTotal.toFixed(2)),
          discount: parseFloat(discountAmount.toFixed(2)),
          total: parseFloat(finalTotal.toFixed(2)),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Coupon validation error:', error)

    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
