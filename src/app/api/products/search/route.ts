// Product Search API
// GET /api/products/search - Advanced product search with filters

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { searchProducts } from "@/lib/db/products";
import { ProductSearchSchema } from "@/lib/security/schemas/product-schemas";

/**
 * GET /api/products/search
 * Advanced product search endpoint
 * Only searches published products
 *
 * Query params:
 * - q: string (required, search query)
 * - categoryId: UUID (optional, filter by category)
 * - minPrice: number (optional, minimum price)
 * - maxPrice: number (optional, maximum price)
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 },
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);

    const searchInput = {
      q: searchParams.get("q"),
      categoryId: searchParams.get("categoryId"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const validation = ProductSearchSchema.safeParse(searchInput);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid search parameters",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const validatedInput = validation.data;

    // Search products
    const result = await searchProducts(tenantId, validatedInput);

    return NextResponse.json({
      products: result.products.map((product: any) => ({
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
        images: product.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        })),
        reviewCount: product._count.reviews,
        createdAt: product.createdAt,
      })),
      pagination: {
        page: result.page,
        total: result.total,
        pages: result.pages,
        limit: validatedInput.limit,
      },
      query: validatedInput.q,
    });
  } catch (error) {
    console.error("[PRODUCTS] SEARCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
