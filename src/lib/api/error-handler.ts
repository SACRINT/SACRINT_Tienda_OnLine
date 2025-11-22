/**
 * API Error Handling Utilities
 * Centralized error handling for API routes
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { logger } from "@/lib/monitoring/logger";

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class BadRequestError extends APIError {
  constructor(message: string, details?: unknown) {
    super(400, message, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends APIError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends APIError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: unknown) {
    super(409, message, "CONFLICT", details);
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: unknown) {
    super(422, message, "VALIDATION_ERROR", details);
  }
}

export class InternalServerError extends APIError {
  constructor(message = "Internal server error") {
    super(500, message, "INTERNAL_SERVER_ERROR");
  }
}

interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Format error response
 */
export function formatErrorResponse(error: unknown, includeStack = false): ErrorResponse {
  const timestamp = new Date().toISOString();

  // Handle APIError instances
  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp,
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.issues.map((err) => ({
        path: err.path.map(String).join("."),
        message: err.message,
      })),
      timestamp,
    };
  }

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error, timestamp);
  }

  // Handle generic errors
  if (error instanceof Error) {
    const response: ErrorResponse = {
      error: error.message || "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
      timestamp,
    };

    if (includeStack && process.env.NODE_ENV === "development") {
      response.details = { stack: error.stack };
    }

    return response;
  }

  // Unknown error type
  return {
    error: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    timestamp,
  };
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: PrismaClientKnownRequestError, timestamp: string): ErrorResponse {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      return {
        error: "A record with this value already exists",
        code: "DUPLICATE_ENTRY",
        details: { fields: error.meta?.target },
        timestamp,
      };

    case "P2025":
      // Record not found
      return {
        error: "Record not found",
        code: "NOT_FOUND",
        timestamp,
      };

    case "P2003":
      // Foreign key constraint violation
      return {
        error: "Related record not found",
        code: "FOREIGN_KEY_VIOLATION",
        timestamp,
      };

    case "P2014":
      // Required relation violation
      return {
        error: "The change would violate a required relation",
        code: "RELATION_VIOLATION",
        timestamp,
      };

    default:
      return {
        error: "Database operation failed",
        code: "DATABASE_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? { prismaCode: error.code, meta: error.meta }
            : undefined,
        timestamp,
      };
  }
}

/**
 * Create error response
 */
export function createErrorResponse(error: unknown, statusCode?: number): NextResponse {
  const formattedError = formatErrorResponse(error, process.env.NODE_ENV === "development");

  // Log error
  if (error instanceof APIError && error.statusCode >= 500) {
    logger.error({ error, code: error.code, statusCode: error.statusCode }, "API Error");
  } else if (!(error instanceof APIError)) {
    logger.error({ error: error }, "Unexpected Error");
  }

  // Determine status code
  let status = statusCode || 500;
  if (error instanceof APIError) {
    status = error.statusCode;
  } else if (error instanceof ZodError) {
    status = 422;
  } else if (error instanceof PrismaClientKnownRequestError) {
    status = (error as PrismaClientKnownRequestError).code === "P2025" ? 404 : 400;
  }

  return NextResponse.json(formattedError, { status });
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  }) as T;
}

/**
 * Assert condition or throw error
 */
export function assert(condition: unknown, error: APIError | string): asserts condition {
  if (!condition) {
    throw typeof error === "string" ? new BadRequestError(error) : error;
  }
}

/**
 * Assert authenticated or throw
 */
export function assertAuthenticated(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    throw new UnauthorizedError("Authentication required");
  }
}

/**
 * Assert authorized or throw
 */
export function assertAuthorized(condition: boolean, message?: string): void {
  if (!condition) {
    throw new ForbiddenError(message || "You don't have permission to perform this action");
  }
}
