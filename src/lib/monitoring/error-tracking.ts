// Error Tracking & Reporting
// Centralized error handling with context and reporting

import { logger } from "./logger";

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackedError {
  id: string;
  name: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
}

// In-memory error store (use database in production)
const errorStore: TrackedError[] = [];
const MAX_ERRORS = 1000;

// Error severity classification
function classifySeverity(error: Error): TrackedError["severity"] {
  const message = error.message.toLowerCase();
  
  if (message.includes("database") || message.includes("prisma")) {
    return "critical";
  }
  if (message.includes("auth") || message.includes("permission")) {
    return "high";
  }
  if (message.includes("payment") || message.includes("stripe")) {
    return "high";
  }
  if (message.includes("timeout") || message.includes("connection")) {
    return "medium";
  }
  
  return "low";
}

// Track an error
export function trackError(
  error: Error,
  context?: ErrorContext
): TrackedError {
  const tracked: TrackedError = {
    id: crypto.randomUUID(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    severity: classifySeverity(error),
    resolved: false,
  };

  // Store error
  errorStore.push(tracked);
  if (errorStore.length > MAX_ERRORS) {
    errorStore.shift();
  }

  // Log error
  logger.error(error.message, error, context);

  // Send to external service in production
  if (process.env.NODE_ENV === "production") {
    sendToErrorService(tracked);
  }

  return tracked;
}

// Send to external error tracking service
async function sendToErrorService(error: TrackedError): Promise<void> {
  // Sentry, Datadog, etc integration
  // Example: await fetch(process.env.ERROR_SERVICE_URL, { ... });
  console.log("[Error Service] Would send:", error.id);
}

// Get error statistics
export function getErrorStats(): {
  total: number;
  bySeverity: Record<string, number>;
  recent: TrackedError[];
} {
  const bySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const error of errorStore) {
    bySeverity[error.severity]++;
  }

  return {
    total: errorStore.length,
    bySeverity,
    recent: errorStore.slice(-10).reverse(),
  };
}

// Error boundary helper for React
export function captureException(
  error: Error,
  componentStack?: string
): void {
  trackError(error, {
    metadata: { componentStack, type: "react-error-boundary" },
  });
}

// API error handler
export function handleApiError(
  error: Error,
  context?: ErrorContext
): { status: number; message: string } {
  trackError(error, context);

  // Return appropriate status codes
  if (error.message.includes("not found")) {
    return { status: 404, message: "Recurso no encontrado" };
  }
  if (error.message.includes("unauthorized") || error.message.includes("auth")) {
    return { status: 401, message: "No autorizado" };
  }
  if (error.message.includes("forbidden") || error.message.includes("permission")) {
    return { status: 403, message: "Acceso denegado" };
  }
  if (error.message.includes("validation") || error.message.includes("invalid")) {
    return { status: 400, message: "Datos inválidos" };
  }

  return { status: 500, message: "Error interno del servidor" };
}

// Clear resolved errors
export function clearResolvedErrors(): number {
  const before = errorStore.length;
  const filtered = errorStore.filter((e) => !e.resolved);
  errorStore.length = 0;
  errorStore.push(...filtered);
  return before - errorStore.length;
}
