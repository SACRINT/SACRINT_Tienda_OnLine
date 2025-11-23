/**
 * Inventory Management API
 * ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId
 * GET - Get inventory status
 * POST - Adjust inventory
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";
import {
  getLowStockProducts,
  getOutOfStockProducts,
  adjustInventory,
  bulkStockUpdate,
} from "@/lib/inventory/inventory-service";
import { z } from "zod";
import { InventoryReason } from "@/lib/db/enums";

const adjustInventorySchema = z.object({
  adjustments: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      adjustment: z.number(),
      reason: z.nativeEnum(InventoryReason),
    }),
  ),
});

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not query params)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const threshold = parseInt(searchParams.get("threshold") || "10");

    const [lowStock, outOfStock] = await Promise.all([
      getLowStockProducts(tenantId, threshold),
      getOutOfStockProducts(tenantId),
    ]);

    return NextResponse.json({
      lowStock,
      outOfStock,
      summary: {
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        threshold,
      },
    });
  } catch (error: any) {
    logger.error({ error }, "[Inventory API] GET error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const body = await req.json();
    const data = adjustInventorySchema.parse(body);

    const result = await adjustInventory(data.adjustments, session.user.id, tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }
    logger.error({ error }, "[Inventory API] POST error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
