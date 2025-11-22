// GET /api/analytics/cohort
// Cohort retention and purchase behavior analysis

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
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
    if (
      session.user.role !== "STORE_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const months = parseInt(searchParams.get("months") || "6");
    const analysis =
      searchParams.get("analysis") || "retention"; // 'retention' | 'frequency' | 'aov' | 'timing' | 'all'

    // Validate tenant access
    if (
      !tenantId ||
      (session.user.role === "STORE_OWNER" &&
        session.user.tenantId !== tenantId)
    ) {
      return NextResponse.json(
        { error: "Forbidden - Invalid tenant" },
        { status: 403 },
      );
    }

    // Validate months parameter
    if (months < 1 || months > 12) {
      return NextResponse.json(
        { error: "Months must be between 1 and 12" },
        { status: 400 },
      );
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
    console.error("Cohort analytics error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
