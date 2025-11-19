// Cache Service
// In-memory cache with TTL support (upgrade to Redis for production)

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

// Default TTLs for different data types
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  // Set value in cache
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const ttl = options.ttl || CACHE_TTL.MEDIUM;
    const tags = options.tags || [];

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl * 1000,
      tags,
    };

    this.cache.set(key, entry);

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  // Delete single key
  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.cache.delete(key);
  }

  // Delete by tag (invalidate related cache entries)
  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      this.cache.delete(key);
      count++;
    }

    this.tagIndex.delete(tag);
    return count;
  }

  // Get or set pattern (cache-aside)
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  // Check if key exists
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    keys: string[];
    tags: string[];
  } {
    // Clean expired entries first
    this.cleanExpired();

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      tags: Array.from(this.tagIndex.keys()),
    };
  }

  // Clean expired entries
  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }
}

// Singleton instance
export const cache = new CacheService();

// Cache key builders
export const cacheKeys = {
  // Products
  products: (tenantId: string) => `products:${tenantId}`,
  product: (id: string) => `product:${id}`,
  productsByCategory: (tenantId: string, categoryId: string) =>
    `products:${tenantId}:category:${categoryId}`,
  featuredProducts: (tenantId: string) => `products:${tenantId}:featured`,
  searchResults: (tenantId: string, query: string) =>
    `search:${tenantId}:${query}`,

  // Categories
  categories: (tenantId: string) => `categories:${tenantId}`,
  category: (id: string) => `category:${id}`,
  categoryTree: (tenantId: string) => `categories:${tenantId}:tree`,

  // User data
  user: (id: string) => `user:${id}`,
  userOrders: (userId: string) => `orders:user:${userId}`,
  userCart: (userId: string, tenantId: string) =>
    `cart:${userId}:${tenantId}`,

  // Tenant data
  tenant: (id: string) => `tenant:${id}`,
  tenantSettings: (id: string) => `tenant:${id}:settings`,

  // Analytics
  dashboardStats: (tenantId: string) => `stats:${tenantId}:dashboard`,
  popularProducts: (tenantId: string) => `stats:${tenantId}:popular`,
} as const;

// Cache tags for invalidation
export const cacheTags = {
  products: (tenantId: string) => `tenant:${tenantId}:products`,
  categories: (tenantId: string) => `tenant:${tenantId}:categories`,
  orders: (tenantId: string) => `tenant:${tenantId}:orders`,
  users: (tenantId: string) => `tenant:${tenantId}:users`,
  tenant: (tenantId: string) => `tenant:${tenantId}`,
} as const;

// Helper functions for common caching patterns
export async function cacheProducts<T>(
  tenantId: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  return cache.getOrSet(cacheKeys.products(tenantId), fetcher, {
    ttl,
    tags: [cacheTags.products(tenantId)],
  });
}

export async function cacheCategories<T>(
  tenantId: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.HOUR
): Promise<T> {
  return cache.getOrSet(cacheKeys.categories(tenantId), fetcher, {
    ttl,
    tags: [cacheTags.categories(tenantId)],
  });
}

export async function invalidateProductCache(tenantId: string): Promise<void> {
  await cache.invalidateByTag(cacheTags.products(tenantId));
}

export async function invalidateCategoryCache(tenantId: string): Promise<void> {
  await cache.invalidateByTag(cacheTags.categories(tenantId));
}

export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await cache.invalidateByTag(cacheTags.tenant(tenantId));
}
