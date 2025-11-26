/**
 * Shipping Settings Management - Task 16.10
 * Store shipping preferences and configurations
 */

import { db } from "@/lib/db";
import { ShippingProviderType } from "./provider-manager";

export interface ShippingSettings {
  tenantId: string;

  // Enabled carriers
  enabledProviders: ShippingProviderType[];

  // Carrier preferences by zone/region
  preferredProvidersByZone: Record<string, ShippingProviderType>;

  // Markup configuration (add extra cost to shipping)
  markup: {
    type: "PERCENTAGE" | "FIXED";
    value: number; // Percentage (e.g., 10 for 10%) or fixed amount
  };

  // Default service type
  defaultServiceType: "STANDARD" | "EXPRESS" | "OVERNIGHT";

  // Packaging weight (added to product weight)
  packagingWeight: number; // in kg

  // Origin address (warehouse/store location)
  originAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Free shipping thresholds
  freeShippingThreshold?: number; // Order amount for free shipping

  // Auto-generate labels
  autoGenerateLabels: boolean;
}

const DEFAULT_SETTINGS: Omit<ShippingSettings, "tenantId"> = {
  enabledProviders: ["ESTAFETA", "MERCADO_ENVIOS"],
  preferredProvidersByZone: {},
  markup: {
    type: "PERCENTAGE",
    value: 10,
  },
  defaultServiceType: "STANDARD",
  packagingWeight: 0.1, // 100g default
  originAddress: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "MX",
  },
  freeShippingThreshold: undefined,
  autoGenerateLabels: false,
};

export async function getShippingSettings(tenantId: string): Promise<ShippingSettings> {
  // In production, store in database
  // For now, use tenant featureFlags JSON field
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { featureFlags: true },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const flags = tenant.featureFlags as any;
  const shippingSettings = flags.shippingSettings || {};

  return {
    tenantId,
    ...DEFAULT_SETTINGS,
    ...shippingSettings,
  };
}

export async function updateShippingSettings(
  tenantId: string,
  updates: Partial<Omit<ShippingSettings, "tenantId">>
): Promise<ShippingSettings> {
  const current = await getShippingSettings(tenantId);
  const updated = { ...current, ...updates };

  // Store in tenant featureFlags
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { featureFlags: true },
  });

  const flags = (tenant?.featureFlags as any) || {};
  flags.shippingSettings = updated;

  await db.tenant.update({
    where: { id: tenantId },
    data: { featureFlags: flags },
  });

  return updated;
}

export function calculateShippingCost(
  baseRate: number,
  settings: ShippingSettings
): number {
  if (settings.markup.type === "PERCENTAGE") {
    return baseRate * (1 + settings.markup.value / 100);
  } else {
    return baseRate + settings.markup.value;
  }
}

export function getPreferredProvider(
  zipCode: string,
  settings: ShippingSettings
): ShippingProviderType {
  // Try zone-based preference
  const zone = getZoneFromZipCode(zipCode);
  if (zone && settings.preferredProvidersByZone[zone]) {
    return settings.preferredProvidersByZone[zone];
  }

  // Return first enabled provider
  return settings.enabledProviders[0] || "ESTAFETA";
}

function getZoneFromZipCode(zipCode: string): string | null {
  // Mexican ZIP code zones (first 2 digits)
  const prefix = zipCode.slice(0, 2);

  // Example zones (expand based on actual geography)
  const zones: Record<string, string> = {
    "01": "NORTH",
    "06": "CENTRAL",
    "44": "WEST",
    "64": "NORTH",
    // ... more zones
  };

  return zones[prefix] || null;
}
