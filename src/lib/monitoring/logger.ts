/**
 * Advanced Logging System with Pino
 * Production-ready logging with levels, context, performance tracking, and error reporting
 */

import pino from "pino";
import * as Sentry from "@sentry/nextjs";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  action?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  msg: string;
  time: number;
  context?: LogContext;
  err?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Create Pino logger instance with environment-based configuration
 */
function createLogger() {
  const isDev = process.env.NODE_ENV !== "production";
  const logLevel = process.env.LOG_LEVEL || (isDev ? "debug" : "info");

  return pino({
    level: logLevel,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
    base: {
      env: process.env.NODE_ENV,
      revision: process.env.VERCEL_GIT_COMMIT_SHA,
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  });
}

/**
 * Advanced Logger class with Sentry integration
 */
class AdvancedLogger {
  private pino: pino.Logger;
  private sentryEnabled: boolean;

  constructor() {
    this.pino = createLogger();
    this.sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  }

  /**
   * Merge context with log entry
   */
  private mergeContext(msg: string, context?: LogContext) {
    return context ? { msg, ...context } : { msg };
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(
    error: Error,
    level: "warning" | "error" | "fatal",
    context?: LogContext,
  ) {
    if (!this.sentryEnabled) return;

    Sentry.withScope((scope) => {
      scope.setLevel(level);

      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }

      if (context?.tenantId) {
        scope.setTag("tenantId", context.tenantId);
      }

      if (context?.requestId) {
        scope.setTag("requestId", context.requestId);
      }

      // Add all context as extras
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureException(error);
    });
  }

  trace(msg: string, context?: LogContext): void {
    this.pino.trace(this.mergeContext(msg, context));
  }

  debug(msg: string, context?: LogContext): void {
    this.pino.debug(this.mergeContext(msg, context));
  }

  info(msg: string, context?: LogContext): void {
    this.pino.info(this.mergeContext(msg, context));
  }

  warn(msg: string, context?: LogContext): void {
    this.pino.warn(this.mergeContext(msg, context));
  }

  error(msg: string, error?: Error, context?: LogContext): void {
    const logData = this.mergeContext(msg, context);

    if (error) {
      this.pino.error({ ...logData, err: error });
      this.sendToSentry(error, "error", context);
    } else {
      this.pino.error(logData);
    }
  }

  fatal(msg: string, error?: Error, context?: LogContext): void {
    const logData = this.mergeContext(msg, context);

    if (error) {
      this.pino.fatal({ ...logData, err: error });
      this.sendToSentry(error, "fatal", context);
    } else {
      this.pino.fatal(logData);
    }
  }

  /**
   * Audit logging for security-sensitive operations
   */
  audit(action: string, context: LogContext): void {
    this.info(`[AUDIT] ${action}`, {
      ...context,
      action,
      audit: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Performance logging with duration tracking
   */
  perf(operation: string, durationMs: number, context?: LogContext): void {
    this.info(`[PERF] ${operation}`, {
      ...context,
      operation,
      durationMs,
      perf: true,
    });

    // Alert if operation took too long
    if (durationMs > 5000) {
      this.warn(`Slow operation detected: ${operation}`, {
        ...context,
        durationMs,
      });
    }
  }

  /**
   * Database query logging
   */
  query(
    query: string,
    durationMs: number,
    context?: LogContext & { params?: unknown[] },
  ): void {
    this.debug(`[DB] ${query}`, {
      ...context,
      durationMs,
      query,
    });

    // Alert on slow queries
    if (durationMs > 1000) {
      this.warn(`Slow query detected: ${query}`, { ...context, durationMs });
    }
  }

  /**
   * HTTP request logging
   */
  request(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
    context?: LogContext,
  ): void {
    const requestContext: LogContext = {
      ...context,
      method,
      url,
      statusCode,
      durationMs,
      http: true,
    };

    if (statusCode >= 500) {
      this.error(
        `[HTTP] ${method} ${url} ${statusCode}`,
        undefined,
        requestContext,
      );
    } else if (statusCode >= 400) {
      this.warn(`[HTTP] ${method} ${url} ${statusCode}`, requestContext);
    } else {
      this.info(`[HTTP] ${method} ${url} ${statusCode}`, requestContext);
    }
  }

  /**
   * Cache hit/miss logging
   */
  cache(
    operation: "hit" | "miss" | "set" | "del",
    key: string,
    context?: LogContext,
  ): void {
    this.debug(`[CACHE] ${operation.toUpperCase()} ${key}`, {
      ...context,
      cacheOperation: operation,
      cacheKey: key,
    });
  }

  /**
   * Create child logger with bound context
   */
  child(context: LogContext): AdvancedLogger {
    const childLogger = new AdvancedLogger();
    childLogger.pino = this.pino.child(context);
    childLogger.sentryEnabled = this.sentryEnabled;
    return childLogger;
  }
}

export const logger = new AdvancedLogger();

/**
 * Create request context from Next.js request
 */
export function createRequestContext(
  request: Request,
  userId?: string,
  tenantId?: string,
): LogContext {
  return {
    userId,
    tenantId,
    requestId: crypto.randomUUID(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}

/**
 * Performance timer utility
 */
export class PerfTimer {
  private startTime: number;
  private operation: string;
  private context?: LogContext;

  constructor(operation: string, context?: LogContext) {
    this.operation = operation;
    this.context = context;
    this.startTime = Date.now();
  }

  end(): number {
    const duration = Date.now() - this.startTime;
    logger.perf(this.operation, duration, this.context);
    return duration;
  }

  endWithResult<T>(result: T): T {
    this.end();
    return result;
  }

  async endAsync<T>(promise: Promise<T>): Promise<T> {
    try {
      const result = await promise;
      this.end();
      return result;
    } catch (error) {
      this.end();
      throw error;
    }
  }
}

/**
 * Performance decorator for async functions
 */
export function logPerformance(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const opName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const timer = new PerfTimer(opName);
      try {
        const result = await originalMethod.apply(this, args);
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };

    return descriptor;
  };
}
