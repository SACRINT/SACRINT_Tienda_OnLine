/**
 * Sentry Server-Side Configuration
 * Tracks errors and performance in Node.js/Next.js server
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development";

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: SENTRY_ENVIRONMENT,

  // Performance Monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

  // Enable HTTP instrumentation
  integrations: [Sentry.httpIntegration(), Sentry.prismaIntegration()],

  beforeSend(event, hint) {
    // Sanitize sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.["authorization"];
      delete event.request.headers?.["cookie"];
    }

    // Remove sensitive query parameters
    if (event.request?.query_string) {
      const sensitiveParams = ["password", "token", "secret", "apiKey"];
      sensitiveParams.forEach((param) => {
        event.request!.query_string = event.request!.query_string?.replace(
          new RegExp(`${param}=[^&]*`, "gi"),
          `${param}=[REDACTED]`,
        );
      });
    }

    return event;
  },

  beforeSendTransaction(event) {
    // Filter out health check transactions
    if (event.transaction?.includes("/api/health")) {
      return null;
    }

    return event;
  },
});
