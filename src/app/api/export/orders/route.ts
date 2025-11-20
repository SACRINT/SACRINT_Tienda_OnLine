/**
 * Export Orders API
 * GET /api/export/orders?format=csv|pdf&startDate=xxx&endDate=xxx
 * Exports orders to CSV or PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { exportOrdersToCSV, createCSVResponse } from "@/lib/export/csv";
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
    if (session.user.role !== USER_ROLES.STORE_OWNER && session.user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tenantId } = session.user;

    if (!tenantId && session.user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    // Build where clause
    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    // Fetch orders
    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const csvContent = exportOrdersToCSV(orders);
      const filename = `orders-${new Date().toISOString().split("T")[0]}.csv`;

      logger.info("Orders exported to CSV", {
        userId: session.user.id,
        tenantId: tenantId ?? undefined,
        count: orders.length,
      });

      return createCSVResponse(csvContent, filename);
    }

    // PDF format not yet implemented
    return NextResponse.json(
      { error: "PDF export not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    logger.error("Export orders failed", error as Error);
    return NextResponse.json(
      { error: "Failed to export orders" },
      { status: 500 }
    );
  }
}
