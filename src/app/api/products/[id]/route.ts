// GET /api/products/:id
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId
// GET, PUT, PATCH, DELETE operations for individual product

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { logger } from "@/lib/monitoring/logger";

import { db } from "@/lib/db";
import { z } from "zod";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// GET single product
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not query params)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const product = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    logger.error({ error }, "Get product error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH for quick updates (used by QuickEdit component)
const QuickUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not body)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const body = await req.json();
    const validation = QuickUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const updates = validation.data;

    // Verify product exists and belongs to tenant
    const existing = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update product
    const updated = await db.product.update({
      where: { id: params.id },
      data: updates,
    });

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log("[Product API] Product updated (quick edit)", {
      tenantId,
      productId: params.id,
      userId: session.user.id,
      updates,
    });

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (error) {
    logger.error({ error }, "Patch product error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT for full updates
const UpdateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  categoryId: z.string().uuid().optional(),
  sku: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not body)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    const body = await req.json();
    const validation = UpdateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { images, ...data } = validation.data;

    // Verify product exists and belongs to tenant
    const existing = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update product
    const updated = await db.product.update({
      where: { id: params.id },
      data,
    });

    // Update images if provided
    if (images) {
      // Delete old images
      await db.productImage.deleteMany({
        where: { productId: params.id },
      });

      // Create new images
      await db.productImage.createMany({
        data: images.map((url, index) => ({
          productId: params.id,
          url,
          altText: `${data.name} - Image ${index + 1}`,
          order: index,
        })),
      });
    }

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log("[Product API] Product updated (full update)", {
      tenantId,
      productId: params.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (error) {
    logger.error({ error }, "Update product error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ SECURITY: Get tenantId from authenticated session (not query params)
    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    // Verify product exists and belongs to tenant
    const existing = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Mark as unpublished (soft delete via published flag)
    const deleted = await db.product.update({
      where: { id: params.id },
      data: {
        published: false,
      },
    });

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log("[Product API] Product deleted", {
      tenantId,
      productId: params.id,
      userId: session.user.id,
      productName: existing.name,
    });

    return NextResponse.json({
      success: true,
      product: deleted,
    });
  } catch (error) {
    logger.error({ error }, "Delete product error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
