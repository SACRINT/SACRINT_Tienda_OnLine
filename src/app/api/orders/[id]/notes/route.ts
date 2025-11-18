// POST /api/orders/:id/notes
// Add notes to orders (internal only - stored in order.adminNotes)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const CreateNoteSchema = z.object({
  tenantId: z.string().cuid(),
  content: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "STORE_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = CreateNoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { tenantId, content } = validation.data;

    if (
      session.user.role === "STORE_OWNER" &&
      session.user.tenantId !== tenantId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    // Append note to adminNotes field
    const existingNotes = order.adminNotes ? `${order.adminNotes}\n---\n` : "";
    const timestamp = new Date().toISOString();
    const updatedNotes = `${existingNotes}[${timestamp}] ${session.user.name || session.user.email}:\n${content}`;

    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        adminNotes: updatedNotes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Note added successfully",
      adminNotes: updatedOrder.adminNotes,
    });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/orders/:id/notes
// Get notes for an order (stored in adminNotes)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    // Verify tenant access
    const order = await db.order.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      notes: order.adminNotes || "",
    });
  } catch (error) {
    console.error("Get notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/orders/:id/notes
// Clear all notes for an order
const DeleteNoteSchema = z.object({
  tenantId: z.string().cuid(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "STORE_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = DeleteNoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { tenantId } = validation.data;

    if (
      session.user.role === "STORE_OWNER" &&
      session.user.tenantId !== tenantId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    // Clear all notes
    await db.order.update({
      where: { id: params.id },
      data: {
        adminNotes: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "All notes cleared",
    });
  } catch (error) {
    console.error("Delete notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
