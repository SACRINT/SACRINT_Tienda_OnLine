// GET /api/activity
// Activity logs for monitoring
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not query params)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100");

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
    logger.error({ error }, "Get activity logs error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
