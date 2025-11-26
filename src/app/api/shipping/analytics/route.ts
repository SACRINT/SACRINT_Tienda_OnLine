/**
 * Shipping Analytics API - Task 16.12
 * GET /api/shipping/analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { getShippingAnalytics, getShippingTrends } from "@/lib/analytics/shipping-analytics";
import { z } from "zod";

const AnalyticsQuerySchema = z.object({
  tenantId: z.string(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  includeTrends: z.enum(["true", "false"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = AnalyticsQuerySchema.parse({
      tenantId: searchParams.get("tenantId"),
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      includeTrends: searchParams.get("includeTrends") || "false",
    });

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

    if (query.includeTrends === "true" && dateFrom && dateTo) {
      const trends = await getShippingTrends(query.tenantId, dateFrom, dateTo);
      return NextResponse.json({
        success: true,
        ...trends,
      });
    } else {
      const analytics = await getShippingAnalytics(query.tenantId, dateFrom, dateTo);
      return NextResponse.json({
        success: true,
        analytics,
        period: {
          from: (dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toISOString(),
          to: (dateTo || new Date()).toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching shipping analytics:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch analytics", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
