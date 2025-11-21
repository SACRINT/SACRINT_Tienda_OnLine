/**
 * Redis Client Configuration
 * Singleton pattern for Redis connection with fallback to memory cache
 */

import Redis, { RedisOptions } from "ioredis";
import { logger } from "@/lib/monitoring/logger";

// Redis connection singleton
let redisClient: Redis | null = null;

// In-memory cache fallback
const memoryCache = new Map<string, { value: string; expiry: number }>();

/**
 * Gets or creates Redis client instance
 * Falls back to memory cache if Redis is unavailable
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn("REDIS_URL not configured, using memory cache fallback");
    return null;
  }

  try {
    const options: RedisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error("Redis connection failed after 3 retries");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
      lazyConnect: false,
    };

    redisClient = new Redis(redisUrl, options);

    redisClient.on("error", (err) => {
      logger.error("Redis connection error", err);
    });

    redisClient.on("connect", () => {
      logger.info("Redis connected successfully");
    });

    redisClient.on("ready", () => {
      logger.info("Redis client ready");
    });

    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis client", error as Error);
    return null;
  }
}

/**
 * Cache utility functions with automatic fallback to memory cache
 */
export class CacheService {
  private client: Redis | null;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.client) {
        const value = await this.client.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      } else {
        // Memory cache fallback
        const cached = memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return JSON.parse(cached.value) as T;
        } else if (cached) {
          memoryCache.delete(key);
        }
      }
      return null;
    } catch (error) {
      logger.error(`Cache get error for key: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (time-to-live in seconds)
   */
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      if (this.client) {
        await this.client.setex(key, ttl, serialized);
      } else {
        // Memory cache fallback
        memoryCache.set(key, {
          value: serialized,
          expiry: Date.now() + ttl * 1000,
        });
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      if (this.client) {
        await this.client.del(key);
      } else {
        memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern (Redis only)
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
          return keys.length;
        }
      } else {
        // Memory cache: manual pattern matching
        let count = 0;
        const regex = new RegExp(
          "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
        );
        for (const key of memoryCache.keys()) {
          if (regex.test(key)) {
            memoryCache.delete(key);
            count++;
          }
        }
        return count;
      }
      return 0;
    } catch (error) {
      logger.error(`Cache delete pattern error: ${pattern}`, error as Error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      } else {
        const cached = memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return true;
        } else if (cached) {
          memoryCache.delete(key);
        }
        return false;
      }
    } catch (error) {
      logger.error(`Cache exists error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Increment counter (useful for rate limiting)
   */
  async incr(key: string): Promise<number> {
    try {
      if (this.client) {
        return await this.client.incr(key);
      } else {
        const cached = memoryCache.get(key);
        const currentValue = cached ? parseInt(cached.value) : 0;
        const newValue = currentValue + 1;
        memoryCache.set(key, {
          value: String(newValue),
          expiry: cached?.expiry || Date.now() + 3600 * 1000,
        });
        return newValue;
      }
    } catch (error) {
      logger.error(`Cache incr error for key: ${key}`, error as Error);
      return 0;
    }
  }

  /**
   * Set expiry for existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (this.client) {
        const result = await this.client.expire(key, ttl);
        return result === 1;
      } else {
        const cached = memoryCache.get(key);
        if (cached) {
          cached.expiry = Date.now() + ttl * 1000;
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error(`Cache expire error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (this.client) {
        return await this.client.ttl(key);
      } else {
        const cached = memoryCache.get(key);
        if (cached) {
          const remaining = Math.floor((cached.expiry - Date.now()) / 1000);
          return remaining > 0 ? remaining : -1;
        }
        return -2; // Key doesn't exist
      }
    } catch (error) {
      logger.error(`Cache ttl error for key: ${key}`, error as Error);
      return -1;
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    try {
      if (this.client) {
        await this.client.flushall();
      } else {
        memoryCache.clear();
      }
      logger.warn("Cache flushed");
      return true;
    } catch (error) {
      logger.error("Cache flush error", error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const cache = new CacheService();

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (tenantId: string, page: number, filters?: string) =>
    `products:${tenantId}:p${page}${filters ? `:${filters}` : ""}`,
  cart: (userId: string, tenantId: string) => `cart:${userId}:${tenantId}`,
  user: (id: string) => `user:${id}`,
  category: (id: string) => `category:${id}`,
  categories: (tenantId: string) => `categories:${tenantId}`,
  order: (id: string) => `order:${id}`,
  session: (sessionId: string) => `session:${sessionId}`,
  productSearch: (tenantId: string, query: string) =>
    `search:${tenantId}:${query}`,
};

/**
 * Clean up expired memory cache entries periodically
 */
if (!getRedisClient()) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (value.expiry <= now) {
        memoryCache.delete(key);
      }
    }
  }, 60 * 1000); // Clean up every minute
}
