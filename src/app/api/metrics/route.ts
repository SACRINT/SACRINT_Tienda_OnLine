// Metrics API Endpoint
// Prometheus-compatible metrics export

import { NextResponse } from "next/server";
import { metricsRegistry } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "prometheus";

  // Add runtime metrics
  addRuntimeMetrics();

  if (format === "json") {
    return NextResponse.json(metricsRegistry.toJSON(), {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // Default to Prometheus format
  const metrics = metricsRegistry.toPrometheus();

  return new NextResponse(metrics, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

function addRuntimeMetrics(): void {
  const memory = process.memoryUsage();

  // Memory metrics
  const memoryMetrics = [
    { name: "nodejs_heap_used_bytes", value: memory.heapUsed },
    { name: "nodejs_heap_total_bytes", value: memory.heapTotal },
    { name: "nodejs_external_bytes", value: memory.external },
    { name: "nodejs_rss_bytes", value: memory.rss },
  ];

  // These would need to be registered metrics in production
  // For now, just log them
  console.debug("Runtime metrics:", memoryMetrics);
}
