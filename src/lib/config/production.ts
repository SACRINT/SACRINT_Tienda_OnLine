// Production Configuration Utilities

export interface ProductionConfig {
  environment: "development" | "staging" | "production";
  isProduction: boolean;
  siteUrl: string;
  siteName: string;
  features: {
    analytics: boolean;
    pushNotifications: boolean;
    maintenanceMode: boolean;
    debugMode: boolean;
  };
  limits: {
    maxUploadSize: number;
    maxCartItems: number;
    sessionTimeout: number;
    rateLimitWindow: number;
  };
  integrations: {
    stripe: {
      publicKey: string;
      webhookPath: string;
    };
    google: {
      clientId: string;
    };
    email: {
      from: string;
      replyTo: string;
    };
  };
}

// Validate required environment variables
export function validateEnvironment(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    "DATABASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "STRIPE_PUBLIC_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "NEXT_PUBLIC_APP_URL", // ✅ ENV [P1.8]: Consolidated URL variable
  ];

  const recommended = ["EMAIL_FROM", "NEXT_PUBLIC_SITE_NAME"];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check recommended
  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(`Missing recommended: ${key}`);
    }
  }

  // Validate specific values
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push("NEXTAUTH_SECRET should be at least 32 characters");
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.STRIPE_PUBLIC_KEY?.startsWith("pk_test")
  ) {
    warnings.push("Using Stripe test keys in production");
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// Get production configuration
export function getProductionConfig(): ProductionConfig {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    environment: isProduction
      ? "production"
      : process.env.VERCEL_ENV === "preview"
        ? "staging"
        : "development",
    isProduction,
    siteUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000",
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || "SACRINT Tienda Online",
    features: {
      analytics:
        process.env.ENABLE_ANALYTICS === "true" ||
        (isProduction && !!process.env.NEXT_PUBLIC_GA_ID),
      pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === "true",
      maintenanceMode: process.env.MAINTENANCE_MODE === "true",
      debugMode: !isProduction || process.env.DEBUG === "true",
    },
    limits: {
      maxUploadSize: 5 * 1024 * 1024, // 5MB
      maxCartItems: 50,
      sessionTimeout: 30 * 24 * 60 * 60, // 30 days in seconds
      rateLimitWindow: 60 * 1000, // 1 minute
    },
    integrations: {
      stripe: {
        publicKey: process.env.STRIPE_PUBLIC_KEY || "",
        webhookPath: "/api/webhooks/stripe",
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
      },
      email: {
        from: process.env.EMAIL_FROM || "noreply@sacrint.com",
        replyTo: process.env.EMAIL_REPLY_TO || "soporte@sacrint.com",
      },
    },
  };
}

// Log environment info (safe for logging, no secrets)
export function logEnvironmentInfo(): void {
  const config = getProductionConfig();
  const validation = validateEnvironment();

  console.log("=== Environment Info ===");
  console.log(`Environment: ${config.environment}`);
  console.log(`Site URL: ${config.siteUrl}`);
  console.log(`Features:`);
  console.log(`  - Analytics: ${config.features.analytics}`);
  console.log(`  - Push Notifications: ${config.features.pushNotifications}`);
  console.log(`  - Maintenance Mode: ${config.features.maintenanceMode}`);

  if (validation.missing.length > 0) {
    console.error("Missing required variables:", validation.missing);
  }

  if (validation.warnings.length > 0) {
    console.warn("Warnings:", validation.warnings);
  }
}

// Check if current environment is safe for operation
export function isEnvironmentReady(): boolean {
  const validation = validateEnvironment();

  if (!validation.valid) {
    console.error("Environment not ready. Missing:", validation.missing.join(", "));
    return false;
  }

  return true;
}

// Feature flags
export const featureFlags = {
  // Check if a feature is enabled
  isEnabled(feature: keyof ProductionConfig["features"]): boolean {
    const config = getProductionConfig();
    return config.features[feature];
  },

  // Get all feature statuses
  getAll(): ProductionConfig["features"] {
    return getProductionConfig().features;
  },
};

// Rate limit configurations by environment
export function getRateLimitConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    api: {
      max: isProduction ? 100 : 1000,
      windowMs: 60 * 1000,
    },
    auth: {
      max: isProduction ? 5 : 50,
      windowMs: 15 * 60 * 1000,
    },
    checkout: {
      max: isProduction ? 10 : 100,
      windowMs: 60 * 60 * 1000,
    },
  };
}

// Export singleton config
export const config = getProductionConfig();
