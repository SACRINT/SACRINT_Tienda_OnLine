/**
 * HTTP Cache Headers Configuration
 * Centralized configuration for caching strategies
 */

export type CacheStrategy =
  | "no-cache"
  | "public-immutable"
  | "public-short"
  | "public-medium"
  | "public-long"
  | "private"
  | "api-short"
  | "api-medium";

export const CACHE_STRATEGIES: Record<CacheStrategy, string> = {
  "no-cache": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "public-immutable": "public, max-age=31536000, immutable",
  "public-short": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
  "public-medium": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=300",
  "public-long": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600",
  private: "private, max-age=0, must-revalidate",
  "api-short": "public, max-age=60, s-maxage=60, stale-while-revalidate=30",
  "api-medium": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
};

export function getCacheHeaders(strategy: CacheStrategy): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", CACHE_STRATEGIES[strategy]);
  return headers;
}

export function addCacheHeaders(response: Response, strategy: CacheStrategy): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Cache-Control", CACHE_STRATEGIES[strategy]);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Route-specific cache strategies
 */
export const ROUTE_CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  // Static assets
  "/images": "public-immutable",
  "/fonts": "public-immutable",
  "/_next/static": "public-immutable",

  // Public pages
  "/": "public-short",
  "/shop": "public-short",
  "/products": "public-short",

  // API routes
  "/api/products": "api-short",
  "/api/categories": "api-medium",
  "/api/search": "api-short",

  // User-specific
  "/account": "private",
  "/dashboard": "private",
  "/orders": "private",

  // No cache
  "/checkout": "no-cache",
  "/cart": "no-cache",
  "/api/auth": "no-cache",
  "/api/checkout": "no-cache",
};

export function getCacheStrategyForRoute(pathname: string): CacheStrategy {
  // Find the most specific matching route
  const matchingRoute = Object.keys(ROUTE_CACHE_STRATEGIES)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  return matchingRoute ? ROUTE_CACHE_STRATEGIES[matchingRoute] : "public-short";
}
