// Search API Endpoint
// ✅ SECURITY [P0.3]: Fixed tenant isolation - using session tenantId
// Week 17-18: Advanced search with filters

import { NextRequest, NextResponse } from "next/server";
import { searchProducts, logSearchQuery } from "@/lib/search/search-engine";
import { auth } from "@/lib/auth/auth";
import { logger } from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/search
 * Search products with advanced filters
 *
 * Query params:
 * - q: search query
 * - category: category ID or slug
 * - minPrice, maxPrice: price range
 * - minRating: minimum rating filter
 * - inStock: true/false
 * - featured: true/false
 * - sortBy: relevance|price-asc|price-desc|rating|newest|popular
 * - page, limit: pagination
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Parse filters from query params
    const query = searchParams.get("q") || "";
    const categoryId = searchParams.get("category") || undefined;
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const minRating = searchParams.get("minRating")
      ? parseFloat(searchParams.get("minRating")!)
      : undefined;
    const inStock = searchParams.get("inStock") === "true";
    const featured = searchParams.get("featured") === "true";
    const sortBy = (searchParams.get("sortBy") || "relevance") as
      | "relevance"
      | "price-asc"
      | "price-desc"
      | "rating"
      | "newest"
      | "popular";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const tenantId = searchParams.get("tenantId") || undefined;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    // Execute search
    const results = await searchProducts({
      query,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      minRating,
      inStock: inStock || undefined,
      featured: featured || undefined,
      sortBy,
      page,
      limit,
      tenantId,
    });

    // Log search for analytics
    const session = await auth();
    await logSearchQuery(query, results.pagination.total, tenantId, session?.user?.id);

    // Return results
    return NextResponse.json(results);
  } catch (error) {
    logger.error({ error }, "Search error");
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
