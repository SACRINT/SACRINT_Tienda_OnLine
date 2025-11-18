// GET /api/activity
// Activity logs for monitoring

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    if (
      session.user.role === "STORE_OWNER" &&
      session.user.tenantId !== tenantId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build where clause
    const where: any = { tenantId };

    if (action) {
      if (action.endsWith("_")) {
        // Prefix match (e.g., "BULK_")
        where.action = { startsWith: action };
      } else {
        where.action = action;
      }
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get activity logs
    // NOTE: ActivityLog model not yet implemented in Phase 2
    // Returning empty array for now
    const logs: any[] = [];

    return NextResponse.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
