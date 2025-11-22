/**
 * Metrics Endpoint
 * Returns application metrics (protected endpoint)
 */

import { NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/monitoring/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Simple auth check - in production use proper authentication
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.METRICS_API_KEY;

  if (apiKey && authHeader !== `Bearer \${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allMetrics = metrics.getAll();
  const metricsArray = Array.from(allMetrics.values()).flat();

  // Group metrics by name
  const groupedMetrics = metricsArray.reduce(
    (acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    },
    {} as Record<string, typeof metricsArray>,
  );

  // Calculate statistics
  const statistics = Object.entries(groupedMetrics).map(([name, metrics]) => {
    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      name,
      count: values.length,
      sum,
      avg: Math.round(avg * 100) / 100,
      min,
      max,
      unit: metrics[0].unit,
      latest: metrics[metrics.length - 1],
    };
  });

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      totalMetrics: metricsArray.length,
      uniqueMetrics: Object.keys(groupedMetrics).length,
      statistics,
      raw: process.env.NODE_ENV === "development" ? metricsArray : undefined,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
