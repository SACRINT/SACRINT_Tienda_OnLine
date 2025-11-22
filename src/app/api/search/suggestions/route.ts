// Search Suggestions API
// Week 17-18: Autocomplete suggestions

import { NextRequest, NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/search/search-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/search/suggestions
 * Get autocomplete suggestions for search query
 *
 * Query params:
 * - q: search query (required)
 * - limit: max suggestions (default: 5)
 * - tenantId: filter by tenant
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");
    const tenantId = searchParams.get("tenantId") || undefined;

    if (\!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    const suggestions = await getSearchSuggestions(query, tenantId, limit);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 },
    );
  }
}
