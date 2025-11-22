// Rate Limiter
// Week 21-22: Prevent abuse and DDoS attacks

import { LRUCache } from "lru-cache";

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed in window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when limit resets
}

/**
 * Token bucket rate limiter with sliding window
 */
class RateLimiter {
  private cache: LRUCache<string, { count: number; resetTime: number }>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cache = new LRUCache({
      max: 10000, // Max number of IPs to track
      ttl: config.interval, // Auto-expire after interval
    });
  }

  /**
   * Check if request is allowed
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.cache.get(identifier);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.cache.set(identifier, {
        count: 1,
        resetTime: now + this.config.interval,
      });

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        reset: now + this.config.interval,
      };
    }

    if (record.count >= this.config.maxRequests) {
      // Limit exceeded
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    // Increment count
    record.count += 1;
    this.cache.set(identifier, record);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - record.count,
      reset: record.resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.cache.delete(identifier);
  }

  /**
   * Get current status without incrementing
   */
  status(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.cache.get(identifier);

    if (!record || now > record.resetTime) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: now + this.config.interval,
      };
    }

    return {
      success: record.count < this.config.maxRequests,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      reset: record.resetTime,
    };
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // Strict limits for authentication
  auth: new RateLimiter({
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
  }),

  // Moderate limits for API calls
  api: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }),

  // Strict limits for checkout
  checkout: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 checkouts per minute
  }),

  // Lenient limits for search
  search: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 searches per minute
  }),

  // Very strict for password reset
  passwordReset: new RateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
  }),

  // Strict for email sending
  email: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 emails per minute
  }),
};

/**
 * Get identifier from request (IP + optional user ID)
 */
export function getIdentifier(
  request: Request,
  userId?: string,
): string {
  // Get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
  };
}
