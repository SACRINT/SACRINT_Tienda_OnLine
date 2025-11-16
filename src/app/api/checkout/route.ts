// Checkout API
// POST /api/checkout - Process checkout and create order with payment

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { createOrder } from '@/lib/db/orders'
import { validateCartBeforeCheckout, getCartTotal } from '@/lib/db/cart'
import { createPaymentIntent } from '@/lib/payment/stripe'
import { CheckoutSchema } from '@/lib/security/schemas/order-schemas'

/**
 * POST /api/checkout
 * Processes checkout flow:
 * 1. Validates cart
 * 2. Creates Stripe Payment Intent
 * 3. Returns client secret for frontend
 * 4. Order is created after payment confirmation via webhook or confirmation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validation = CheckoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      cartId,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      couponCode,
      notes,
    } = validation.data

    // Validate cart before checkout
    const validationResult = await validateCartBeforeCheckout(cartId)

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: 'Cart validation failed',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        },
        { status: 400 }
      )
    }

    // Get cart total
    const totals = await getCartTotal(cartId, 99, 0.16) // $9.99 shipping, 16% tax

    // For Stripe payments, create Payment Intent
    if (paymentMethod === 'STRIPE' || paymentMethod === 'CREDIT_CARD') {
      try {
        const paymentIntent = await createPaymentIntent(
          `cart_${cartId}`,
          Math.round(totals.total * 100), // Convert to cents
          'usd',
          session.user.email || ''
        )

        // Return Payment Intent client secret for frontend to complete payment
        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.clientSecret,
          paymentIntentId: paymentIntent.paymentIntentId,
          amount: totals.total,
          message: 'Payment Intent created. Complete payment on frontend.',
        })
      } catch (error) {
        console.error('[CHECKOUT] Stripe error:', error)

        return NextResponse.json(
          {
            error: 'Failed to create payment intent',
            message:
              error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // For other payment methods (non-Stripe), create order directly
    // This would be for payment on delivery, bank transfer, etc.
    try {
      const order = await createOrder({
        userId: session.user.id,
        tenantId,
        cartId,
        shippingAddressId,
        billingAddressId,
        paymentMethod,
        couponCode,
        notes,
      })

      console.log('[CHECKOUT] Order created:', order?.id)

      return NextResponse.json({
        success: true,
        orderId: order?.id,
        orderNumber: order?.orderNumber,
        total: totals.total,
        message: 'Order created successfully',
      })
    } catch (error) {
      console.error('[CHECKOUT] Order creation error:', error)

      return NextResponse.json(
        {
          error: 'Failed to create order',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[CHECKOUT] POST error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
