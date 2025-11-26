/**
 * Webhook Integration & Event Handling
 * Semana 35, Tarea 35.4: Webhook Integration & Event Handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPaymentOrchestrator } from '@/lib/payments'
import { getAdvancedOrderManager } from '@/lib/payments'
import { logger } from '@/lib/monitoring'
import crypto from 'crypto'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      logger.warn({ type: 'webhook_missing_signature' }, 'Webhook sin firma')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verificar firma del webhook
    const verified = verifyWebhookSignature(body, signature, STRIPE_WEBHOOK_SECRET)
    if (!verified) {
      logger.error({ type: 'webhook_invalid_signature' }, 'Firma de webhook inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)

    // Procesar eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      case 'charge.refunded':
        await handleRefunded(event.data.object)
        break
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object)
        break
      default:
        logger.info({ type: 'webhook_unhandled_event', eventType: event.type }, 'Evento no manejado')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error({ type: 'webhook_error', error: String(error) }, 'Error procesando webhook')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  logger.info(
    { type: 'payment_succeeded_webhook', paymentIntentId: paymentIntent.id },
    `Pago exitoso desde webhook`,
  )

  // Actualizar estado de orden
  const orderManager = getAdvancedOrderManager()
  const orderId = paymentIntent.metadata?.orderId

  if (orderId) {
    const order = orderManager.getOrder(orderId)
    if (order) {
      orderManager.confirmOrder(orderId, paymentIntent.id)
    }
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  logger.warn(
    { type: 'payment_failed_webhook', paymentIntentId: paymentIntent.id },
    `Pago fallido desde webhook`,
  )

  // Notificar al usuario
  const orderId = paymentIntent.metadata?.orderId
  // TODO: Enviar email de pago fallido
}

async function handleRefunded(charge: any) {
  logger.info(
    { type: 'refund_webhook', chargeId: charge.id },
    `Reembolso procesado desde webhook`,
  )

  // TODO: Actualizar estado de reembolso
}

async function handleDisputeCreated(dispute: any) {
  logger.warn(
    { type: 'dispute_webhook', disputeId: dispute.id },
    `Disputa abierta desde webhook`,
  )

  // TODO: Notificar al equipo
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto.createHmac('sha256', secret).update(body).digest('hex')
    return hash === signature
  } catch {
    return false
  }
}
