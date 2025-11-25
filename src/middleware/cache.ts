/**
 * Cache Middleware
 * Automatically applies cache headers to responses based on route
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCacheStrategyForRoute, CACHE_STRATEGIES } from "@/lib/performance/cache-headers";

export function cacheMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get cache strategy for this route
  const strategy = getCacheStrategyForRoute(request.nextUrl.pathname);

  // Apply cache headers
  response.headers.set("Cache-Control", CACHE_STRATEGIES[strategy]);

  // Add additional performance headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}
