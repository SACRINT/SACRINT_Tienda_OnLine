/**
 * Bulk Product Actions API
 * Semana 10.7: Bulk Product Actions
 *
 * API para acciones masivas en productos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bulkActionSchema = z.object({
  action: z.enum(["publish", "unpublish", "archive", "delete", "update-price"]),
  productIds: z.array(z.string().cuid()),
  data: z
    .object({
      newPrice: z.number().positive().optional(),
    })
    .optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = bulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { action, productIds, data } = validation.data;
    const tenantId = session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "No tenant assigned" },
        { status: 400 }
      );
    }

    // Verify all products belong to this tenant
    const products = await db.product.count({
      where: {
        id: { in: productIds },
        tenantId,
      },
    });

    if (products !== productIds.length) {
      return NextResponse.json(
        { error: "Some products do not belong to your store" },
        { status: 403 }
      );
    }

    let result;

    switch (action) {
      case "publish":
        result = await db.product.updateMany({
          where: { id: { in: productIds }, tenantId },
          data: { published: true },
        });
        break;

      case "unpublish":
        result = await db.product.updateMany({
          where: { id: { in: productIds }, tenantId },
          data: { published: false },
        });
        break;

      case "archive":
        result = await db.product.updateMany({
          where: { id: { in: productIds }, tenantId },
          data: { archivedAt: new Date() },
        });
        break;

      case "delete":
        result = await db.product.deleteMany({
          where: { id: { in: productIds }, tenantId },
        });
        break;

      case "update-price":
        if (!data?.newPrice) {
          return NextResponse.json(
            { error: "New price is required" },
            { status: 400 }
          );
        }
        result = await db.product.updateMany({
          where: { id: { in: productIds }, tenantId },
          data: { basePrice: data.newPrice },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      action,
    });
  } catch (error: any) {
    console.error("[Bulk Actions] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
