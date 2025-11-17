// Stripe Webhooks Endpoint
// POST /api/webhooks/stripe - Handles Stripe webhook events
//
// IMPORTANT: This endpoint must be configured in Stripe Dashboard:
// 1. Go to Developers > Webhooks
// 2. Add endpoint: https://yourdomain.com/api/webhooks/stripe
// 3. Select events to listen for:
//    - payment_intent.succeeded
//    - payment_intent.payment_failed
//    - charge.refunded
// 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET env variable

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { handleWebhookEvent } from '@/lib/payment/stripe'
import { db } from '@/lib/db/client'
import { confirmInventoryReservation, cancelInventoryReservation } from '@/lib/db/inventory'
import Stripe from 'stripe'

/**
 * POST /api/webhooks/stripe
 * Processes Stripe webhook events
 *
 * This endpoint handles payment confirmations and failures:
 * - payment_intent.succeeded: Confirms inventory reservation and updates order
 * - payment_intent.payment_failed: Cancels inventory reservation and marks order as failed
 * - charge.refunded: Handles refund processing
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await req.text()

    // Get the Stripe signature from headers
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('[WEBHOOK] Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    // Verify and parse the webhook event
    const event = await handleWebhookEvent(body, signature)

    if (!event) {
      console.error('[WEBHOOK] Invalid webhook signature or event')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Process the event based on type
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        if (!orderId) {
          console.error('[WEBHOOK] No orderId in payment intent metadata')
          return NextResponse.json(
            { error: 'Missing orderId in metadata' },
            { status: 400 }
          )
        }

        console.log(`[WEBHOOK] Payment succeeded for order: ${orderId}`)

        // Get the order to extract tenantId and reservationId
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: {
            inventoryReservations: {
              where: { status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })

        if (!order) {
          console.error(`[WEBHOOK] Order not found: ${orderId}`)
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          )
        }

        const reservationId = order.inventoryReservations[0]?.id

        if (!reservationId) {
          console.error(`[WEBHOOK] No pending inventory reservation found for order: ${orderId}`)
          // Continue anyway, just update order status
        }

        try {
          // Confirm inventory reservation (deducts actual stock)
          if (reservationId) {
            await confirmInventoryReservation(order.tenantId, reservationId)
            console.log(`[WEBHOOK] Inventory confirmed for reservation: ${reservationId}`)
          }

          // Update order status to PROCESSING and payment status to COMPLETED
          await db.order.update({
            where: { id: orderId },
            data: {
              status: 'PROCESSING',
              paymentStatus: 'COMPLETED',
              paymentId: paymentIntent.id,
            },
          })

          console.log(`[WEBHOOK] Order ${orderId} updated to PROCESSING`)

          // TODO: Send order confirmation email here (Week 2 - Email task)

          return NextResponse.json({
            received: true,
            orderId,
            status: 'success',
          })
        } catch (error) {
          console.error(`[WEBHOOK] Error processing payment success for order ${orderId}:`, error)

          // Log the error but return 200 to Stripe to prevent retries
          // We'll handle this manually
          return NextResponse.json({
            received: true,
            orderId,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId
        const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error'

        if (!orderId) {
          console.error('[WEBHOOK] No orderId in payment intent metadata')
          return NextResponse.json(
            { error: 'Missing orderId in metadata' },
            { status: 400 }
          )
        }

        console.error(`[WEBHOOK] Payment failed for order: ${orderId}, reason: ${errorMessage}`)

        // Get the order to extract tenantId and reservationId
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: {
            inventoryReservations: {
              where: { status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })

        if (!order) {
          console.error(`[WEBHOOK] Order not found: ${orderId}`)
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          )
        }

        const reservationId = order.inventoryReservations[0]?.id

        try {
          // Cancel inventory reservation (releases reserved stock)
          if (reservationId) {
            await cancelInventoryReservation(order.tenantId, reservationId)
            console.log(`[WEBHOOK] Inventory reservation cancelled: ${reservationId}`)
          }

          // Update order status to CANCELLED and payment status to FAILED
          await db.order.update({
            where: { id: orderId },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'FAILED',
              adminNotes: `Payment failed: ${errorMessage}`,
            },
          })

          console.log(`[WEBHOOK] Order ${orderId} marked as CANCELLED due to payment failure`)

          // TODO: Send payment failure email here (Week 2 - Email task)

          return NextResponse.json({
            received: true,
            orderId,
            status: 'failed',
          })
        } catch (error) {
          console.error(`[WEBHOOK] Error processing payment failure for order ${orderId}:`, error)

          return NextResponse.json({
            received: true,
            orderId,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        console.log(`[WEBHOOK] Refund processed for charge: ${charge.id}`)

        // Find order by payment intent ID
        const order = await db.order.findFirst({
          where: { paymentId: paymentIntentId },
        })

        if (!order) {
          console.error(`[WEBHOOK] Order not found for payment intent: ${paymentIntentId}`)
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          )
        }

        try {
          // Update order status to REFUNDED
          await db.order.update({
            where: { id: order.id },
            data: {
              status: 'REFUNDED',
              paymentStatus: 'REFUNDED',
              adminNotes: `Refunded on ${new Date().toISOString()}`,
            },
          })

          console.log(`[WEBHOOK] Order ${order.id} marked as REFUNDED`)

          // TODO: Send refund confirmation email here

          return NextResponse.json({
            received: true,
            orderId: order.id,
            status: 'refunded',
          })
        } catch (error) {
          console.error(`[WEBHOOK] Error processing refund for order ${order.id}:`, error)

          return NextResponse.json({
            received: true,
            orderId: order.id,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`)
        return NextResponse.json({
          received: true,
          type: event.type,
          status: 'ignored',
        })
    }
  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Disable body parser for raw body access (required for Stripe signature verification)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
