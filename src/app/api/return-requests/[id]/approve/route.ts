/**
 * Return Approval API - Task 17.4
 * POST /api/return-requests/[id]/approve
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const ApprovalSchema = z.object({
  approvalNotes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { approvalNotes } = ApprovalSchema.parse(body);

    const returnRequest = await db.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            user: true,
            tenant: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: "Return request not found" }, { status: 404 });
    }

    if (returnRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot approve return in status: ${returnRequest.status}` },
        { status: 400 },
      );
    }

    // Generate return shipping label
    const returnLabelResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/orders/${returnRequest.orderId}/return-label`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: returnRequest.reason,
        }),
      },
    );

    let shippingLabelId: string | undefined;
    if (returnLabelResponse.ok) {
      const labelData = await returnLabelResponse.json();
      shippingLabelId = labelData.label?.id;
    }

    // Update return request
    const updated = await db.returnRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: "system", // TODO: Get from session
        shippingLabelId,
      },
      include: {
        shippingLabel: true,
      },
    });

    // Create order note
    await db.orderNote.create({
      data: {
        orderId: returnRequest.orderId,
        content: `Return request approved${approvalNotes ? `\nNotes: ${approvalNotes}` : ""}`,
        isPublic: false,
        createdBy: "system",
      },
    });

    // TODO: Send email to customer with return instructions and label
    console.log(
      `Return approved for order ${returnRequest.order.orderNumber}. Email notification pending.`,
    );

    return NextResponse.json({
      success: true,
      returnRequest: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt?.toISOString(),
        trackingNumber: updated.shippingLabel?.trackingNumber,
        labelUrl: updated.shippingLabel?.labelUrl,
      },
    });
  } catch (error) {
    console.error("Error approving return:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to approve return",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
