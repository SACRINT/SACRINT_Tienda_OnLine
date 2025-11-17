// Rate Limiter Middleware
// Implements token bucket algorithm for API rate limiting

import { NextRequest, NextResponse } from 'next/server'

// In-memory store for development
// For production, use Redis or Upstash
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  interval: number // Time window in milliseconds
  limit: number // Max requests in interval
}

// Preset configurations
export const RATE_LIMITS = {
  ANONYMOUS: {
    interval: 60 * 1000, // 1 minute
    limit: 10,
  },
  AUTHENTICATED: {
    interval: 60 * 1000, // 1 minute
    limit: 100,
  },
  STORE_OWNER: {
    interval: 60 * 1000, // 1 minute
    limit: 1000,
  },
  UPLOAD: {
    interval: 60 * 1000, // 1 minute
    limit: 20, // Lower limit for uploads
  },
  SEARCH: {
    interval: 60 * 1000, // 1 minute
    limit: 50, // Moderate limit for search
  },
}

/**
 * Rate limiter using token bucket algorithm
 * @param identifier - Unique identifier for the requester (userId, IP, etc.)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `rate-limit:${identifier}`

  // Get current rate limit data
  const rateLimitData = rateLimitStore.get(key)

  // If no data or reset time passed, create new window
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.interval,
    })

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: now + config.interval,
    }
  }

  // Check if limit exceeded
  if (rateLimitData.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimitData.resetTime,
    }
  }

  // Increment count
  rateLimitData.count++
  rateLimitStore.set(key, rateLimitData)

  return {
    allowed: true,
    remaining: config.limit - rateLimitData.count,
    resetTime: rateLimitData.resetTime,
  }
}

/**
 * Get rate limiter identifier from request
 * Uses userId if authenticated, otherwise IP address
 */
export function getRateLimitIdentifier(
  req: NextRequest,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`
  }

  // Get IP from headers (works with Vercel/most proxies)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit middleware for API routes
 * Call this at the start of your API handler
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(req, {
 *     userId: session?.user?.id,
 *     config: RATE_LIMITS.AUTHENTICATED
 *   })
 *
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response
 *   }
 *
 *   // Continue with request...
 * }
 */
export function applyRateLimit(
  req: NextRequest,
  options: {
    userId?: string
    config: RateLimitConfig
  }
): {
  allowed: boolean
  remaining: number
  response?: NextResponse
} {
  const identifier = getRateLimitIdentifier(req, options.userId)
  const result = checkRateLimit(identifier, options.config)

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

    return {
      allowed: false,
      remaining: 0,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': options.config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      ),
    }
  }

  return {
    allowed: true,
    remaining: result.remaining,
  }
}

/**
 * Cleanup old rate limit entries (run periodically)
 * Should be called via cron job or scheduled task
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  let cleaned = 0

  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }

  console.log(`[RATE_LIMIT] Cleaned up ${cleaned} expired entries`)
  return cleaned
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)

/**
 * For production with Redis:
 *
 * import Redis from 'ioredis'
 * const redis = new Redis(process.env.REDIS_URL)
 *
 * export async function checkRateLimitRedis(
 *   identifier: string,
 *   config: RateLimitConfig
 * ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
 *   const key = `rate-limit:${identifier}`
 *   const now = Date.now()
 *
 *   // Use Redis INCR with EXPIRE for atomic operations
 *   const count = await redis.incr(key)
 *
 *   if (count === 1) {
 *     await redis.pexpire(key, config.interval)
 *   }
 *
 *   const ttl = await redis.pttl(key)
 *   const resetTime = now + ttl
 *
 *   if (count > config.limit) {
 *     return {
 *       allowed: false,
 *       remaining: 0,
 *       resetTime,
 *     }
 *   }
 *
 *   return {
 *     allowed: true,
 *     remaining: config.limit - count,
 *     resetTime,
 *   }
 * }
 */
