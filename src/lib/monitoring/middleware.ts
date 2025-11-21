/**
 * Logging Middleware for Next.js API Routes
 * Automatic request/response logging with performance tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { logger, createRequestContext, PerfTimer } from "./logger";

/**
 * Wrap API route handler with logging middleware
 */
export function withLogging<T = any>(
  handler: (
    req: NextRequest,
    context?: any,
  ) => Promise<NextResponse<T> | Response>,
  options?: {
    skipPaths?: string[];
    logBody?: boolean;
    logHeaders?: boolean;
  },
) {
  return async (
    req: NextRequest,
    context?: any,
  ): Promise<NextResponse<T> | Response> => {
    const {
      skipPaths = [],
      logBody = false,
      logHeaders = false,
    } = options || {};

    // Skip logging for certain paths
    if (skipPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
      return handler(req, context);
    }

    const timer = new PerfTimer("api_request");
    const requestId = crypto.randomUUID();

    // Log incoming request
    const requestContext = {
      requestId,
      method: req.method,
      url: req.nextUrl.pathname + req.nextUrl.search,
      userAgent: req.headers.get("user-agent") || undefined,
      ip: req.headers.get("x-forwarded-for") || req.ip || undefined,
      ...(logHeaders && { headers: Object.fromEntries(req.headers) }),
    };

    logger.info(
      `[REQUEST] ${req.method} ${req.nextUrl.pathname}`,
      requestContext,
    );

    // Log request body if enabled (only for non-GET requests)
    if (logBody && req.method !== "GET") {
      try {
        const body = await req.clone().json();
        logger.debug("Request body", { requestId, body });
      } catch {
        // Body is not JSON or empty
      }
    }

    let response: NextResponse<T> | Response;
    let statusCode = 500;

    try {
      response = await handler(req, context);
      statusCode = response.status;

      // Log response
      const duration = timer.end();
      logger.request(
        req.method,
        req.nextUrl.pathname,
        statusCode,
        duration,
        requestContext,
      );

      return response;
    } catch (error) {
      const duration = timer.end();

      logger.error(
        `[ERROR] ${req.method} ${req.nextUrl.pathname}`,
        error as Error,
        { ...requestContext, statusCode },
      );

      throw error;
    }
  };
}

/**
 * Create logging middleware for Express-style middleware
 */
export function createLoggingMiddleware() {
  return async (req: NextRequest) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    // Add requestId to request headers for tracing
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add requestId to response headers
    response.headers.set("x-request-id", requestId);

    const duration = Date.now() - start;

    // Log after response (non-blocking)
    Promise.resolve().then(() => {
      logger.request(
        req.method,
        req.nextUrl.pathname,
        response.status,
        duration,
        {
          requestId,
          userAgent: req.headers.get("user-agent") || undefined,
          ip: req.headers.get("x-forwarded-for") || req.ip || undefined,
        },
      );
    });

    return response;
  };
}

/**
 * Error boundary wrapper for API routes
 */
export function withErrorHandler<T = any>(
  handler: (
    req: NextRequest,
    context?: any,
  ) => Promise<NextResponse<T> | Response>,
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const response = await handler(req, context);
      return response as NextResponse;
    } catch (error) {
      const requestContext = createRequestContext(req);

      logger.error(
        "Unhandled error in API route",
        error as Error,
        requestContext,
      );

      return NextResponse.json(
        {
          error: "Internal server error",
          message:
            process.env.NODE_ENV === "production"
              ? "An unexpected error occurred"
              : (error as Error).message,
          requestId: requestContext.requestId,
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Combine multiple middleware functions
 */
export function compose<T = any>(
  ...middlewares: Array<
    (
      handler: (
        req: NextRequest,
        context?: any,
      ) => Promise<NextResponse<T> | Response>,
    ) => (
      req: NextRequest,
      context?: any,
    ) => Promise<NextResponse<T> | Response>
  >
) {
  return (
    handler: (
      req: NextRequest,
      context?: any,
    ) => Promise<NextResponse<T> | Response>,
  ) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler,
    );
  };
}
