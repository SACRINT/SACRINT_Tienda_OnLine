/**
 * Tracking Update Cron API - Task 16.7
 * GET /api/cron/update-tracking
 * Triggered by Vercel Cron every 6 hours
 */

import { NextRequest, NextResponse } from "next/server";
import { updateTrackingForAllOrders } from "@/lib/cron/update-tracking";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await updateTrackingForAllOrders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
