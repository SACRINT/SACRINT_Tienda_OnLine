/**
 * Sentry Server Configuration
 * Error tracking and performance monitoring for Node.js/Next.js server
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Performance Monitoring
    enabled: process.env.NODE_ENV === "production",

    integrations: [Sentry.httpIntegration(), Sentry.prismaIntegration()],

    // Ignore common errors
    ignoreErrors: ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "AbortError"],

    beforeSend(event) {
      // Filter out PII data
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }

      // Filter sensitive data from extra context
      if (event.extra) {
        delete event.extra.password;
        delete event.extra.token;
        delete event.extra.apiKey;
      }

      return event;
    },
  });
}
