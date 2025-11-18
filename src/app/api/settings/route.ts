// GET /api/settings
// PUT /api/settings
// Store settings management

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const SettingsSchema = z.object({
  tenantId: z.string().uuid(),
  settings: z.object({
    storeName: z.string().min(1).optional(),
    storeDescription: z.string().optional(),
    storeEmail: z.string().email().optional(),
    storePhone: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    enableInventoryTracking: z.boolean().optional(),
    stripePublishableKey: z.string().optional(),
    stripeSecretKey: z.string().optional(),
    enableShipping: z.boolean().optional(),
    freeShippingThreshold: z.number().int().min(0).optional(),
    defaultShippingCost: z.number().int().min(0).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    enableTax: z.boolean().optional(),
  }),
});

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "STORE_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    if (
      session.user.role === "STORE_OWNER" &&
      session.user.tenantId !== tenantId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get tenant with basic info
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        featureFlags: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Merge with defaults
    const defaultSettings = {
      storeName: tenant.name || "",
      storeDescription: "",
      storeEmail: "",
      storePhone: "",
      currency: "USD",
      timezone: "America/New_York",
      lowStockThreshold: 10,
      enableInventoryTracking: true,
      stripePublishableKey: "",
      stripeSecretKey: "",
      enableShipping: true,
      freeShippingThreshold: 5000,
      defaultShippingCost: 999,
      taxRate: 8.5,
      enableTax: true,
    };

    const settings = { ...defaultSettings, ...(tenant.featureFlags as any) };

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "STORE_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = SettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { tenantId, settings } = validation.data;

    if (
      session.user.role === "STORE_OWNER" &&
      session.user.tenantId !== tenantId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update tenant feature flags (stored as JSON)
    const updated = await db.tenant.update({
      where: { id: tenantId },
      data: {
        featureFlags: settings as any,
      },
    });

    // TODO: Activity logging - implement with dedicated activity log model if needed
    console.log("[Settings API] Tenant settings updated", {
      tenantId,
      userId: session.user.id,
      updatedFields: Object.keys(settings),
    });

    return NextResponse.json({
      success: true,
      settings: settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
