// Search Autocomplete API
// GET /api/search/autocomplete - Get search suggestions as user types

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSearchSuggestions } from "@/lib/db/search";
import { z } from "zod";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

const AutocompleteSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

/**
 * GET /api/search/autocomplete
 * Returns search suggestions for autocomplete
 *
 * Query params:
 * - q: search query (minimum 1 character)
 * - limit: max suggestions to return (default 10, max 20)
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

    const { searchParams } = new URL(req.url);
    const queryParams = {
      q: searchParams.get("q"),
      limit: searchParams.get("limit") || "10",
    };

    const validation = AutocompleteSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { q, limit } = validation.data;

    const suggestions = await getSearchSuggestions(tenantId, q, limit);

    return NextResponse.json({
      query: q,
      suggestions: suggestions.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category?.name,
        price: product.salePrice || product.basePrice,
        image: product.images?.[0]?.url,
        inStock: product.stock > 0,
      })),
    });
  } catch (error) {
    console.error("[AUTOCOMPLETE] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
