// POST /api/products/[id]/duplicate
// Duplicate a product with all its data (except stock)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { logger } from "@/lib/monitoring/logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can duplicate products
    if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant assigned to user" }, { status: 400 });
    }

    // Get the original product with all relations
    const original = await db.product.findUnique({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        images: true,
        variants: {
          include: {
            image: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Generate unique SKU
    const timestamp = Date.now();
    const newSku = original.sku ? `${original.sku}-COPY-${timestamp}` : `COPY-${timestamp}`;
    const newSlug = `${original.slug}-copy-${timestamp}`;

    // Create duplicated product
    const duplicated = await db.product.create({
      data: {
        tenantId,
        name: `${original.name} (Copia)`,
        description: original.description,
        slug: newSlug,
        sku: newSku,
        basePrice: original.basePrice,
        salePrice: original.salePrice,
        stock: 0, // Reset stock for safety
        categoryId: original.categoryId,
        published: false, // Unpublish duplicate for review
        featured: false,
        weight: original.weight,
        length: original.length,
        width: original.width,
        height: original.height,
        // Create images
        images: {
          create: original.images.map((img, index) => ({
            url: img.url,
            alt: img.alt,
            order: index,
          })),
        },
        // Create variants if they exist
        variants: original.variants.length
          ? {
              create: original.variants.map((variant) => ({
                size: variant.size,
                color: variant.color,
                model: variant.model,
                sku: `${variant.sku}-COPY-${timestamp}`,
                price: variant.price,
                stock: 0, // Reset variant stock
              })),
            }
          : undefined,
        // Copy tags
        tags: original.tags || [],
      },
      include: {
        images: true,
        variants: true,
      },
    });

    logger.info(
      {
        originalId: original.id,
        duplicatedId: duplicated.id,
        tenantId,
        userId: session.user.id,
      },
      "Product duplicated successfully",
    );

    return NextResponse.json({
      success: true,
      productId: duplicated.id,
      product: duplicated,
    });
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        productId: params.id,
      },
      "Error duplicating product",
    );

    return NextResponse.json(
      { error: "Failed to duplicate product", details: error.message },
      { status: 500 },
    );
  }
}
