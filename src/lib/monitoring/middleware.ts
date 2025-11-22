/**
 * Monitoring Middleware
 * Automatically track HTTP requests, responses, and errors
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger, logRequest, logResponse } from "./logger";
import { trackApiCall, trackError } from "./metrics";

export function withMonitoring(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const { method, url, headers } = req;
    const pathname = new URL(url).pathname;

    // Skip health check endpoints from detailed logging
    const isHealthCheck = pathname.includes("/health");

    // Log request
    if (!isHealthCheck) {
      logRequest({
        method,
        url: pathname,
        headers: Object.fromEntries(headers.entries()),
      });
    }

    try {
      // Execute handler
      const response = await handler(req);
      const duration = Date.now() - startTime;

      // Log response
      if (!isHealthCheck) {
        logResponse({
          method,
          url: pathname,
          statusCode: response.status,
          duration,
        });

        // Track metrics
        trackApiCall(pathname, method, response.status, duration);
      }

      // Add performance headers
      response.headers.set("X-Response-Time", `\${duration}ms`);
      response.headers.set("X-Request-ID", req.headers.get("x-request-id") || crypto.randomUUID());

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log error
      logger.error(
        {
          type: "request_error",
          method,
          url: pathname,
          error,
          duration,
        },
        "Request failed",
      );

      // Track error metric
      trackError("request_error", errorMessage);

      // Return error response
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Performance timing decorator
 */
export function withTiming<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      logger.debug(
        {
          type: "performance",
          operation: operationName,
          duration,
        },
        `Operation completed: \${operationName}`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        {
          type: "operation_error",
          operation: operationName,
          duration,
          error,
        },
        `Operation failed: \${operationName}`,
      );

      throw error;
    }
  }) as T;
}

/**
 * Database query timing decorator
 */
export function withDatabaseTiming<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  model: string,
  operation: string,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      logger.debug(
        {
          type: "database_query",
          model,
          operation,
          duration,
        },
        `Database query: \${model}.\${operation}`,
      );

      if (duration > 1000) {
        logger.warn(
          {
            type: "slow_query",
            model,
            operation,
            duration,
          },
          "Slow database query detected",
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        {
          type: "database_error",
          model,
          operation,
          duration,
          error,
        },
        `Database query failed: \${model}.\${operation}`,
      );

      trackError("database_error", `\${model}.\${operation}`);

      throw error;
    }
  }) as T;
}

export default withMonitoring;
