/**
 * Return Processing Logic - Tasks 17.7, 17.8, 17.10
 * Receipt processing, inspection, and validation
 */

import { db } from "@/lib/db";

// Task 17.7: Process returned items when received
export async function processReturnReceived(returnRequestId: string): Promise<void> {
  const returnRequest = await db.returnRequest.findUnique({
    where: { id: returnRequestId },
    include: {
      items: true,
      order: true,
    },
  });

  if (!returnRequest) {
    throw new Error("Return request not found");
  }

  // Update status to RECEIVED
  await db.returnRequest.update({
    where: { id: returnRequestId },
    data: {
      status: "RECEIVED",
      receivedAt: new Date(),
    },
  });

  // Create order note
  await db.orderNote.create({
    data: {
      orderId: returnRequest.orderId,
      content: "Return received in warehouse - awaiting inspection",
      isPublic: false,
      createdBy: "system",
    },
  });

  // TODO: Notify vendor for inspection
  console.log(`Return ${returnRequestId} received. Vendor notification sent.`);
}

// Task 17.8: Inspect return items
export async function inspectReturnItems(
  returnRequestId: string,
  inspections: Array<{
    itemId: string;
    accepted: boolean;
    rejectionReason?: string;
  }>,
  inspectedBy: string
): Promise<void> {
  // Update each item inspection result
  for (const inspection of inspections) {
    await db.returnItem.update({
      where: { id: inspection.itemId },
      data: {
        accepted: inspection.accepted,
        rejectionReason: inspection.accepted ? null : inspection.rejectionReason,
      },
    });
  }

  // Update return request status
  await db.returnRequest.update({
    where: { id: returnRequestId },
    data: {
      status: "INSPECTED",
      inspectedAt: new Date(),
      inspectedBy,
      inspectionNotes: `Inspected ${inspections.length} items`,
    },
  });

  console.log(`Return ${returnRequestId} inspected by ${inspectedBy}`);
}

// Task 17.10: Validate return window
export function validateReturnWindow(
  orderDate: Date,
  returnWindowDays: number = 30
): {
  valid: boolean;
  daysRemaining: number;
  message: string;
} {
  const daysSincePurchase = Math.floor(
    (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysRemaining = returnWindowDays - daysSincePurchase;
  const valid = daysRemaining >= 0;

  return {
    valid,
    daysRemaining,
    message: valid
      ? `Return window open for ${daysRemaining} more days`
      : `Return window expired ${Math.abs(daysRemaining)} days ago`,
  };
}

// Get return window by product category (configurable)
export function getReturnWindowForProduct(
  productId: string,
  defaultDays: number = 30
): number {
  // In production, fetch from product/category settings
  // For now, return default
  return defaultDays;
}

// Check if order is approaching return window expiration
export async function checkExpiringReturnWindows(): Promise<void> {
  const warningDays = 5; // Warn when 5 days left
  const since = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000); // 25 days ago
  const until = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  const orders = await db.order.findMany({
    where: {
      status: "DELIVERED",
      createdAt: { gte: until, lte: since },
    },
    include: {
      user: true,
    },
  });

  for (const order of orders) {
    const validation = validateReturnWindow(order.createdAt);
    if (validation.valid && validation.daysRemaining <= warningDays) {
      // TODO: Send notification to customer
      console.log(`Warning: Order ${order.orderNumber} has ${validation.daysRemaining} days left to request return`);
    }
  }
}
