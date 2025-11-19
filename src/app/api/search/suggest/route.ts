// Autocomplete Suggestions API
import { NextRequest, NextResponse } from "next/server";
import { getAutocomplete, getTrendingSearches, getRecentSearches } from "@/lib/search";
import { z } from "zod";

const suggestSchema = z.object({
  q: z.string().min(1),
  tenantId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(20).optional(),
  userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = suggestSchema.parse(params);

    const suggestions = await getAutocomplete(
      validated.q,
      validated.tenantId,
      validated.limit || 8
    );

    // Include recent searches if user is logged in
    let recentSearches: string[] = [];
    if (validated.userId) {
      recentSearches = await getRecentSearches(validated.userId, 3);
    }

    // Include trending if few results
    let trending: string[] = [];
    if (suggestions.length < 3) {
      trending = await getTrendingSearches(validated.tenantId, 5);
    }

    return NextResponse.json({
      suggestions,
      recentSearches,
      trending,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Suggest error:", error);
    return NextResponse.json(
      { error: "Suggestions failed" },
      { status: 500 }
    );
  }
}
