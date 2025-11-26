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

// Wrapper para API routes con Sentry
export function withSentry(handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    const start = Date.now()

    try {
      const result = await handler(req, res)
      const duration = Date.now() - start
      console.log('[Sentry] Request completado', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: duration + 'ms',
      })
      return result
    } catch (error) {
      const duration = Date.now() - start
      captureError(error as Error, {
        method: req.method,
        url: req.url,
        duration: duration + 'ms',
      })
      throw error
    }
  }
}

// Iniciar transacción de monitoreo
export interface Transaction {
  setStatus: (status: string) => void
  finish: () => void
  addBreadcrumb: (message: string) => void
}

export function startTransaction(name: string, op: string = 'http.request'): Transaction {
  const startTime = Date.now()
  const breadcrumbs: string[] = []

  return {
    setStatus: (status: string) => {
      console.log('[Sentry] Transacción status:', { name, status })
    },
    addBreadcrumb: (message: string) => {
      breadcrumbs.push(message)
      console.log('[Sentry] Breadcrumb agregado:', { name, message })
    },
    finish: () => {
      const duration = Date.now() - startTime
      console.log('[Sentry] Transacción finalizada:', {
        name,
        duration: duration + 'ms',
        op,
        breadcrumbs: breadcrumbs.length,
      })
    },
  }
}

// Agregar tags al contexto
export function addTag(key: string, value: string) {
  if (!Sentry) return
  Sentry.setTag(key, value)
  console.log('[Sentry] Tag agregado:', { key, value })
}

// Agregar contexto personalizado
export function addContext(key: string, context: Record<string, unknown>) {
  if (!Sentry) return
  Sentry.setContext(key, context)
  console.log('[Sentry] Contexto agregado:', { key, context })
}
