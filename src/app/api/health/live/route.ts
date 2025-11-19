// Liveness Probe API
import { NextResponse } from "next/server";
import { getLivenessStatus } from "@/lib/deployment/health-check";

// GET /api/health/live - Liveness check
export async function GET() {
  return NextResponse.json(getLivenessStatus());
}
