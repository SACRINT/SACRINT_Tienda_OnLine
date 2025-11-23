// POST /api/orders/:id/refund
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId
// Process refunds via Stripe

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";
import { db } from "@/lib/db";
import { z } from "zod";
import Stripe from "stripe";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const RefundSchema = z.object({
  amount: z.number().positive().optional(), // If not provided, full refund
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can process refunds
    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not body)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const body = await req.json();
    const validation = RefundSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { amount, reason, note } = validation.data;

    // Get order with payment info
    const order = await db.order.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify order has a payment ID (required for refund)
    if (!order.paymentId) {
      return NextResponse.json({ error: "Order has no payment to refund" }, { status: 400 });
    }

    // Verify order status allows refund
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot refund cancelled order" }, { status: 400 });
    }

    // Note: Full refund tracking not implemented - supporting immediate refund processing only
    // TODO: Implement comprehensive refund tracking and partial refund support

    // Calculate refund amount (default to full order total if not specified)
    const refundAmount = amount || Number(order.total);
    const maxRefundable = Number(order.total);

    if (refundAmount > maxRefundable) {
      return NextResponse.json(
        { error: `Maximum refundable amount is ${maxRefundable / 100}` },
        { status: 400 },
      );
    }

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentId,
      amount: Math.round(refundAmount), // Amount in cents
      reason: reason || "requested_by_customer",
      metadata: {
        orderId: order.id,
        tenantId,
        userId: session.user.id,
        note: note || "",
      },
    });

    // Update order status to CANCELLED if full refund
    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        status: refundAmount >= Number(order.total) ? "CANCELLED" : order.status,
      },
    });

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log("[Refund API] Refund processed", {
      tenantId,
      orderId: params.id,
      userId: session.user.id,
      refundId: refund.id,
      amount: refundAmount,
      reason: reason || "requested_by_customer",
    });

    // Add refund note to order adminNotes
    const refundNote = `[${new Date().toISOString()}] Refund processed: $${(refundAmount / 100).toFixed(2)}. ${note || ""} (Stripe Refund ID: ${refund.id})`;
    const existingNotes = order.adminNotes ? `${order.adminNotes}\n---\n` : "";
    await db.order.update({
      where: { id: params.id },
      data: {
        adminNotes: `${existingNotes}${refundNote}`,
      },
    });

    // TODO: Send refund confirmation email to customer

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
      },
      order: updatedOrder,
    });
  } catch (error: any) {
    logger.error({ error }, "Refund error");

    // Handle Stripe errors
    if (error.type === "StripeCardError" || error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/orders/:id/refund
// Get refund history for an order
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not query params)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    // TODO: Implement refund history tracking - currently returning empty for future implementation
    const formattedRefunds: any[] = [];

    return NextResponse.json({
      refunds: formattedRefunds,
    });
  } catch (error) {
    logger.error({ error }, "Get refunds error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
