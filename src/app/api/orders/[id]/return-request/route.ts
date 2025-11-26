/**
 * Return Request API - Task 17.2
 * POST /api/orders/[id]/return-request
 * Create a return request for an order
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const ReturnItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const ReturnRequestSchema = z.object({
  reason: z.enum([
    "DEFECTIVE",
    "NOT_AS_DESCRIBED",
    "WRONG_ITEM",
    "CHANGED_MIND",
    "SIZE_ISSUE",
    "DAMAGED_SHIPPING",
    "OTHER",
  ]),
  description: z.string().optional(),
  items: z.array(ReturnItemSchema).min(1),
});

const RETURN_WINDOW_DAYS = 30;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { reason, description, items } = ReturnRequestSchema.parse(body);

    // TODO: Get auth session to verify user owns this order
    // const session = await requireAuth();

    // Get order with items
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // TODO: Verify user owns this order
    // if (order.userId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    // Validate return window (30 days from purchase)
    const daysSincePurchase = Math.floor(
      (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSincePurchase > RETURN_WINDOW_DAYS) {
      return NextResponse.json(
        {
          error: "Return period expired",
          message: `Returns must be requested within ${RETURN_WINDOW_DAYS} days of purchase`,
          daysSincePurchase,
        },
        { status: 400 },
      );
    }

    // Validate order status (must be delivered or shipped)
    if (!["DELIVERED", "SHIPPED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Order must be delivered or shipped to request a return" },
        { status: 400 },
      );
    }

    // Validate items and quantities
    for (const item of items) {
      const orderItem = order.items.find(
        (oi) =>
          oi.productId === item.productId &&
          (item.variantId ? oi.variantId === item.variantId : true),
      );

      if (!orderItem) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found in order` },
          { status: 400 },
        );
      }

      if (item.quantity > orderItem.quantity) {
        return NextResponse.json(
          {
            error: `Invalid quantity for product ${item.productId}. Maximum: ${orderItem.quantity}`,
          },
          { status: 400 },
        );
      }
    }

    // Calculate refund amount
    const refundAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create return request
    const returnRequest = await db.returnRequest.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        reason,
        description,
        status: "PENDING",
        refundAmount,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
            refundPrice: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    // Create order note
    await db.orderNote.create({
      data: {
        orderId: order.id,
        content: `Return request created\nReason: ${reason}\n${description ? `Description: ${description}` : ""}\nRefund Amount: $${refundAmount.toFixed(2)}`,
        isPublic: false,
        createdBy: order.userId || "system",
      },
    });

    // TODO: Notify vendor
    // await createNotification(
    //   order.tenantId,
    //   "return_requested",
    //   `New return request for order ${order.orderNumber}`,
    //   reason
    // );

    // TODO: Send email to vendor
    console.log(
      `Return request created for order ${order.orderNumber}. Vendor notification pending.`,
    );

    return NextResponse.json({
      success: true,
      returnRequest: {
        id: returnRequest.id,
        status: returnRequest.status,
        reason: returnRequest.reason,
        refundAmount: returnRequest.refundAmount.toString(),
        items: returnRequest.items.map((item) => ({
          id: item.id,
          product: item.product.name,
          variant: item.variant
            ? `${item.variant.size || ""} ${item.variant.color || ""}`.trim()
            : null,
          quantity: item.quantity,
          refundPrice: item.refundPrice.toString(),
        })),
        createdAt: returnRequest.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating return request:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create return request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to retrieve return requests for an order
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const returnRequests = await db.returnRequest.findMany({
      where: { orderId: params.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingLabel: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      returnRequests: returnRequests.map((rr) => ({
        id: rr.id,
        status: rr.status,
        reason: rr.reason,
        description: rr.description,
        refundAmount: rr.refundAmount.toString(),
        items: rr.items.map((item) => ({
          id: item.id,
          product: item.product.name,
          variant: item.variant
            ? `${item.variant.size || ""} ${item.variant.color || ""}`.trim()
            : null,
          quantity: item.quantity,
          refundPrice: item.refundPrice.toString(),
          accepted: item.accepted,
          rejectionReason: item.rejectionReason,
        })),
        trackingNumber: rr.shippingLabel?.trackingNumber,
        approvedAt: rr.approvedAt?.toISOString(),
        rejectionReason: rr.rejectionReason,
        receivedAt: rr.receivedAt?.toISOString(),
        inspectedAt: rr.inspectedAt?.toISOString(),
        refundedAt: rr.refundedAt?.toISOString(),
        createdAt: rr.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error retrieving return requests:", error);
    return NextResponse.json({ error: "Failed to retrieve return requests" }, { status: 500 });
  }
}
