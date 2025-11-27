/**
 * Notifications API
 * GET - Get user notifications
 * POST - Create notification (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getUserNotifications, createNotification } from "@/lib/notifications/notification-service";
import { z } from "zod";
import { NotificationType } from "@/lib/db/enums";

const createNotificationSchema = z.object({
  userId: z.string().cuid(),
  tenantId: z.string().cuid().optional(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getUserNotifications(session.user.id, {
      limit,
      offset,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Notifications API] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createNotificationSchema.parse(body);

    const result = await createNotification(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      notificationId: result.notificationId,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }
    console.error("[Notifications API] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
