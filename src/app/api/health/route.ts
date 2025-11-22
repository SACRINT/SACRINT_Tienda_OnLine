/**
 * Health Check Endpoint
 * Returns application health status and dependencies
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: "healthy" | "unhealthy";
      latency?: number;
      error?: string;
    };
    memory: {
      status: "healthy" | "degraded" | "unhealthy";
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: "healthy",
      },
      memory: {
        status: "healthy",
        used: 0,
        total: 0,
        percentage: 0,
      },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    health.checks.database = {
      status: "healthy",
      latency: dbLatency,
    };

    if (dbLatency > 1000) {
      health.status = "degraded";
      health.checks.database.status = "unhealthy";
    }
  } catch (error) {
    health.status = "unhealthy";
    health.checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  health.checks.memory = {
    status: memoryPercentage > 90 ? "unhealthy" : memoryPercentage > 75 ? "degraded" : "healthy",
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(memoryPercentage),
  };

  if (health.checks.memory.status !== "healthy" && health.status === "healthy") {
    health.status = "degraded";
  }

  // Determine HTTP status code
  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
