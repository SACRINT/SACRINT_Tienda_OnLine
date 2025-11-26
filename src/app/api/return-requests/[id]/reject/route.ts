/**
 * Return Rejection API - Task 17.5
 * POST /api/return-requests/[id]/reject
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const RejectionSchema = z.object({
  rejectionReason: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { rejectionReason } = RejectionSchema.parse(body);

    const returnRequest = await db.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: "Return request not found" },
        { status: 404 }
      );
    }

    if (returnRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot reject return in status: ${returnRequest.status}` },
        { status: 400 }
      );
    }

    // Update return request
    const updated = await db.returnRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        rejectionReason,
      },
    });

    // Create order note
    await db.orderNote.create({
      data: {
        orderId: returnRequest.orderId,
        content: `Return request rejected\nReason: ${rejectionReason}`,
        isPublic: false,
        createdBy: "system",
      },
    });

    // TODO: Send email to customer with rejection explanation
    console.log(`Return rejected for order ${returnRequest.order.orderNumber}. Customer notification pending.`);

    return NextResponse.json({
      success: true,
      returnRequest: {
        id: updated.id,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Error rejecting return:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to reject return", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
