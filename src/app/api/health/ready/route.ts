// Readiness Probe API
import { NextResponse } from "next/server";
import { getReadinessStatus } from "@/lib/deployment/health-check";

// GET /api/health/ready - Readiness check
export async function GET() {
  const status = await getReadinessStatus();
  const statusCode = status.status === "ready" ? 200 : 503;

  return NextResponse.json(status, { status: statusCode });
}
