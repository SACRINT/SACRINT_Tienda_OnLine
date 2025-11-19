// Web Vitals Analytics API
// Receives and stores Core Web Vitals metrics

import { NextRequest, NextResponse } from "next/server";

interface VitalsMetric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

// In-memory storage for development
// In production, use a proper database or analytics service
const metricsStore: VitalsMetric[] = [];
const MAX_METRICS = 1000;

export async function POST(request: NextRequest) {
  try {
    const metric = (await request.json()) as VitalsMetric;

    // Validate metric
    if (!metric.name || typeof metric.value !== "number") {
      return NextResponse.json(
        { error: "Invalid metric data" },
        { status: 400 },
      );
    }

    // Store metric
    metricsStore.push(metric);

    // Keep only recent metrics
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      );
    }

    // In production, send to analytics service
    // await sendToAnalyticsService(metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Vitals] Error processing metric:", error);
    return NextResponse.json(
      { error: "Failed to process metric" },
      { status: 500 },
    );
  }
}

// Get aggregated metrics
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");
  const hours = parseInt(searchParams.get("hours") || "24", 10);

  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  let filtered = metricsStore.filter((m) => m.timestamp > cutoff);

  if (name) {
    filtered = filtered.filter((m) => m.name === name);
  }

  // Calculate aggregates
  const aggregates: Record<
    string,
    { count: number; sum: number; ratings: Record<string, number> }
  > = {};

  for (const metric of filtered) {
    if (!aggregates[metric.name]) {
      aggregates[metric.name] = {
        count: 0,
        sum: 0,
        ratings: { good: 0, "needs-improvement": 0, poor: 0 },
      };
    }

    aggregates[metric.name].count++;
    aggregates[metric.name].sum += metric.value;
    aggregates[metric.name].ratings[metric.rating]++;
  }

  // Format response
  const result = Object.entries(aggregates).map(([metricName, data]) => ({
    name: metricName,
    count: data.count,
    avg: data.sum / data.count,
    ratings: data.ratings,
    goodPercent: (data.ratings.good / data.count) * 100,
  }));

  return NextResponse.json({
    metrics: result,
    period: `${hours}h`,
    total: filtered.length,
  });
}
