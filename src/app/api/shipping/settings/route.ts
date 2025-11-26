/**
 * Shipping Settings API - Task 16.10
 * GET/PUT /api/shipping/settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getShippingSettings, updateShippingSettings } from "@/lib/shipping/settings";
import { z } from "zod";

const SettingsUpdateSchema = z.object({
  tenantId: z.string(),
  enabledProviders: z.array(z.string()).optional(),
  markup: z.object({
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number(),
  }).optional(),
  defaultServiceType: z.enum(["STANDARD", "EXPRESS", "OVERNIGHT"]).optional(),
  packagingWeight: z.number().optional(),
  freeShippingThreshold: z.number().optional().nullable(),
  autoGenerateLabels: z.boolean().optional(),
  originAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const settings = await getShippingSettings(tenantId);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, ...updates } = SettingsUpdateSchema.parse(body);

    const settings = await updateShippingSettings(tenantId, updates);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error updating shipping settings:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update settings", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
