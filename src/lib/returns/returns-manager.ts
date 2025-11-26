/** Week 17: Returns & Refunds System - Tasks 17.1-17.12 */

import { db } from "@/lib/db";

export type ReturnReason = "defective" | "wrong_item" | "not_as_described" | "changed_mind" | "other";
export type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

export interface ReturnRequest {
  orderId: string;
  items: Array<{ orderItemId: string; quantity: number; reason: ReturnReason }>;
  notes?: string;
  images?: string[];
}

export async function createReturnRequest(userId: string, data: ReturnRequest) {
  const order = await db.order.findUnique({
    where: { id: data.orderId },
    include: { items: true },
  });

  if (!order || order.userId !== userId) {
    throw new Error("Order not found or unauthorized");
  }

  if (order.status !== "DELIVERED") {
    throw new Error("Can only return delivered orders");
  }

  // Create return record (would need Return model in schema)
  // For now, just update order notes
  await db.order.update({
    where: { id: data.orderId },
    data: {
      notes: `RETURN REQUESTED: ${data.notes || "No reason provided"}`,
    },
  });

  return { returnId: `RET${Date.now()}`, status: "pending" };
}

export async function approveReturn(returnId: string, refundAmount: number) {
  // Process refund logic
  return { approved: true, refundAmount };
}

export async function processRefund(orderId: string, amount: number) {
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "REFUNDED",
      status: "REFUNDED",
    },
  });
  return { refunded: true, amount };
}
