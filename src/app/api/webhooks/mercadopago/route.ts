/**
 * Mercado Pago Webhook Handler
 * POST /api/webhooks/mercadopago - Handle payment notifications
 * Processes IPN (Instant Payment Notification) from Mercado Pago
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  processWebhookNotification,
  mapPaymentStatus,
} from "@/lib/payment/mercadopago";
import { confirmInventoryReservation } from "@/lib/db/inventory";
import { logger } from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/mercadopago
 * Handles Mercado Pago payment notifications
 *
 * Notification types:
 * - payment: Payment status changed
 * - merchant_order: Order status changed
 * - test: Test notification (ignore)
 */
export async function POST(req: NextRequest) {
  try {
    // Mercado Pago sends notifications as query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const dataId = searchParams.get("data.id") ?? searchParams.get("id");

    logger.info("Mercado Pago webhook received", {
      type,
      dataId,
    });

    // Ignore test notifications
    if (type === "test") {
      logger.debug("Ignoring Mercado Pago test notification");
      return NextResponse.json({ success: true, message: "Test notification" });
    }

    if (!type || !dataId) {
      logger.warn("Invalid Mercado Pago webhook - missing type or data.id");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Process the notification
    const result = await processWebhookNotification(type, { id: dataId });

    if (!result.orderId || !result.status) {
      logger.warn("Unable to process Mercado Pago webhook", {
        type,
        dataId,
        result,
      });
      return NextResponse.json(
        { error: "Unable to process notification" },
        { status: 400 },
      );
    }

    const { orderId, status: mpStatus, paymentId } = result;

    // Map Mercado Pago status to internal status
    const orderStatus = mapPaymentStatus(mpStatus);

    logger.info("Processing Mercado Pago payment status", {
      orderId,
      mpStatus,
      orderStatus,
      paymentId,
    });

    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      logger.error(`Order not found for Mercado Pago webhook: ${orderId}`, new Error("Order not found"));
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    // Handle payment approved
    if (orderStatus === "PAID" && order.status !== "PAID") {
      logger.info("Mercado Pago payment approved, confirming order", {
        orderId,
        paymentId,
      });

      // Update order status
      await db.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentIntentId: paymentId || order.paymentIntentId,
        },
      });

      // Find and confirm inventory reservation
      const reservation = await db.inventoryReservation.findFirst({
        where: {
          orderId,
          status: "ACTIVE",
        },
      });

      if (reservation) {
        await confirmInventoryReservation(order.tenantId, reservation.id);
        logger.info("Inventory reservation confirmed for paid order", {
          orderId,
          reservationId: reservation.id,
        });
      } else {
        logger.warn("No active inventory reservation found for order", {
          orderId,
        });
      }

      // TODO: Send order confirmation email
      logger.info("Order confirmed and paid via Mercado Pago", {
        orderId,
        orderNumber: order.orderNumber,
        amount: order.total,
      });
    }

    // Handle payment failed
    if (orderStatus === "FAILED" && order.status === "PENDING") {
      logger.warn("Mercado Pago payment failed", {
        orderId,
        paymentId,
      });

      await db.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
        },
      });

      // Cancel inventory reservation
      const reservation = await db.inventoryReservation.findFirst({
        where: {
          orderId,
          status: "ACTIVE",
        },
      });

      if (reservation) {
        await db.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: "CANCELLED" },
        });

        logger.info("Inventory reservation cancelled for failed payment", {
          orderId,
          reservationId: reservation.id,
        });
      }
    }

    // Handle payment pending (waiting for customer action)
    if (orderStatus === "PENDING" && order.status === "PENDING") {
      logger.info("Mercado Pago payment still pending", {
        orderId,
        paymentId,
      });

      // No action needed, keep order as PENDING
    }

    // Handle refund
    if (orderStatus === "REFUNDED" && order.status === "PAID") {
      logger.info("Mercado Pago payment refunded", {
        orderId,
        paymentId,
      });

      await db.order.update({
        where: { id: orderId },
        data: {
          status: "REFUNDED",
        },
      });

      // TODO: Restore inventory if needed
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: orderStatus,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    logger.error("Mercado Pago webhook processing error", error as Error);

    // Return 200 to prevent Mercado Pago from retrying
    // Log the error for investigation
    return NextResponse.json(
      {
        success: false,
        error: "Internal error processing webhook",
      },
      { status: 200 }, // Return 200 to acknowledge receipt
    );
  }
}

/**
 * GET /api/webhooks/mercadopago
 * Test endpoint to verify webhook URL is accessible
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Mercado Pago webhook endpoint is active",
  });
}
