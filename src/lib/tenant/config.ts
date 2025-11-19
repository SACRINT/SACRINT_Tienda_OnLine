// Tenant Configuration

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  subdomain?: string;
  settings: TenantSettings;
  branding: TenantBranding;
  limits: TenantLimits;
  features: string[];
  status: "active" | "suspended" | "trial" | "cancelled";
  plan: "free" | "starter" | "professional" | "enterprise";
  createdAt: Date;
}

export interface TenantSettings {
  currency: string;
  locale: string;
  timezone: string;
  taxRate: number;
  shippingEnabled: boolean;
  reviewsEnabled: boolean;
  inventoryTracking: boolean;
  lowStockThreshold: number;
  orderPrefix: string;
  invoicePrefix: string;
  autoFulfill: boolean;
  requireLogin: boolean;
  allowGuestCheckout: boolean;
}

export interface TenantBranding {
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  customCss?: string;
  headerHtml?: string;
  footerHtml?: string;
}

export interface TenantLimits {
  products: number;
  categories: number;
  orders: number;
  storage: number; // MB
  bandwidth: number; // GB
  users: number;
  apiCalls: number;
}

// Default configurations by plan
export const PLAN_CONFIGS: Record<
  TenantConfig["plan"],
  { limits: TenantLimits; features: string[] }
> = {
  free: {
    limits: {
      products: 10,
      categories: 5,
      orders: 50,
      storage: 100,
      bandwidth: 1,
      users: 1,
      apiCalls: 1000,
    },
    features: ["basic_analytics", "email_support"],
  },
  starter: {
    limits: {
      products: 100,
      categories: 20,
      orders: 500,
      storage: 1000,
      bandwidth: 10,
      users: 3,
      apiCalls: 10000,
    },
    features: [
      "basic_analytics",
      "advanced_analytics",
      "custom_domain",
      "email_support",
      "inventory_tracking",
    ],
  },
  professional: {
    limits: {
      products: 1000,
      categories: 100,
      orders: 5000,
      storage: 10000,
      bandwidth: 100,
      users: 10,
      apiCalls: 100000,
    },
    features: [
      "basic_analytics",
      "advanced_analytics",
      "custom_domain",
      "white_label",
      "priority_support",
      "inventory_tracking",
      "multi_currency",
      "api_access",
      "webhooks",
    ],
  },
  enterprise: {
    limits: {
      products: -1, // Unlimited
      categories: -1,
      orders: -1,
      storage: 100000,
      bandwidth: 1000,
      users: -1,
      apiCalls: -1,
    },
    features: [
      "basic_analytics",
      "advanced_analytics",
      "custom_domain",
      "white_label",
      "priority_support",
      "inventory_tracking",
      "multi_currency",
      "api_access",
      "webhooks",
      "sso",
      "dedicated_support",
      "custom_integrations",
      "sla",
    ],
  },
};

// Default tenant settings
export const DEFAULT_SETTINGS: TenantSettings = {
  currency: "MXN",
  locale: "es-MX",
  timezone: "America/Mexico_City",
  taxRate: 16,
  shippingEnabled: true,
  reviewsEnabled: true,
  inventoryTracking: true,
  lowStockThreshold: 5,
  orderPrefix: "ORD-",
  invoicePrefix: "INV-",
  autoFulfill: false,
  requireLogin: false,
  allowGuestCheckout: true,
};

// Default branding
export const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  accentColor: "#3b82f6",
};
