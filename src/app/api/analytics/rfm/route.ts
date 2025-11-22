// GET /api/analytics/rfm
// RFM (Recency, Frequency, Monetary) customer segmentation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  calculateRFMScores,
  getRFMSegmentSummary,
  getSegmentRecommendations,
} from "@/lib/analytics/rfm";

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
    const view = searchParams.get("view") || "summary"; // 'summary' | 'detailed' | 'segment'
    const segment = searchParams.get("segment"); // Optional: filter by specific segment

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

    let data;

    if (view === "summary") {
      // Get segment summary with recommendations
      const segments = await getRFMSegmentSummary(tenantId);
      const segmentsWithRecommendations = segments.map((seg) => ({
        ...seg,
        recommendations: getSegmentRecommendations(seg.segment),
      }));

      data = {
        segments: segmentsWithRecommendations,
        totalCustomers: segments.reduce((sum, s) => sum + s.count, 0),
        totalRevenue: segments.reduce((sum, s) => sum + s.totalRevenue, 0),
      };
    } else if (view === "detailed") {
      // Get all customer RFM scores
      const scores = await calculateRFMScores(tenantId);
      data = {
        customers: scores,
        totalCustomers: scores.length,
      };
    } else {
      return NextResponse.json(
        { error: "Invalid view parameter" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("RFM analytics error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
