/**
 * Single Notification API
 * PATCH - Mark as read
 * DELETE - Delete notification
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

import {
  markAsRead,
  deleteNotification,
} from "@/lib/notifications/notification-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await markAsRead(params.id, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Notification API] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteNotification(params.id, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Notification API] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
