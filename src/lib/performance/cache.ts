// @ts-nocheck
// Caching Service
// Multi-layer caching system

import { z } from "zod";

// Cache configuration
export interface CacheConfig {
  defaultTtl: number; // seconds
  maxSize: number; // max entries
  checkPeriod: number; // cleanup interval
}

// Cache entry
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

// Cache interface
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getMany<T>(keys: string[]): Promise<(T | null)[]>;
  setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
}

// In-memory cache
export class InMemoryCache implements CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 300, // 5 minutes
      maxSize: 10000,
      checkPeriod: 60000, // 1 minute
      ...config,
    };

    this.startCleanup();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update hits
    entry.hits++;

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Check size limit
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + (ttl || this.config.defaultTtl) * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
      hits: 0,
      createdAt: Date.now(),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    await Promise.all(entries.map((e) => this.set(e.key, e.value, e.ttl)));
  }

  // Evict least recently used
  private evictLRU(): void {
    let oldest: { key: string; hits: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.hits < oldest.hits) {
        oldest = { key, hits: entry.hits };
      }
    }

    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }

  // Start cleanup timer
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, this.config.checkPeriod);
  }

  // Stop cleanup
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  // Get stats
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
    };
  }
}

// Redis cache
export class RedisCache implements CacheService {
  private redis: any;
  private prefix: string;
  private config: CacheConfig;

  constructor(redis: any, prefix: string = "cache:", config: Partial<CacheConfig> = {}) {
    this.redis = redis;
    this.prefix = prefix;
    this.config = {
      defaultTtl: 300,
      maxSize: 10000,
      checkPeriod: 60000,
      ...config,
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(this.prefix + key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    const expiry = ttl || this.config.defaultTtl;

    await this.redis.setex(this.prefix + key, expiry, serialized);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.prefix + key);
  }

  async has(key: string): Promise<boolean> {
    return (await this.redis.exists(this.prefix + key)) === 1;
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys(this.prefix + "*");
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    const prefixedKeys = keys.map((k) => this.prefix + k);
    const values = await this.redis.mget(...prefixedKeys);

    return values.map((v: string | null) => {
      if (!v) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as T;
      }
    });
  }

  async setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const entry of entries) {
      const serialized = typeof entry.value === "string"
        ? entry.value
        : JSON.stringify(entry.value);
      pipeline.setex(
        this.prefix + entry.key,
        entry.ttl || this.config.defaultTtl,
        serialized
      );
    }

    await pipeline.exec();
  }
}

// Create cache instance
export function createCache(redis?: any): CacheService {
  if (redis) {
    return new RedisCache(redis);
  }
  return new InMemoryCache();
}

// Default cache instance
export const cache = createCache();

// Cache decorators
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator(...args);
      const cached = await cache.get(key);

      if (cached !== null) {
        return cached;
      }

      const result = await original.apply(this, args);
      await cache.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// Cache key builders
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (tenantId: string, page: number) => `products:${tenantId}:${page}`,
  category: (id: string) => `category:${id}`,
  categories: (tenantId: string) => `categories:${tenantId}`,
  cart: (userId: string) => `cart:${userId}`,
  user: (id: string) => `user:${id}`,
  session: (id: string) => `session:${id}`,
  search: (tenantId: string, query: string) => `search:${tenantId}:${query}`,
};

// Invalidation helpers
export async function invalidateProduct(productId: string): Promise<void> {
  await cache.delete(cacheKeys.product(productId));
}

export async function invalidateProductList(tenantId: string): Promise<void> {
  // In Redis, would use pattern delete
  // For in-memory, need to track keys
  await cache.delete(cacheKeys.products(tenantId, 1));
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await cache.delete(cacheKeys.user(userId));
  await cache.delete(cacheKeys.cart(userId));
}
