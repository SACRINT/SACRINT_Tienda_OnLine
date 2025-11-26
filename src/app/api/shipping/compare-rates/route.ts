/**
 * Compare Shipping Rates API - Task 16.9
 * POST /api/shipping/compare-rates
 */

import { NextRequest, NextResponse } from "next/server";
import { compareRates } from "@/lib/shipping/rates-cache";
import { z } from "zod";

const CompareRatesSchema = z.object({
  fromZip: z.string().min(5).max(10),
  toZip: z.string().min(5).max(10),
  weight: z.number().positive().max(100), // Max 100kg
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromZip, toZip, weight } = CompareRatesSchema.parse(body);

    const rates = await compareRates(fromZip, toZip, weight);

    return NextResponse.json({
      success: true,
      rates,
      fromZip,
      toZip,
      weight,
    });
  } catch (error) {
    console.error("Error comparing rates:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to compare rates", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
