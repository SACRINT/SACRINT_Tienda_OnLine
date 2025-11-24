// PATCH /api/orders/:id/status
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId
// Update order status with audit trail

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";
import { db } from "@/lib/db";
import { z } from "zod";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

const UpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not body)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const body = await req.json();
    const validation = UpdateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { status, note } = validation.data;

    // Verify order exists and belongs to tenant
    const order = await db.order.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status
    const updated = await db.order.update({
      where: { id: params.id },
      data: { status },
    });

    // Log status change and append note to adminNotes if provided
    if (note) {
      const existingNotes = order.adminNotes ? `${order.adminNotes}\n---\n` : "";
      const timestamp = new Date().toISOString();
      const noteName = session.user.name || session.user.email;
      const noteContent = `[${timestamp}] Status changed from ${order.status} to ${status}. ${note} (by ${noteName})`;

      await db.order.update({
        where: { id: params.id },
        data: {
          adminNotes: `${existingNotes}${noteContent}`,
        },
      });
    }

    // TODO: Activity logging - implement with dedicated activity log model if needed
    console.log("[Order Status API] Status updated", {
      tenantId,
      orderId: params.id,
      userId: session.user.id,
      previousStatus: order.status,
      newStatus: status,
    });

    // TODO: Send email notification to customer based on status
    // TODO: Trigger webhook for status change

    return NextResponse.json({
      success: true,
      order: updated,
    });
  } catch (error) {
    logger.error({ error }, "Update status error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/orders/:id/status
// Get status history for an order
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

    // TODO: Implement status history tracking - currently returning empty for future implementation
    const formattedHistory: any[] = [];

    return NextResponse.json({
      history: formattedHistory,
    });
  } catch (error) {
    logger.error({ error }, "Get status history error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
