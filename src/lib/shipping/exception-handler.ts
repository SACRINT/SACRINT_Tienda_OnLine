/**
 * Tracking Exception Handler - Task 16.8
 * Handles shipping exceptions: returned packages, failed deliveries, lost packages
 */

import { db } from "@/lib/db";
import { TrackingInfo } from "./providers/base-provider";

export type ExceptionType =
  | "RETURNED_TO_SENDER"
  | "DELIVERY_FAILED"
  | "AT_RISK"
  | "LOST"
  | "DAMAGED"
  | "ADDRESS_ISSUE"
  | "WEATHER_DELAY"
  | "CUSTOMS_DELAY"
  | "OTHER";

export interface ShippingException {
  type: ExceptionType;
  message: string;
  timestamp: Date;
  requiresAction: boolean;
  suggestedAction?: string;
}

export function detectException(tracking: TrackingInfo): ShippingException | null {
  const lastEvent = tracking.events[tracking.events.length - 1];
  if (!lastEvent) return null;

  const message = lastEvent.message.toLowerCase();
  const status = lastEvent.status.toLowerCase();

  // Returned to sender
  if (message.includes("return") || message.includes("devuelto") || status.includes("returned")) {
    return {
      type: "RETURNED_TO_SENDER",
      message: "Package returned to sender",
      timestamp: lastEvent.timestamp,
      requiresAction: true,
      suggestedAction: "Contact customer to verify address and reship",
    };
  }

  // Delivery failed
  if (
    message.includes("delivery attempt failed") ||
    message.includes("intento de entrega fallido") ||
    message.includes("no one available") ||
    message.includes("nadie disponible")
  ) {
    return {
      type: "DELIVERY_FAILED",
      message: "Delivery attempt failed - recipient not available",
      timestamp: lastEvent.timestamp,
      requiresAction: true,
      suggestedAction: "Contact customer to schedule redelivery",
    };
  }

  // Address issue
  if (
    message.includes("address") ||
    message.includes("dirección") ||
    message.includes("incorrect address")
  ) {
    return {
      type: "ADDRESS_ISSUE",
      message: "Address verification failed or incorrect",
      timestamp: lastEvent.timestamp,
      requiresAction: true,
      suggestedAction: "Contact customer to verify shipping address",
    };
  }

  // Lost package (no update for 7+ days)
  const daysSinceUpdate = (Date.now() - tracking.lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 7 && tracking.status === "in_transit") {
    return {
      type: "AT_RISK",
      message: "No tracking updates for 7+ days - package may be lost",
      timestamp: tracking.lastUpdate,
      requiresAction: true,
      suggestedAction: "File claim with carrier and prepare refund/replacement",
    };
  }

  // Weather delay
  if (message.includes("weather") || message.includes("clima") || message.includes("storm")) {
    return {
      type: "WEATHER_DELAY",
      message: "Delayed due to weather conditions",
      timestamp: lastEvent.timestamp,
      requiresAction: false,
      suggestedAction: "Notify customer of delay - carrier will resume delivery when safe",
    };
  }

  // Customs delay
  if (message.includes("customs") || message.includes("aduana") || message.includes("clearance")) {
    return {
      type: "CUSTOMS_DELAY",
      message: "Delayed in customs clearance",
      timestamp: lastEvent.timestamp,
      requiresAction: false,
      suggestedAction: "Normal for international shipments - may require 1-3 days",
    };
  }

  return null;
}

export async function handleException(
  orderId: string,
  shippingLabelId: string,
  exception: ShippingException,
): Promise<void> {
  console.log(`[EXCEPTION] Handling ${exception.type} for order ${orderId}`);

  // Create order note
  await db.orderNote.create({
    data: {
      orderId,
      content: `🚨 Shipping Exception: ${exception.type}\n\n${exception.message}\n\nSuggested Action: ${exception.suggestedAction || "Monitor status"}`,
      isPublic: false,
      createdBy: "system",
    },
  });

  // Get order and tenant info for notifications
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      tenant: true,
    },
  });

  if (!order) return;

  // Notify customer
  if (exception.requiresAction) {
    await notifyCustomerOfException(order, exception);
  }

  // Alert store owner for critical exceptions
  if (["RETURNED_TO_SENDER", "LOST", "DELIVERY_FAILED"].includes(exception.type)) {
    await alertStoreOwner(order, exception);
  }

  // Auto-actions based on exception type
  switch (exception.type) {
    case "RETURNED_TO_SENDER":
      // Update order status to require attention
      await db.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" }, // Or create custom "RETURN_TO_SENDER" status
      });
      break;

    case "AT_RISK":
      // Flag for investigation
      await db.order.update({
        where: { id: orderId },
        data: {
          adminNotes: `${order.adminNotes || ""}\n\n[${new Date().toISOString()}] Package at risk - no updates for 7+ days`,
        },
      });
      break;

    default:
      // No auto-action needed
      break;
  }
}

async function notifyCustomerOfException(order: any, exception: ShippingException): Promise<void> {
  console.log(
    `[EMAIL] Sending exception notification to ${order.customerEmail || order.customerEmail}`,
  );

  // TODO: Implement email via Resend
  const emailContent = {
    to: order.customerEmail || order.customerEmail,
    subject: `Update on your order ${order.orderNumber}`,
    html: `
      <h2>Shipping Update</h2>
      <p>There's been an update on the delivery of your order ${order.orderNumber}.</p>
      <p><strong>Status:</strong> ${exception.message}</p>
      ${exception.suggestedAction ? `<p><strong>Next Steps:</strong> ${exception.suggestedAction}</p>` : ""}
      <p>We're working to resolve this as quickly as possible. If you have any questions, please contact us.</p>
    `,
  };

  console.log("Email content:", emailContent);
}

async function alertStoreOwner(order: any, exception: ShippingException): Promise<void> {
  console.log(`[ALERT] Notifying store owner of critical exception for order ${order.orderNumber}`);

  // TODO: Send email/SMS to store owner
  // TODO: Create in-app notification
  const alert = {
    tenantId: order.tenantId,
    type: "SHIPPING_EXCEPTION",
    severity: "HIGH",
    message: `Order ${order.orderNumber} has exception: ${exception.type}`,
    action: exception.suggestedAction,
  };

  console.log("Alert:", alert);
}

// Get exception history for an order
export async function getExceptionHistory(orderId: string): Promise<
  Array<{
    timestamp: string;
    type: string;
    message: string;
  }>
> {
  const notes = await db.orderNote.findMany({
    where: {
      orderId,
      content: { contains: "Shipping Exception" },
    },
    orderBy: { createdAt: "desc" },
  });

  return notes.map((note) => ({
    timestamp: note.createdAt.toISOString(),
    type: extractExceptionType(note.content),
    message: note.content,
  }));
}

function extractExceptionType(content: string): string {
  const match = content.match(/Exception: ([A-Z_]+)/);
  return match ? match[1] : "UNKNOWN";
}
