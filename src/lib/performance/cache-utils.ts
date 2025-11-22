// Cache Utilities
// Week 23-24: Performance optimization helpers

/**
 * Cache configuration for different data types
 */
export const CACHE_CONFIG = {
  // Static content (1 hour)
  STATIC: {
    revalidate: 3600,
    tags: ["static"],
  },

  // Product data (5 minutes)
  PRODUCTS: {
    revalidate: 300,
    tags: ["products"],
  },

  // User data (1 minute)
  USER: {
    revalidate: 60,
    tags: ["user"],
  },

  // Categories (1 hour)
  CATEGORIES: {
    revalidate: 3600,
    tags: ["categories"],
  },

  // Search results (5 minutes)
  SEARCH: {
    revalidate: 300,
    tags: ["search"],
  },

  // Analytics (15 minutes)
  ANALYTICS: {
    revalidate: 900,
    tags: ["analytics"],
  },
};

/**
 * Generate cache key
 */
export function generateCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

/**
 * Time-based cache with TTL
 */
export class TTLCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();

  constructor(private defaultTTL: number = 60000) {}

  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) return undefined;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
