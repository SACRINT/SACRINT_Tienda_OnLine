/**
 * Mercado Pago Webhook Handler
 * Task 14.3: Webhook Handling
 *
 * Recibe notificaciones IPN (Instant Payment Notification) de Mercado Pago
 * para actualizar estados de pagos y suscripciones en tiempo real
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getPaymentStatus,
  mapMPStatusToPaymentStatus,
  mapMPStatusToOrderStatus,
  getSubscription,
} from "@/lib/payments/mercado-pago";

/**
 * POST /api/webhooks/mercado-pago
 *
 * Mercado Pago envía notificaciones con este formato:
 * {
 *   "action": "payment.created" | "payment.updated",
 *   "data": { "id": "123456789" },
 *   "type": "payment"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📩 Mercado Pago Webhook received:", {
      action: body.action,
      type: body.type,
      dataId: body.data?.id,
    });

    // Validar estructura básica
    if (!body.data?.id || !body.type) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Idempotency check
    const existingEvent = await db.webhookEvent.findFirst({
      where: {
        stripeEventId: `mp-${body.type}-${body.data.id}`,
      },
    });

    if (existingEvent) {
      console.log("⚠️ Event already processed (idempotency)");
      return NextResponse.json({ received: true, processed: false });
    }

    // Procesar según tipo de notificación
    switch (body.type) {
      case "payment":
        await handlePaymentNotification(body.data.id);
        break;

      case "preapproval":
        await handleSubscriptionNotification(body.data.id);
        break;

      case "merchant_order":
        await handleMerchantOrderNotification(body.data.id);
        break;

      default:
        console.log(`Unhandled webhook type: ${body.type}`);
    }

    // Marcar como procesado
    await db.webhookEvent.create({
      data: {
        stripeEventId: `mp-${body.type}-${body.data.id}`,
        type: body.action || body.type,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("❌ Mercado Pago webhook error:", error);

    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Maneja notificaciones de pagos
 */
async function handlePaymentNotification(paymentId: string) {
  console.log(`💳 Processing payment notification: ${paymentId}`);

  // Obtener información del pago desde MP API
  const payment = await getPaymentStatus(paymentId);

  // Buscar orden por external_reference o por paymentId
  let order = null;

  if (payment.external_reference) {
    order = await db.order.findUnique({
      where: { id: payment.external_reference },
    });
  }

  if (!order && payment.metadata?.orderId) {
    order = await db.order.findUnique({
      where: { id: payment.metadata.orderId },
    });
  }

  // Si no encontramos orden, buscar por paymentId
  if (!order) {
    order = await db.order.findFirst({
      where: { paymentId: paymentId.toString() },
    });
  }

  if (!order) {
    console.warn(`⚠️ Order not found for payment ${paymentId}`);
    return;
  }

  // Actualizar estado de la orden
  const newPaymentStatus = mapMPStatusToPaymentStatus(payment.status);
  const newOrderStatus = mapMPStatusToOrderStatus(payment.status);

  await db.order.update({
    where: { id: order.id },
    data: {
      paymentId: paymentId.toString(),
      paymentStatus: newPaymentStatus,
      status: newOrderStatus,
    },
  });

  console.log(`✅ Order ${order.id} updated: ${payment.status} -> ${newOrderStatus}`);

  // Si el pago fue aprobado, reducir stock
  if (payment.status === "approved") {
    await processApprovedPayment(order.id);
  }

  // Si fue rechazado o cancelado, restaurar stock si se había reducido
  if (payment.status === "rejected" || payment.status === "cancelled") {
    await processCancelledPayment(order.id);
  }
}

/**
 * Maneja notificaciones de suscripciones (preapproval)
 */
async function handleSubscriptionNotification(preapprovalId: string) {
  console.log(`🔄 Processing subscription notification: ${preapprovalId}`);

  const subscription = await getSubscription(preapprovalId);

  // Actualizar suscripción en BD
  const dbSubscription = await db.subscription.findFirst({
    where: { stripeId: preapprovalId },
  });

  if (!dbSubscription) {
    console.warn(`⚠️ Subscription not found: ${preapprovalId}`);
    return;
  }

  let status: "active" | "canceled" | "incomplete" = "incomplete";
  if (subscription.status === "authorized") status = "active";
  if (subscription.status === "cancelled") status = "canceled";

  await db.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status,
      canceledAt: subscription.status === "cancelled" ? new Date() : null,
    },
  });

  console.log(`✅ Subscription ${preapprovalId} updated: ${subscription.status}`);
}

/**
 * Maneja notificaciones de merchant_order (órdenes de compra)
 */
async function handleMerchantOrderNotification(merchantOrderId: string) {
  console.log(`📦 Processing merchant order notification: ${merchantOrderId}`);

  // Merchant Order es un concepto de MP que agrupa pagos
  // Por ahora solo lo registramos
  // TODO: Implementar lógica específica si es necesario
}

/**
 * Procesa pago aprobado - reduce stock
 */
async function processApprovedPayment(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) return;

  // Reducir stock de cada producto
  for (const item of order.items) {
    if (!item.product) continue;

    await db.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });

    console.log(
      `📉 Stock reduced for product ${item.productId}: -${item.quantity}`
    );
  }

  // TODO: Enviar email de confirmación
  // TODO: Generar factura
}

/**
 * Procesa pago cancelado/rechazado - restaura stock si se había reducido
 */
async function processCancelledPayment(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) return;

  // Solo restaurar si el stock fue reducido previamente
  // (orden estaba en PROCESSING o posterior)
  if (
    order.status !== "PROCESSING" &&
    order.status !== "SHIPPED" &&
    order.status !== "DELIVERED"
  ) {
    return; // No se había reducido stock
  }

  // Restaurar stock
  for (const item of order.items) {
    if (!item.product) continue;

    await db.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity,
        },
      },
    });

    console.log(
      `📈 Stock restored for product ${item.productId}: +${item.quantity}`
    );
  }
}

/**
 * GET handler - Mercado Pago a veces hace validación GET
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "ok",
    service: "mercado-pago-webhooks",
    timestamp: new Date().toISOString(),
  });
}
