// POST /api/products/[id]/archive - Archive a product (soft delete)
// DELETE /api/products/[id]/archive - Restore an archived product

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { logger } from "@/lib/monitoring/logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Archive product (soft delete)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can archive products
    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    // Check if product exists and belongs to tenant
    const product = await db.product.findUnique({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Archive the product
    const archived = await db.product.update({
      where: {
        id: params.id,
      },
      data: {
        archivedAt: new Date(),
        published: false, // Unpublish when archiving
      },
    });

    logger.info(
      {
        productId: params.id,
        tenantId,
        userId: session.user.id,
      },
      "Product archived",
    );

    return NextResponse.json({
      success: true,
      message: "Product archived successfully",
      product: archived,
    });
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        productId: params.id,
      },
      "Error archiving product",
    );

    return NextResponse.json(
      { error: "Failed to archive product", details: error.message },
      { status: 500 },
    );
  }
}

// Restore archived product
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can restore products
    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    // Check if product exists and belongs to tenant
    const product = await db.product.findUnique({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Restore the product
    const restored = await db.product.update({
      where: {
        id: params.id,
      },
      data: {
        archivedAt: null,
      },
    });

    logger.info(
      {
        productId: params.id,
        tenantId,
        userId: session.user.id,
      },
      "Product restored",
    );

    return NextResponse.json({
      success: true,
      message: "Product restored successfully",
      product: restored,
    });
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        productId: params.id,
      },
      "Error restoring product",
    );

    return NextResponse.json(
      { error: "Failed to restore product", details: error.message },
      { status: 500 },
    );
  }
}
