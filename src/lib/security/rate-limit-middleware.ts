// Rate Limit Middleware
// Week 21-22: Apply rate limiting to API routes

import { NextResponse } from "next/server";
import {
  rateLimiters,
  getIdentifier,
  createRateLimitHeaders,
  RateLimitResult,
} from "./rate-limiter";

/**
 * Apply rate limiting to API route
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  limiterName: keyof typeof rateLimiters = "api",
) {
  return async (req: Request): Promise<Response> => {
    const identifier = getIdentifier(req);
    const limiter = rateLimiters[limiterName];
    const result = limiter.check(identifier);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Please try again later",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            ...createRateLimitHeaders(result),
            "Retry-After": retryAfter.toString(),
          },
        },
      );
    }

    // Execute handler and add rate limit headers
    const response = await handler(req);

    // Clone response to add headers
    const newResponse = new Response(response.body, response);
    const headers = createRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  };
}

/**
 * Check rate limit without blocking (for middleware)
 */
export function checkRateLimit(
  req: Request,
  limiterName: keyof typeof rateLimiters = "api",
): RateLimitResult {
  const identifier = getIdentifier(req);
  const limiter = rateLimiters[limiterName];
  return limiter.check(identifier);
}
