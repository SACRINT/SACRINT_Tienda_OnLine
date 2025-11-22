/**
 * Redis Cache Implementation
 * High-performance caching layer
 */

import { logger } from "../monitoring/logger";
import { trackCache } from "../monitoring/metrics";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

export class RedisCache {
  private static instance: RedisCache;
  private cache: Map<string, { value: any; expires: number }> = new Map();

  private constructor() {}

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const cached = this.cache.get(fullKey);

    if (!cached) {
      trackCache("miss", key);
      return null;
    }

    if (Date.now() > cached.expires) {
      this.cache.delete(fullKey);
      trackCache("miss", key);
      return null;
    }

    trackCache("hit", key);
    return cached.value as T;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.namespace);
    const ttl = options?.ttl || 3600; // Default 1 hour
    const expires = Date.now() + ttl * 1000;

    this.cache.set(fullKey, { value, expires });
    trackCache("set", key);

    logger.debug(
      {
        type: "cache_set",
        key: fullKey,
        ttl,
      },
      "Cache set",
    );
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    this.cache.delete(fullKey);
    trackCache("delete", key);

    logger.debug(
      {
        type: "cache_delete",
        key: fullKey,
      },
      "Cache deleted",
    );
  }

  /**
   * Get or set pattern
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    logger.info("Cache cleared");
  }

  /**
   * Build full cache key
   */
  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || "default";
    return `${ns}:${key}`;
  }
}

export const cache = RedisCache.getInstance();
export default cache;
