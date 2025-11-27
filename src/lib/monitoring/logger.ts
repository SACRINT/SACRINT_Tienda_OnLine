/**
 * Structured Logging Utility
 * Uses Pino for high-performance JSON logging
 */

import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Extend pino logger type to include audit and cache methods
type LoggerWithAudit = pino.Logger & {
  audit: (obj: Record<string, any>, msg?: string) => void;
  cache: (status: "hit" | "miss", key: string) => void;
};

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),

  // Formatting
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        node_version: process.version,
      };
    },
  },

  // Timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive data
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "token",
      "secret",
      "apiKey",
      "creditCard",
      "ssn",
    ],
    remove: true,
  },

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  // Serializers
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      remoteAddress: req.socket?.remoteAddress,
      remotePort: req.socket?.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
}) as LoggerWithAudit;

/**
 * Log levels:
 * - trace: Very detailed logs
 * - debug: Debug information
 * - info: General information
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors
 */

// Helper functions for common logging patterns

/**
 * Log HTTP request
 */
export function logRequest(req: {
  method: string;
  url: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}) {
  logger.info(
    {
      type: "http_request",
      method: req.method,
      url: req.url,
      userAgent: req.headers?.["user-agent"],
    },
    "HTTP Request",
  );
}

/**
 * Log HTTP response
 */
export function logResponse(res: {
  statusCode: number;
  duration: number;
  url: string;
  method: string;
}) {
  const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

  logger[level](
    {
      type: "http_response",
      method: res.method,
      url: res.url,
      statusCode: res.statusCode,
      duration: res.duration,
    },
    "HTTP Response",
  );
}

/**
 * Log database query
 */
export function logDatabaseQuery(query: {
  operation: string;
  model: string;
  duration?: number;
  error?: Error;
}) {
  if (query.error) {
    logger.error(
      {
        type: "database_error",
        operation: query.operation,
        model: query.model,
        duration: query.duration,
        error: query.error,
      },
      "Database Query Failed",
    );
  } else {
    logger.debug(
      {
        type: "database_query",
        operation: query.operation,
        model: query.model,
        duration: query.duration,
      },
      "Database Query",
    );
  }
}

/**
 * Log authentication event
 */
export function logAuth(event: {
  type: "login" | "logout" | "signup" | "password_reset" | "failed_login";
  userId?: string;
  email?: string;
  method?: string;
  success: boolean;
  error?: Error;
}) {
  const level = event.success ? "info" : "warn";

  logger[level](
    {
      type: "auth_event",
      authType: event.type,
      userId: event.userId,
      email: event.email,
      method: event.method,
      success: event.success,
      error: event.error,
    },
    `Authentication: ${event.type}`,
  );
}

/**
 * Log payment event
 */
export function logPayment(event: {
  type: "initiated" | "succeeded" | "failed" | "refunded";
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  error?: Error;
}) {
  const level = event.type === "failed" ? "error" : "info";

  logger[level](
    {
      type: "payment_event",
      paymentType: event.type,
      orderId: event.orderId,
      amount: event.amount,
      currency: event.currency,
      paymentMethod: event.paymentMethod,
      error: event.error,
    },
    `Payment: ${event.type}`,
  );
}

/**
 * Log business metric
 */
export function logMetric(metric: {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}) {
  logger.info(
    {
      type: "metric",
      metric: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
    },
    `Metric: ${metric.name}`,
  );
}

/**
 * Log security event
 */
export function logSecurity(event: {
  type: "suspicious_activity" | "rate_limit" | "ip_blocked" | "invalid_token";
  userId?: string;
  ip?: string;
  details?: Record<string, any>;
}) {
  logger.warn(
    {
      type: "security_event",
      securityType: event.type,
      userId: event.userId,
      ip: event.ip,
      details: event.details,
    },
    `Security: ${event.type}`,
  );
}

/**
 * Log application error
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(
    {
      type: "application_error",
      error,
      ...context,
    },
    error.message,
  );
}

/**
 * Log performance metric
 */
export function logPerformance(perf: {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}) {
  logger.info(
    {
      type: "performance",
      operation: perf.operation,
      duration: perf.duration,
      ...perf.metadata,
    },
    `Performance: ${perf.operation}`,
  );
}

/**
 * Audit logger for security-critical events
 */
logger.audit = function (obj: Record<string, any>, msg?: string) {
  logger.info({ ...obj, audit: true }, msg || "Audit event");
};

/**
 * Cache hit/miss logger
 */
logger.cache = function (status: "hit" | "miss", key: string) {
  logger.debug({ type: "cache", status, key }, `Cache ${status}: ${key}`);
};

/**
 * Performance timer utility
 */
export class PerfTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    logPerformance({
      operation: this.operation,
      duration,
      metadata,
    });
    return duration;
  }

  getDuration(): number {
    return Date.now() - this.startTime;
  }
}

export default logger;
