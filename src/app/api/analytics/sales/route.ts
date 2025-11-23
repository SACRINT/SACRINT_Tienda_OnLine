// GET /api/analytics/sales
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId
// Sales metrics and reports

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";

import { getSalesMetrics } from "@/lib/analytics/queries";
import { AnalyticsResponse, SalesMetrics } from "@/lib/analytics/types";
import { subDays } from "date-fns";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can access analytics
    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not query params)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "last30days";

    // Determine date range
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      switch (period) {
        case "today":
          start = new Date();
          start.setHours(0, 0, 0, 0);
          break;
        case "yesterday":
          start = subDays(new Date(), 1);
          start.setHours(0, 0, 0, 0);
          end = subDays(new Date(), 1);
          end.setHours(23, 59, 59, 999);
          break;
        case "last7days":
          start = subDays(new Date(), 6);
          start.setHours(0, 0, 0, 0);
          break;
        case "last30days":
          start = subDays(new Date(), 29);
          start.setHours(0, 0, 0, 0);
          break;
        case "last90days":
          start = subDays(new Date(), 89);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start = subDays(new Date(), 29);
          start.setHours(0, 0, 0, 0);
      }
    }

    // Fetch metrics
    const metrics = await getSalesMetrics(tenantId, start, end);

    const response: AnalyticsResponse<SalesMetrics> = {
      data: metrics,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error({ error }, "Analytics sales error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
