// Featured Products API
// GET /api/products/featured - Get featured products
// ✅ PERFORMANCE [P1.16]: Caching implemented (10min TTL)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProducts } from "@/lib/db/products";
import { cache } from "@/lib/performance/cache";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

/**
 * GET /api/products/featured
 * Returns featured products with caching
 *
 * Query params:
 * - limit: number (default 8, max 20)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json({ error: "User has no tenant assigned" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 20);

    // ✅ PERFORMANCE [P1.16]: Cache with 10min TTL
    const cacheKey = `products:featured:${tenantId}:${limit}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached);
    }

    // Get featured products
    const result = await getProducts(tenantId, {
      featured: true,
      published: true,
      page: 1,
      limit,
      sort: "newest",
    });

    const response = {
      products: result.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        category: product.category,
        images: product.images.slice(0, 2).map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        })),
        reviewCount: product._count.reviews,
      })),
      total: result.pagination.total,
    };

    // Cache the response for 10 minutes (600 seconds)
    await cache.set(cacheKey, response, 600);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PRODUCTS/FEATURED] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
