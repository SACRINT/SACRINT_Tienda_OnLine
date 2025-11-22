/**
 * Sentry Edge Runtime Configuration
 * Tracks errors in Edge Functions (Middleware, Edge API Routes)
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development";

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: SENTRY_ENVIRONMENT,

  // Performance Monitoring (lower sample rate for edge)
  tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.05 : 0.5,

  beforeSend(event) {
    // Sanitize sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    return event;
  },
});
