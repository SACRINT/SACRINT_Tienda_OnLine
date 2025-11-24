// GET /api/reports/coupons
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId
// Coupon usage and ROI reports

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";

import { getCouponReports } from "@/lib/analytics/queries";
import { subDays } from "date-fns";

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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const start = startDate ? new Date(startDate) : subDays(new Date(), 29);
    const end = endDate ? new Date(endDate) : new Date();

    const data = await getCouponReports(tenantId, start, end);

    return NextResponse.json({
      data,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Coupon reports error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
