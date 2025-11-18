// POST /api/orders/:id/refund
// Process refunds via Stripe

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const RefundSchema = z.object({
  tenantId: z.string().uuid(),
  amount: z.number().positive().optional(), // If not provided, full refund
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
  note: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can process refunds
    if (session.user.role !== 'STORE_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validation = RefundSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, amount, reason, note } = validation.data

    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get order with payment info
    const order = await db.order.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify order has a payment intent
    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Order has no payment to refund' },
        { status: 400 }
      )
    }

    // Verify order status allows refund
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot refund cancelled order' },
        { status: 400 }
      )
    }

    // Check if already refunded
    if (order.refundedAmount && order.refundedAmount >= order.total) {
      return NextResponse.json(
        { error: 'Order already fully refunded' },
        { status: 400 }
      )
    }

    // Calculate refund amount
    const refundAmount = amount || (order.total - (order.refundedAmount || 0))
    const maxRefundable = order.total - (order.refundedAmount || 0)

    if (refundAmount > maxRefundable) {
      return NextResponse.json(
        { error: `Maximum refundable amount is ${maxRefundable / 100}` },
        { status: 400 }
      )
    }

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: Math.round(refundAmount), // Amount in cents
      reason: reason || 'requested_by_customer',
      metadata: {
        orderId: order.id,
        tenantId,
        userId: session.user.id,
        note: note || '',
      },
    })

    // Update order
    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        refundedAmount: (order.refundedAmount || 0) + refundAmount,
        status: refundAmount >= order.total ? 'CANCELLED' : order.status,
      },
    })

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log('[Refund API] Refund processed', {
      tenantId,
      orderId: params.id,
      userId: session.user.id,
      refundId: refund.id,
      amount: refundAmount,
      reason: reason || 'requested_by_customer',
    })

    // Add refund note to order adminNotes
    const refundNote = `[${new Date().toISOString()}] Refund processed: $${(refundAmount / 100).toFixed(2)}. ${note || ''} (Stripe Refund ID: ${refund.id})`
    const existingNotes = order.adminNotes ? `${order.adminNotes}\n---\n` : ''
    await db.order.update({
      where: { id: params.id },
      data: {
        adminNotes: `${existingNotes}${refundNote}`,
      },
    })

    // TODO: Send refund confirmation email to customer

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
      },
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error('Refund error:', error)

    // Handle Stripe errors
    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/orders/:id/refund
// Get refund history for an order
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId required' },
        { status: 400 }
      )
    }

    // TODO: Implement refund history tracking - currently returning empty for future implementation
    const formattedRefunds = []

    return NextResponse.json({
      refunds: formattedRefunds,
    })
  } catch (error) {
    console.error('Get refunds error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
