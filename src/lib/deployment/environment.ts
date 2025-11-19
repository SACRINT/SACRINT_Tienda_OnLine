// Environment Configuration & Validation

export type Environment = "development" | "staging" | "production" | "test";

// Get current environment
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV;

  switch (env) {
    case "production":
      return "production";
    case "test":
      return "test";
    case "development":
    default:
      if (process.env.VERCEL_ENV === "preview") {
        return "staging";
      }
      return "development";
  }
}

// Check if production
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

// Check if development
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

// Check if staging
export function isStaging(): boolean {
  return getEnvironment() === "staging";
}

// Check if test
export function isTest(): boolean {
  return getEnvironment() === "test";
}

// Environment variable schema
interface EnvSchema {
  key: string;
  required: boolean;
  default?: string;
  validate?: (value: string) => boolean;
  description?: string;
}

const envSchema: EnvSchema[] = [
  // Database
  {
    key: "DATABASE_URL",
    required: true,
    description: "PostgreSQL connection string",
    validate: (v) => v.startsWith("postgres"),
  },

  // Auth
  {
    key: "NEXTAUTH_SECRET",
    required: true,
    description: "NextAuth.js secret key",
    validate: (v) => v.length >= 32,
  },
  {
    key: "NEXTAUTH_URL",
    required: true,
    description: "NextAuth.js base URL",
    validate: (v) => v.startsWith("http"),
  },
  {
    key: "GOOGLE_CLIENT_ID",
    required: false,
    description: "Google OAuth client ID",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    required: false,
    description: "Google OAuth client secret",
  },

  // Payments
  {
    key: "STRIPE_SECRET_KEY",
    required: false,
    description: "Stripe secret key",
    validate: (v) => v.startsWith("sk_"),
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    required: false,
    description: "Stripe webhook secret",
    validate: (v) => v.startsWith("whsec_"),
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    required: false,
    description: "Stripe publishable key",
    validate: (v) => v.startsWith("pk_"),
  },

  // Email
  {
    key: "RESEND_API_KEY",
    required: false,
    description: "Resend API key",
  },
  {
    key: "EMAIL_FROM",
    required: false,
    default: "noreply@example.com",
    description: "Default from email address",
  },

  // Storage
  {
    key: "STORAGE_BUCKET",
    required: false,
    description: "Cloud storage bucket name",
  },

  // Analytics
  {
    key: "NEXT_PUBLIC_GA_ID",
    required: false,
    description: "Google Analytics ID",
  },

  // Sentry
  {
    key: "SENTRY_DSN",
    required: false,
    description: "Sentry DSN for error tracking",
  },
];

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate environment variables
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const schema of envSchema) {
    const value = process.env[schema.key];

    if (!value) {
      if (schema.required) {
        errors.push("Missing required: " + schema.key + " - " + schema.description);
      } else if (schema.default) {
        // Use default
        continue;
      }
    } else if (schema.validate && !schema.validate(value)) {
      errors.push("Invalid format: " + schema.key);
    }
  }

  // Environment-specific checks
  const env = getEnvironment();

  if (env === "production") {
    if (!process.env.STRIPE_SECRET_KEY) {
      warnings.push("Stripe not configured for production");
    }
    if (!process.env.SENTRY_DSN) {
      warnings.push("Sentry not configured for production");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Get environment variable with fallback
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value) return value;

  const schema = envSchema.find((s) => s.key === key);
  if (schema?.default) return schema.default;

  return defaultValue || "";
}

// Get required environment variable
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error("Missing required environment variable: " + key);
  }
  return value;
}

// Print environment status
export function printEnvironmentStatus(): void {
  const env = getEnvironment();
  const validation = validateEnvironment();

  console.log("\n=== Environment Status ===");
  console.log("Environment:", env);
  console.log("Valid:", validation.valid);

  if (validation.errors.length > 0) {
    console.log("\nErrors:");
    validation.errors.forEach((e) => console.log("  - " + e));
  }

  if (validation.warnings.length > 0) {
    console.log("\nWarnings:");
    validation.warnings.forEach((w) => console.log("  - " + w));
  }

  console.log("========================\n");
}
