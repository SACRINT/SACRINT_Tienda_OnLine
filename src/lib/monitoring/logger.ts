// Structured Logging System
// Production-ready logging with levels, context, and formatting

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  action?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;

  constructor() {
    this.minLevel = process.env.NODE_ENV === "production" ? "info" : "debug";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const json = JSON.stringify(entry);

    switch (entry.level) {
      case "debug":
        console.debug(json);
        break;
      case "info":
        console.info(json);
        break;
      case "warn":
        console.warn(json);
        break;
      case "error":
        console.error(json);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      this.output(this.formatEntry("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog("info")) {
      this.output(this.formatEntry("info", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog("warn")) {
      this.output(this.formatEntry("warn", message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog("error")) {
      this.output(this.formatEntry("error", message, context, error));
    }
  }

  // Audit logging for security events
  audit(action: string, context: LogContext): void {
    this.info("AUDIT: " + action, { ...context, action, audit: true });
  }

  // Performance logging
  perf(operation: string, durationMs: number, context?: LogContext): void {
    this.info("PERF: " + operation, {
      ...context,
      operation,
      durationMs,
      perf: true,
    });
  }
}

export const logger = new Logger();

// Request context helper
export function createRequestContext(
  request: Request,
  userId?: string,
  tenantId?: string
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
