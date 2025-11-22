/**
 * Export Products API
 * GET /api/export/products?format=csv
 * Exports products to CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { exportProductsToCSV, createCSVResponse } from "@/lib/export/csv";
import { logger } from "@/lib/monitoring/logger";
import { USER_ROLES } from "@/lib/types/user-role";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can export
    if (
      session.user.role !== USER_ROLES.STORE_OWNER &&
      session.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tenantId } = session.user;

    if (!tenantId && session.user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: "User has no tenant assigned" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const published = searchParams.get("published") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;

    // Build where clause
    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (published !== null) {
      where.published = published === "true";
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Fetch products
    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (format === "csv") {
      // Convert Decimal fields to numbers for CSV export
      const productsForExport = products.map((product: any) => ({
        ...product,
        basePrice: Number(product.basePrice),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        weight: Number(product.weight),
        length: Number(product.length),
        width: Number(product.width),
        height: Number(product.height),
      }));

      const csvContent = exportProductsToCSV(productsForExport);
      const filename = `products-${new Date().toISOString().split("T")[0]}.csv`;

      logger.info(
        {
          userId: session.user.id,
          tenantId: tenantId ?? undefined,
          count: products.length,
        },
        "Products exported to CSV",
      );

      return createCSVResponse(csvContent, filename);
    }

    return NextResponse.json({ error: "Only CSV format is supported" }, { status: 400 });
  } catch (error) {
    logger.error({ error: error }, "Export products failed");
    return NextResponse.json({ error: "Failed to export products" }, { status: 500 });
  }
}
