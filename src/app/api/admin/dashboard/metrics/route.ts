// API Route - Dashboard Metrics
// GET /api/admin/dashboard/metrics - Returns general dashboard metrics

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getDashboardMetrics } from "@/lib/db/dashboard";
import { DashboardMetricsSchema } from "@/lib/security/schemas/dashboard-schemas";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard/metrics
 * Returns total orders, revenue, products, and customers
 *
 * @requires Authentication
 * @requires STORE_OWNER or SUPER_ADMIN role
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Unauthorized - No tenant ID found" },
        { status: 401 },
      );
    }

    // Validate input
    const validation = DashboardMetricsSchema.safeParse({
      tenantId: session.user.tenantId,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const metrics = await getDashboardMetrics(validation.data.tenantId);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error("[DASHBOARD METRICS] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard metrics" },
      { status: 500 },
    );
  }
}
