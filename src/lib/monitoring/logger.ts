// Structured Logging System
// Centralized logging with different levels and formatting

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  tenantId?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      return JSON.stringify(entry, null, 2);
    }

    // Single line JSON for production (better for log aggregation)
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case "debug":
        if (this.isDevelopment) console.debug(formattedLog);
        break;
      case "info":
        console.log(formattedLog);
        break;
      case "warn":
        console.warn(formattedLog);
        break;
      case "error":
        console.error(formattedLog);
        // Also send to Sentry in production
        if (this.isProduction && context?.error) {
          // Import dynamically to avoid circular dependencies
          import("./sentry").then(({ captureError }) => {
            captureError(context.error, context);
          });
        }
        break;
    }

    // In production, also log to external service if configured
    if (this.isProduction) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    // Send to log aggregation service (e.g., Logtail, Datadog, etc.)
    if (process.env.LOGTAIL_TOKEN) {
      try {
        await fetch("https://in.logtail.com/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LOGTAIL_TOKEN}`,
          },
          body: JSON.stringify(entry),
        });
      } catch (error) {
        // Silently fail - don't want logging to break the app
        console.error("Failed to send log to external service:", error);
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log("error", message, {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  // Audit logging for compliance
  audit(action: string, userId: string, details: Record<string, any>) {
    this.info(`AUDIT: ${action}`, {
      audit: true,
      userId,
      action,
      ...details,
    });

    // Store audit logs in database for compliance
    if (this.isProduction) {
      this.storeAuditLog(action, userId, details);
    }
  }

  private async storeAuditLog(
    action: string,
    userId: string,
    details: Record<string, any>,
  ) {
    try {
      // TODO: Implement audit log storage when auditLog model is added to Prisma schema
      // For now, just log to console
      console.log("[AUDIT]", {
        action,
        userId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to store audit log:", error);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const { debug, info, warn, error, audit } = logger;
