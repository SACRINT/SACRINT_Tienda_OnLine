// POST /api/products/[id]/duplicate
// Duplicate a product with all its data (except stock)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUserTenantId } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { logger } from "@/lib/monitoring/logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can duplicate products
    if (
      session.user.role !== "STORE_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = await getCurrentUserTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: "No tenant assigned to user" },
        { status: 400 }
      );
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
            images: true,
            attributes: true,
          },
        },
        tags: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Generate unique SKU
    const timestamp = Date.now();
    const newSku = original.sku
      ? `${original.sku}-COPY-${timestamp}`
      : `COPY-${timestamp}`;
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
        cost: original.cost,
        stock: 0, // Reset stock for safety
        categoryId: original.categoryId,
        published: false, // Unpublish duplicate for review
        featured: false,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        weight: original.weight,
        dimensions: original.dimensions,
        // Create images
        images: {
          create: original.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
          })),
        },
        // Create variants if they exist
        variants: original.variants.length
          ? {
              create: original.variants.map((variant) => ({
                name: variant.name,
                sku: `${variant.sku}-COPY-${timestamp}`,
                price: variant.price,
                stock: 0, // Reset variant stock
                images: {
                  create: variant.images.map((img) => ({
                    url: img.url,
                    alt: img.alt,
                  })),
                },
                attributes: {
                  create: variant.attributes.map((attr) => ({
                    name: attr.name,
                    value: attr.value,
                  })),
                },
              })),
            }
          : undefined,
        // Create tags
        tags: {
          create: original.tags.map((tag) => ({
            name: tag.name,
          })),
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });

    logger.info("Product duplicated successfully", {
      originalId: original.id,
      duplicatedId: duplicated.id,
      tenantId,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      productId: duplicated.id,
      product: duplicated,
    });
  } catch (error: any) {
    logger.error("Error duplicating product", {
      error: error.message,
      productId: params.id,
    });

    return NextResponse.json(
      { error: "Failed to duplicate product", details: error.message },
      { status: 500 }
    );
  }
}
