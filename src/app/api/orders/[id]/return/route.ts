// Order Return Request API
// POST /api/orders/[id]/return - Request return/refund for an order

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

// Validation schema for return request
const ReturnRequestSchema = z.object({
  itemIds: z
    .array(z.string().uuid("Invalid item ID"))
    .min(1, "At least one item must be selected"),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(200, "Reason must not exceed 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must not exceed 500 characters"),
  images: z.array(z.string().url("Invalid image URL")).optional(),
});

/**
 * POST /api/orders/[id]/return
 * Creates a return/refund request for an order
 * Requires authentication and order ownership
 *
 * Body:
 * - itemIds: string[] (UUIDs of items to return)
 * - reason: string (reason for return)
 * - description: string (detailed description)
 * - images?: string[] (optional photo evidence URLs)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 },
      );
    }

    const { tenantId } = session.user;
    const orderId = params.id;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 },
      );
    }

    // Validate order ID is UUID
    const uuidSchema = z.string().uuid("Invalid order ID");
    const orderIdValidation = uuidSchema.safeParse(orderId);

    if (!orderIdValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid order ID",
          issues: orderIdValidation.error.issues,
        },
        { status: 400 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = ReturnRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { itemIds, reason, description, images } = validation.data;

    // TODO: Replace with actual database operations
    // Verify order exists and belongs to user
    // const order = await db.order.findFirst({
    //   where: {
    //     id: orderId,
    //     userId: session.user.id,
    //     tenantId,
    //   },
    //   include: {
    //     items: true,
    //   },
    // })

    // if (!order) {
    //   return NextResponse.json(
    //     { error: 'Order not found or does not belong to you' },
    //     { status: 404 }
    //   )
    // }

    // Validate order status allows returns (e.g., DELIVERED)
    // if (order.status !== 'DELIVERED') {
    //   return NextResponse.json(
    //     { error: 'Only delivered orders can be returned' },
    //     { status: 400 }
    //   )
    // }

    // Check if return window is still open (e.g., 30 days)
    // const deliveryDate = order.deliveredAt || order.updatedAt
    // const returnWindowDays = 30
    // const daysSinceDelivery = Math.floor(
    //   (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    // )

    // if (daysSinceDelivery > returnWindowDays) {
    //   return NextResponse.json(
    //     {
    //       error: `Return window has expired. Returns must be requested within ${returnWindowDays} days of delivery`,
    //     },
    //     { status: 400 }
    //   )
    // }

    // Verify all itemIds belong to this order
    // const orderItemIds = order.items.map((item) => item.id)
    // const invalidItems = itemIds.filter((id) => !orderItemIds.includes(id))

    // if (invalidItems.length > 0) {
    //   return NextResponse.json(
    //     { error: 'Some items do not belong to this order' },
    //     { status: 400 }
    //   )
    // }

    // Create return request
    // const returnRequest = await db.returnRequest.create({
    //   data: {
    //     orderId,
    //     userId: session.user.id,
    //     tenantId,
    //     reason,
    //     description,
    //     images: images || [],
    //     status: 'PENDING',
    //     items: {
    //       create: itemIds.map((itemId) => ({
    //         orderItemId: itemId,
    //       })),
    //     },
    //   },
    //   include: {
    //     items: {
    //       include: {
    //         orderItem: {
    //           include: {
    //             product: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    // })

    // Mock response for development
    const returnRequest = {
      id: `return-${Date.now()}`,
      orderId,
      userId: session.user.id,
      tenantId,
      reason,
      description,
      images: images || [],
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    console.log(
      `[RETURNS] Created return request ${returnRequest.id} for order ${orderId} by user ${session.user.id}`,
    );

    // TODO: Send notification email to customer and admin
    // await sendReturnRequestEmail(session.user.email, returnRequest)

    return NextResponse.json(
      {
        message: "Return request submitted successfully",
        returnRequest: {
          id: returnRequest.id,
          orderId: returnRequest.orderId,
          status: returnRequest.status,
          reason: returnRequest.reason,
          description: returnRequest.description,
          createdAt: returnRequest.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[RETURNS] POST error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (error.message.includes("window")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
