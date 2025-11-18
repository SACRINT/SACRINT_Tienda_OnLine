/**
 * Inventory Management API
 * GET - Get inventory status
 * POST - Adjust inventory
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
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

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId")!;
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
    console.error("[Inventory API] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = adjustInventorySchema.parse(body);

    const result = await adjustInventory(
      data.adjustments,
      session.user.id,
      session.user.tenantId!,
    );

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
    console.error("[Inventory API] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
