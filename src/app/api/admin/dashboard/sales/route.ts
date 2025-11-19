// API Route - Dashboard Sales Data
// GET /api/admin/dashboard/sales - Returns sales data grouped by date

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSalesData } from "@/lib/db/dashboard";
import { SalesDataSchema } from "@/lib/security/schemas/dashboard-schemas";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard/sales
 * Returns daily sales totals for the specified number of days
 *
 * @query days - Number of days to fetch (default: 30, max: 365)
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

    // Parse query parameter
    const daysParam = req.nextUrl.searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 30;

    // Validate input
    const validation = SalesDataSchema.safeParse({
      tenantId: session.user.tenantId,
      days,
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

    const sales = await getSalesData(
      validation.data.tenantId,
      validation.data.days,
    );

    return NextResponse.json({
      success: true,
      data: sales,
      meta: {
        days: validation.data.days,
        count: sales.length,
      },
    });
  } catch (error: any) {
    console.error("[DASHBOARD SALES] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales data" },
      { status: 500 },
    );
  }
}
