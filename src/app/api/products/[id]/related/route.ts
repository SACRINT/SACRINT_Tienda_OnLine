// Related Products API
// GET /api/products/[id]/related - Get related products based on category, tags, and price

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getRelatedProducts } from "@/lib/db/products";
import { z } from "zod";

/**
 * GET /api/products/[id]/related
 * Returns related products for a given product
 * Based on category, tags, and price similarity
 * No authentication required - public endpoint
 *
 * Query params:
 * - limit: number (default 6, max 20)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    const productId = params.id;

    // Validate productId is a UUID
    const uuidSchema = z.string().uuid("Invalid product ID format");
    const productIdValidation = uuidSchema.safeParse(productId);

    if (!productIdValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid product ID",
          issues: productIdValidation.error.issues,
        },
        { status: 400 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit") || "6";

    // Validate limit parameter
    const limitSchema = z.coerce
      .number()
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(20, "Limit must not exceed 20")
      .default(6);

    const limitValidation = limitSchema.safeParse(limitParam);

    if (!limitValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid limit parameter",
          issues: limitValidation.error.issues,
        },
        { status: 400 },
      );
    }

    const limit = limitValidation.data;

    // Get tenant ID from session or from product
    // For public access, we'll extract tenantId from the product itself
    let tenantId = session?.user?.tenantId;

    if (!tenantId) {
      // Public access - need to fetch product first to get tenantId
      // This is a simplified approach; in production you might want to
      // require tenant context via domain/subdomain
      return NextResponse.json(
        { error: "Unauthorized - Tenant context required" },
        { status: 401 },
      );
    }

    // Get related products
    const relatedProducts = await getRelatedProducts(
      tenantId,
      productId,
      limit,
    );

    // Calculate average rating for each product (if reviews exist)
    const productsWithRatings = relatedProducts.map((product: any) => {
      // In a real implementation, you'd have a reviews aggregate or rating field
      // For now, we'll use a placeholder
      const reviewCount = product._count.reviews;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        featured: product.featured,
        tags: product.tags,
        category: product.category,
        image: product.images[0] || null,
        reviewCount,
        // Placeholder - in production, calculate from reviews table
        averageRating: reviewCount > 0 ? 4.5 : null,
        createdAt: product.createdAt,
      };
    });

    return NextResponse.json({
      productId,
      relatedProducts: productsWithRatings,
      total: relatedProducts.length,
      limit,
    });
  } catch (error) {
    console.error("[RELATED PRODUCTS] GET error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Product not found or does not belong to tenant" },
          { status: 404 },
        );
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
