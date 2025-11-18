// Sentry Error Tracking Configuration
// Initialize Sentry for error monitoring and performance tracking

// Type definitions for Sentry (optional dependency)
let Sentry: any = null;

// Try to import Sentry if available
try {
  Sentry = require("@sentry/nextjs");
} catch {
  console.warn(
    "[SENTRY] @sentry/nextjs not installed. Error tracking disabled.",
  );
}

export function initSentry() {
  if (!Sentry) return;

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === "production",

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      profilesSampleRate: 0.1, // 10% of transactions

      // Error Filtering
      beforeSend(event: any, hint: any) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException;

          // Ignore cancelled requests
          if (error && typeof error === "object" && "name" in error) {
            if (error.name === "AbortError") return null;
          }
        }

        // Scrub sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
          }
        }

        return event;
      },

      // Integrations (BrowserTracing and Replay only available on client-side)
      integrations: [],
    });
  }
}

// Custom error tracking
export function captureError(error: Error, context?: Record<string, any>) {
  console.error("[ERROR]", error, context);

  if (process.env.NODE_ENV === "production" && Sentry) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

// Custom event tracking
export function captureEvent(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, any>,
) {
  console.log(`[${level.toUpperCase()}]`, message, context);

  if (process.env.NODE_ENV === "production" && Sentry) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }
}

// Set user context
export function setUser(user: { id: string; email?: string; role?: string }) {
  if (!Sentry) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });

  Sentry.setContext("user_details", {
    role: user.role,
  });
}

// Clear user context (on logout)
export function clearUser() {
  if (!Sentry) return;

  Sentry.setUser(null);
}
