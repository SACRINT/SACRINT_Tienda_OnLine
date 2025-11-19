// Health Check System

import { db } from "@/lib/db";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message?: string;
  duration?: number;
  lastChecked: Date;
}

// Application start time
const startTime = Date.now();

// Check database connection
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    return {
      name: "database",
      status: "pass",
      message: "Connected",
      duration: Date.now() - start,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      name: "database",
      status: "fail",
      message: error instanceof Error ? error.message : "Connection failed",
      duration: Date.now() - start,
      lastChecked: new Date(),
    };
  }
}

// Check memory usage
function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const percentage = (used.heapUsed / used.heapTotal) * 100;

  let status: "pass" | "warn" | "fail" = "pass";
  if (percentage > 90) status = "fail";
  else if (percentage > 70) status = "warn";

  return {
    name: "memory",
    status,
    message: heapUsedMB + "MB / " + heapTotalMB + "MB (" + percentage.toFixed(1) + "%)",
    lastChecked: new Date(),
  };
}

// Check environment variables
function checkEnvironment(): HealthCheck {
  const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      name: "environment",
      status: "fail",
      message: "Missing: " + missing.join(", "),
      lastChecked: new Date(),
    };
  }

  return {
    name: "environment",
    status: "pass",
    message: "All required variables set",
    lastChecked: new Date(),
  };
}

// Check external services
async function checkExternalServices(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // Check Stripe (if configured)
  if (process.env.STRIPE_SECRET_KEY) {
    const start = Date.now();
    try {
      // Simple connectivity check
      const response = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY,
        },
      });

      checks.push({
        name: "stripe",
        status: response.ok ? "pass" : "warn",
        message: response.ok ? "Connected" : "HTTP " + response.status,
        duration: Date.now() - start,
        lastChecked: new Date(),
      });
    } catch (error) {
      checks.push({
        name: "stripe",
        status: "fail",
        message: error instanceof Error ? error.message : "Connection failed",
        duration: Date.now() - start,
        lastChecked: new Date(),
      });
    }
  }

  return checks;
}

// Main health check function
export async function getHealthStatus(): Promise<HealthStatus> {
  const checks: HealthCheck[] = [];

  // Run all checks
  const [dbCheck, ...externalChecks] = await Promise.all([
    checkDatabase(),
    ...await checkExternalServices() as unknown as Promise<HealthCheck>[],
  ]);

  checks.push(dbCheck);
  checks.push(checkMemory());
  checks.push(checkEnvironment());
  checks.push(...externalChecks);

  // Determine overall status
  const hasFailure = checks.some((c) => c.status === "fail");
  const hasWarning = checks.some((c) => c.status === "warn");

  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (hasFailure) status = "unhealthy";
  else if (hasWarning) status = "degraded";

  return {
    status,
    timestamp: new Date(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Date.now() - startTime,
    checks,
  };
}

// Liveness check (quick)
export function getLivenessStatus(): { status: "ok" | "error"; timestamp: Date } {
  return {
    status: "ok",
    timestamp: new Date(),
  };
}

// Readiness check (can serve traffic)
export async function getReadinessStatus(): Promise<{
  status: "ready" | "not_ready";
  timestamp: Date;
  reason?: string;
}> {
  try {
    // Check database
    await db.$queryRaw`SELECT 1`;

    return {
      status: "ready",
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      status: "not_ready",
      timestamp: new Date(),
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
