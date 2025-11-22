/**
 * Mercado Pago Webhook Handler
 * POST /api/webhooks/mercadopago - Handle payment notifications
 * Processes IPN (Instant Payment Notification) from Mercado Pago
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { processWebhookNotification, mapPaymentStatus } from "@/lib/payment/mercadopago";
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

    logger.info(
      {
        type,
        dataId,
      },
      "Mercado Pago webhook received",
    );

    // Ignore test notifications
    if (type === "test") {
      logger.debug("Ignoring Mercado Pago test notification");
      return NextResponse.json({ success: true, message: "Test notification" });
    }

    if (!type || !dataId) {
      logger.warn("Invalid Mercado Pago webhook - missing type or data.id");
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Process the notification
    const result = await processWebhookNotification(type, { id: dataId });

    if (!result.orderId || !result.status) {
      logger.warn(
        {
          type,
          dataId,
          result,
        },
        "Unable to process Mercado Pago webhook",
      );
      return NextResponse.json({ error: "Unable to process notification" }, { status: 400 });
    }

    const { orderId, status: mpStatus, paymentId } = result;

    // Map Mercado Pago status to internal status
    const orderStatus = mapPaymentStatus(mpStatus);

    logger.info(
      {
        orderId,
        mpStatus,
        orderStatus,
        paymentId,
      },
      "Processing Mercado Pago payment status",
    );

    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      logger.error(
        { error: new Error("Order not found"), orderId },
        `Order not found for Mercado Pago webhook: ${orderId}`,
      );
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Handle payment approved
    if (mpStatus === "approved" && order.status !== "PROCESSING") {
      logger.info(
        {
          orderId,
          paymentId,
        },
        "Mercado Pago payment approved, confirming order",
      );

      // Update order status
      await db.order.update({
        where: { id: orderId },
        data: {
          status: "PROCESSING",
          paymentStatus: "COMPLETED",
          paymentId: paymentId || order.paymentId,
        },
      });

      // Find and confirm inventory reservation
      const reservation = await db.inventoryReservation.findFirst({
        where: {
          orderId,
          status: "RESERVED",
        },
      });

      if (reservation) {
        await confirmInventoryReservation(order.tenantId, reservation.id);
        logger.info(
          {
            orderId,
            reservationId: reservation.id,
          },
          "Inventory reservation confirmed for paid order",
        );
      } else {
        logger.warn(
          {
            orderId,
          },
          "No active inventory reservation found for order",
        );
      }

      // TODO: Send order confirmation email
      logger.info(
        {
          orderId,
          orderNumber: order.orderNumber,
          amount: order.total,
        },
        "Order confirmed and paid via Mercado Pago",
      );
    }

    // Handle payment failed
    if ((mpStatus === "rejected" || mpStatus === "failed") && order.status === "PENDING") {
      logger.warn(
        {
          orderId,
          paymentId,
        },
        "Mercado Pago payment failed",
      );

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
          status: "RESERVED",
        },
      });

      if (reservation) {
        await db.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: "CANCELLED" },
        });

        logger.info(
          {
            orderId,
            reservationId: reservation.id,
          },
          "Inventory reservation cancelled for failed payment",
        );
      }
    }

    // Handle payment pending (waiting for customer action)
    if (mpStatus === "pending" && order.status === "PENDING") {
      logger.info(
        {
          orderId,
          paymentId,
        },
        "Mercado Pago payment still pending",
      );

      // No action needed, keep order as PENDING
    }

    // Handle refund
    if (mpStatus === "refunded" && order.status === "PROCESSING") {
      logger.info(
        {
          orderId,
          paymentId,
        },
        "Mercado Pago payment refunded",
      );

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
    logger.error({ error: error }, "Mercado Pago webhook processing error");

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
