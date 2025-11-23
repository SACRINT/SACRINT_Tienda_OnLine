// GET /api/analytics/cohort
// Cohort retention and purchase behavior analysis
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";
import {
  getCohortRetention,
  getPurchaseFrequencyCohorts,
  getAovByPurchaseNumber,
  getTimeBetweenPurchases,
} from "@/lib/analytics/cohort";

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
    const months = parseInt(searchParams.get("months") || "6");
    const analysis = searchParams.get("analysis") || "retention"; // 'retention' | 'frequency' | 'aov' | 'timing' | 'all'

    // Validate months parameter
    if (months < 1 || months > 12) {
      return NextResponse.json({ error: "Months must be between 1 and 12" }, { status: 400 });
    }

    let data: any = {};

    if (analysis === "all" || analysis === "retention") {
      const retention = await getCohortRetention(tenantId, months);
      data.retention = retention;
    }

    if (analysis === "all" || analysis === "frequency") {
      const frequency = await getPurchaseFrequencyCohorts(tenantId);
      data.frequency = frequency;
    }

    if (analysis === "all" || analysis === "aov") {
      const aov = await getAovByPurchaseNumber(tenantId, 5);
      data.aovByPurchaseNumber = aov;
    }

    if (analysis === "all" || analysis === "timing") {
      const timing = await getTimeBetweenPurchases(tenantId);
      data.timeBetweenPurchases = timing;
    }

    return NextResponse.json({
      data,
      config: {
        months,
        analysis,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Cohort analytics error");
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
