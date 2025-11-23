// Environment Variables Validation
// ✅ SECURITY [P0.5]: Validates all required env variables at startup
// Fail-fast approach: App won't start with missing/invalid config

import { z } from "zod";
import { logger } from "@/lib/monitoring/logger";

/**
 * Environment Variable Schema
 * Validates all required environment variables using Zod
 *
 * Features:
 * - Type-safe environment variables
 * - Format validation (URLs, prefixes, etc.)
 * - Clear error messages for missing/invalid variables
 * - Fail-fast at startup (not at runtime)
 */
const envSchema = z.object({
  // ========================================
  // DATABASE
  // ========================================
  DATABASE_URL: z
    .string()
    .url()
    .startsWith("postgresql://", {
      message: "DATABASE_URL must be a PostgreSQL connection string",
    })
    .describe("PostgreSQL database connection string (Neon)"),

  // ========================================
  // AUTHENTICATION (NextAuth.js)
  // ========================================
  NEXTAUTH_SECRET: z
    .string()
    .min(32, {
      message:
        "NEXTAUTH_SECRET must be at least 32 characters long. Generate with: openssl rand -base64 32",
    })
    .describe("NextAuth.js JWT signing secret"),

  NEXTAUTH_URL: z
    .string()
    .url()
    .describe("Base URL of the application (http://localhost:3000 or https://yourdomain.com)"),

  // ========================================
  // GOOGLE OAUTH
  // ========================================
  GOOGLE_ID: z
    .string()
    .min(1, { message: "GOOGLE_ID is required for OAuth" })
    .describe("Google OAuth Client ID"),

  GOOGLE_SECRET: z
    .string()
    .min(1, { message: "GOOGLE_SECRET is required for OAuth" })
    .describe("Google OAuth Client Secret"),

  // ========================================
  // STRIPE (Payment Processing)
  // ========================================
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^sk_(test|live)_/, {
      message: "STRIPE_SECRET_KEY must start with 'sk_test_' or 'sk_live_'",
    })
    .describe("Stripe secret key (server-side)"),

  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^pk_(test|live)_/, {
      message: "STRIPE_PUBLISHABLE_KEY must start with 'pk_test_' or 'pk_live_'",
    })
    .describe("Stripe publishable key (client-side)"),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", {
      message: "STRIPE_WEBHOOK_SECRET must start with 'whsec_'",
    })
    .describe("Stripe webhook signing secret"),

  // ========================================
  // MERCADO PAGO (Latin American Payments)
  // ========================================
  MERCADOPAGO_ACCESS_TOKEN: z
    .string()
    .startsWith("APP_USR-", {
      message: "MERCADOPAGO_ACCESS_TOKEN must start with 'APP_USR-'",
    })
    .describe("MercadoPago access token"),

  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: z
    .string()
    .startsWith("APP_USR-", {
      message: "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY must start with 'APP_USR-'",
    })
    .describe("MercadoPago public key (client-side)"),

  // ========================================
  // EMAIL (Transactional)
  // ========================================
  RESEND_API_KEY: z
    .string()
    .startsWith("re_", {
      message: "RESEND_API_KEY must start with 're_'",
    })
    .describe("Resend API key for transactional emails"),

  // ========================================
  // REDIS (Caching - Optional)
  // ========================================
  REDIS_URL: z
    .string()
    .url()
    .startsWith("redis", {
      message: "REDIS_URL must start with 'redis://' or 'rediss://'",
    })
    .optional()
    .describe("Redis connection URL (optional, falls back to memory cache)"),

  // ========================================
  // APP CONFIGURATION
  // ========================================
  NEXT_PUBLIC_APP_URL: z.string().url().describe("Public-facing application URL"),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^pk_(test|live)_/, {
      message: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with 'pk_test_' or 'pk_live_'",
    })
    .describe("Stripe publishable key exposed to client"),

  // ========================================
  // LOGGING & MONITORING (Optional)
  // ========================================
  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .describe("Sentry DSN for error tracking (optional)"),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info")
    .describe("Logging level (trace, debug, info, warn, error, fatal)"),

  // ========================================
  // NODE ENVIRONMENT
  // ========================================
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development")
    .describe("Node.js environment"),
});

/**
 * Validated environment variables
 * Type-safe access to all environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 * Throws error if any required variable is missing or invalid
 *
 * @throws {Error} If validation fails
 * @returns {Env} Validated environment variables
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);

    logger.info(
      {
        nodeEnv: parsed.NODE_ENV,
        logLevel: parsed.LOG_LEVEL,
        hasRedis: !!parsed.REDIS_URL,
        hasSentry: !!parsed.NEXT_PUBLIC_SENTRY_DSN,
      },
      "Environment variables validated successfully",
    );

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join(".");
        return `  - ${path}: ${err.message}`;
      });

      const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ENVIRONMENT VARIABLES VALIDATION FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are missing or invalid:

${missingVars.join("\n")}

📋 Required Steps:
1. Copy .env.example to .env (if not exists)
2. Fill in all required values
3. Ensure all variables follow the correct format
4. Restart the application

💡 Tips:
- NEXTAUTH_SECRET: Generate with \`openssl rand -base64 32\`
- DATABASE_URL: Get from Neon dashboard
- STRIPE keys: Get from Stripe dashboard
- GOOGLE OAuth: Get from Google Cloud Console

For more information, see: /docs/ENVIRONMENT-VARIABLES-AUDIT.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `;

      console.error(errorMessage);
      logger.fatal({ errors: error.errors }, "Environment validation failed");

      // Fail fast - don't start the app with invalid config
      throw new Error("Environment validation failed. See error message above.");
    }

    throw error;
  }
}

/**
 * Validated environment variables (singleton)
 * Safe to import and use throughout the application
 */
export const env = validateEnv();

/**
 * Helper to check if running in production
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Helper to check if running in development
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Helper to check if running in test
 */
export const isTest = env.NODE_ENV === "test";
