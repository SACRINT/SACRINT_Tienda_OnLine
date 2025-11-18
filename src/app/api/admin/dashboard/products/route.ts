// API Route - Dashboard Top Products
// GET /api/admin/dashboard/products - Returns top selling products

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTopProducts } from "@/lib/db/dashboard";
import { TopProductsSchema } from "@/lib/security/schemas/dashboard-schemas";

/**
 * GET /api/admin/dashboard/products
 * Returns top selling products ordered by number of sales
 *
 * @query limit - Number of products to return (default: 10, max: 100)
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
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Validate input
    const validation = TopProductsSchema.safeParse({
      tenantId: session.user.tenantId,
      limit,
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

    const products = await getTopProducts(
      validation.data.tenantId,
      validation.data.limit,
    );

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        limit: validation.data.limit,
        count: products.length,
      },
    });
  } catch (error: any) {
    console.error("[DASHBOARD PRODUCTS] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch top products" },
      { status: 500 },
    );
  }
}
