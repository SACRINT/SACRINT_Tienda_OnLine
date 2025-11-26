/**
 * Tracking Updates Cron Job - Task 16.7
 * Updates tracking information for all in-transit orders
 * Run every 6 hours via Vercel Cron or similar
 */

import { db } from "@/lib/db";
import { getProvider } from "@/lib/shipping/provider-manager";
import { TrackingInfo } from "@/lib/shipping/providers/base-provider";

export async function updateTrackingForAllOrders(): Promise<{
  processed: number;
  updated: number;
  delivered: number;
  errors: number;
}> {
  console.log("[CRON] Starting tracking update job...");

  const stats = {
    processed: 0,
    updated: 0,
    delivered: 0,
    errors: 0,
  };

  try {
    // Get all orders with active shipping (PROCESSING, SHIPPED status)
    const ordersWithTracking = await db.order.findMany({
      where: {
        status: { in: ["PROCESSING", "SHIPPED"] },
        shippingLabels: {
          some: {
            isReturnLabel: false,
          },
        },
      },
      include: {
        shippingLabels: {
          where: {
            isReturnLabel: false,
          },
          take: 1, // Get primary label
        },
      },
    });

    console.log(`[CRON] Found ${ordersWithTracking.length} orders to update`);

    for (const order of ordersWithTracking) {
      stats.processed++;

      const shippingLabel = order.shippingLabels[0];
      if (!shippingLabel) continue;

      try {
        // Get provider and fetch tracking
        const provider = getProvider(shippingLabel.provider);
        const tracking = await provider.getTracking(shippingLabel.trackingNumber);

        // Update shipping label with tracking data
        await db.shippingLabel.update({
          where: { id: shippingLabel.id },
          data: {
            status: tracking.status,
            lastUpdate: tracking.lastUpdate,
            trackingEvents: tracking.events as any,
          },
        });

        stats.updated++;

        // Update order status based on tracking
        const previousStatus = shippingLabel.status;
        const newStatus = tracking.status;

        // If delivered, update order status
        if (newStatus === "delivered" && order.status !== "DELIVERED") {
          await db.order.update({
            where: { id: order.id },
            data: { status: "DELIVERED" },
          });
          stats.delivered++;

          // Notify customer of delivery
          await notifyCustomerOfDelivery(order);
        }

        // If in_transit and order still in PROCESSING, update to SHIPPED
        if (newStatus === "in_transit" && order.status === "PROCESSING") {
          await db.order.update({
            where: { id: order.id },
            data: { status: "SHIPPED" },
          });
        }

        // If exception, handle it
        if (newStatus === "exception") {
          await handleTrackingException(order, shippingLabel, tracking);
        }

        // Notify if status changed
        if (previousStatus !== newStatus) {
          await notifyCustomerOfTrackingUpdate(order, tracking);
        }
      } catch (error) {
        console.error(`[CRON] Error updating tracking for order ${order.id}:`, error);
        stats.errors++;
      }
    }

    console.log("[CRON] Tracking update completed:", stats);
    return stats;
  } catch (error) {
    console.error("[CRON] Fatal error in tracking update job:", error);
    throw error;
  }
}

// Helper: Notify customer of delivery
async function notifyCustomerOfDelivery(order: any): Promise<void> {
  console.log(`[NOTIFICATION] Order ${order.orderNumber} delivered`);
  // TODO: Send email via Resend
  // TODO: Push notification if applicable
}

// Helper: Notify customer of tracking update
async function notifyCustomerOfTrackingUpdate(order: any, tracking: TrackingInfo): Promise<void> {
  console.log(`[NOTIFICATION] Tracking update for order ${order.orderNumber}: ${tracking.status}`);
  // TODO: Send email with tracking update
}

// Helper: Handle tracking exceptions
async function handleTrackingException(order: any, shippingLabel: any, tracking: TrackingInfo): Promise<void> {
  console.log(`[EXCEPTION] Tracking exception for order ${order.orderNumber}`);

  // Create order note
  await db.orderNote.create({
    data: {
      orderId: order.id,
      content: `Shipping exception detected: ${tracking.events[tracking.events.length - 1]?.message || "Unknown exception"}`,
      isPublic: false,
      createdBy: "system", // System user ID
    },
  });

  // TODO: Alert store owner
  // TODO: Send customer notification
}

// Export as API route for manual triggering
export async function runTrackingUpdateJob(): Promise<void> {
  await updateTrackingForAllOrders();
}
