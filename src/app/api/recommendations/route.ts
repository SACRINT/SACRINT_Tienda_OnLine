/**
 * Product Recommendations API
 * GET /api/recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getCombinedRecommendations,
  getFrequentlyBoughtTogether,
  getSimilarProducts,
  getTrendingProducts,
  getPersonalizedRecommendations,
} from "@/lib/recommendations/engine";
import { logger, PerfTimer } from "@/lib/monitoring/logger";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RecommendationsSchema = z.object({
  tenantId: z.string().cuid(),
  type: z.enum(["fbt", "similar", "trending", "personalized", "combined"]).default("combined"),
  userId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export async function GET(req: NextRequest) {
  const timer = new PerfTimer("recommendations_api");

  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);

    // Validate input
    const validated = RecommendationsSchema.safeParse(searchParams);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: validated.error.issues,
        },
        { status: 400 },
      );
    }

    const { tenantId, type, userId, productId, limit } = validated.data;

    // Validate required params for each type
    if (type === "fbt" && !productId) {
      return NextResponse.json({ error: "productId required for 'fbt' type" }, { status: 400 });
    }

    if (type === "similar" && !productId) {
      return NextResponse.json({ error: "productId required for 'similar' type" }, { status: 400 });
    }

    if (type === "personalized" && !userId) {
      return NextResponse.json(
        { error: "userId required for 'personalized' type" },
        { status: 400 },
      );
    }

    // Get recommendations based on type
    let recommendations;

    switch (type) {
      case "fbt":
        recommendations = await getFrequentlyBoughtTogether(tenantId, productId!, limit);
        break;

      case "similar":
        recommendations = await getSimilarProducts(tenantId, productId!, limit);
        break;

      case "trending":
        recommendations = await getTrendingProducts(tenantId, limit);
        break;

      case "personalized":
        recommendations = await getPersonalizedRecommendations(tenantId, userId!, limit);
        break;

      case "combined":
        recommendations = await getCombinedRecommendations(tenantId, {
          userId,
          productId,
          limit,
        });
        break;
    }

    const duration = timer.end();

    return NextResponse.json(
      {
        type,
        recommendations,
        count: recommendations.length,
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=600", // Cache for 10 minutes
        },
      },
    );
  } catch (error) {
    timer.end();
    logger.error({ error: error }, "Recommendations API error");

    return NextResponse.json(
      {
        error: "Failed to get recommendations",
        message:
          process.env.NODE_ENV === "production" ? "An error occurred" : (error as Error).message,
      },
      { status: 500 },
    );
  }
}
