// HTTP Cache Middleware
// Cache-Control headers for API routes and pages

import { NextRequest, NextResponse } from "next/server";

// Cache profiles for different content types
export const CACHE_PROFILES = {
  // Static assets - very long cache
  static: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },

  // Dynamic content that rarely changes
  stable: {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  },

  // Content that changes moderately
  moderate: {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  },

  // Frequently changing content
  dynamic: {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  },

  // User-specific content - no caching
  private: {
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
  },

  // API responses
  api: {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
  },
} as const;

export type CacheProfile = keyof typeof CACHE_PROFILES;

// Apply cache headers to response
export function applyCacheHeaders(
  response: NextResponse,
  profile: CacheProfile
): NextResponse {
  const headers = CACHE_PROFILES[profile];

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

// Generate ETag for content
export function generateETag(content: string | object): string {
  const str = typeof content === "string" ? content : JSON.stringify(content);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `"${Math.abs(hash).toString(16)}"`;
}

// Check if request has matching ETag
export function hasMatchingETag(
  request: NextRequest,
  etag: string
): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  return ifNoneMatch === etag;
}

// Create cached JSON response
export function cachedJsonResponse(
  data: object,
  profile: CacheProfile = "api",
  status: number = 200
): NextResponse {
  const etag = generateETag(data);
  const response = NextResponse.json(data, { status });

  applyCacheHeaders(response, profile);
  response.headers.set("ETag", etag);

  return response;
}

// Create 304 Not Modified response
export function notModifiedResponse(): NextResponse {
  return new NextResponse(null, { status: 304 });
}

// Middleware helper for caching
export function withCaching(
  handler: (request: NextRequest) => Promise<NextResponse>,
  profile: CacheProfile = "api"
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    return applyCacheHeaders(response, profile);
  };
}

// Vary header helper
export function setVaryHeaders(
  response: NextResponse,
  headers: string[]
): NextResponse {
  response.headers.set("Vary", headers.join(", "));
  return response;
}

// Cache key generator for API routes
export function generateCacheKey(
  request: NextRequest,
  additionalKeys: string[] = []
): string {
  const url = new URL(request.url);
  const baseKey = `${url.pathname}${url.search}`;
  const keys = [baseKey, ...additionalKeys];

  return keys.join(":");
}
