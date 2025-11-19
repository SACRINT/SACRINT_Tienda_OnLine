// Rate Limiting Utilities

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>()

export interface RateLimitConfig {
  // Maximum requests allowed in the window
  max: number
  // Window size in milliseconds
  windowMs: number
  // Identifier for the rate limit (e.g., "api", "auth", "upload")
  identifier?: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Default configurations for different endpoints
export const rateLimitConfigs = {
  // General API: 100 requests per minute
  api: {
    max: 100,
    windowMs: 60 * 1000,
    identifier: "api",
  },

  // Authentication: 5 attempts per 15 minutes
  auth: {
    max: 5,
    windowMs: 15 * 60 * 1000,
    identifier: "auth",
  },

  // Password reset: 3 attempts per hour
  passwordReset: {
    max: 3,
    windowMs: 60 * 60 * 1000,
    identifier: "password-reset",
  },

  // File upload: 10 uploads per hour
  upload: {
    max: 10,
    windowMs: 60 * 60 * 1000,
    identifier: "upload",
  },

  // Checkout: 10 attempts per hour
  checkout: {
    max: 10,
    windowMs: 60 * 60 * 1000,
    identifier: "checkout",
  },

  // Search: 30 requests per minute
  search: {
    max: 30,
    windowMs: 60 * 1000,
    identifier: "search",
  },

  // Newsletter: 1 subscription per day per IP
  newsletter: {
    max: 1,
    windowMs: 24 * 60 * 60 * 1000,
    identifier: "newsletter",
  },
}

// Check rate limit
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const identifier = config.identifier || "default"
  const compositeKey = `${identifier}:${key}`

  const existing = rateLimitStore.get(compositeKey)

  // If no existing record or window expired, create new
  if (!existing || now > existing.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(compositeKey, { count: 1, resetTime })

    return {
      success: true,
      remaining: config.max - 1,
      resetTime,
    }
  }

  // Window still active
  if (existing.count >= config.max) {
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfter,
    }
  }

  // Increment counter
  existing.count++
  rateLimitStore.set(compositeKey, existing)

  return {
    success: true,
    remaining: config.max - existing.count,
    resetTime: existing.resetTime,
  }
}

// Get client identifier (IP or user ID)
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`
  }

  // Get IP from headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  const ip =
    cfConnectingIp ||
    realIp ||
    forwarded?.split(",")[0].trim() ||
    "unknown"

  return `ip:${ip}`
}

// Rate limit middleware helper
export async function withRateLimit<T>(
  request: Request,
  config: RateLimitConfig,
  handler: () => Promise<T>,
  userId?: string
): Promise<T | Response> {
  const clientId = getClientIdentifier(request, userId)
  const result = checkRateLimit(clientId, config)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: "Demasiadas solicitudes",
        message: `Por favor espera ${result.retryAfter} segundos`,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfter),
          "X-RateLimit-Limit": String(config.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetTime),
        },
      }
    )
  }

  return handler()
}

// Clean up expired entries (call periodically)
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Start cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null

export function startRateLimitCleanup(intervalMs = 60000): void {
  if (cleanupInterval) return

  cleanupInterval = setInterval(cleanupRateLimitStore, intervalMs)
}

export function stopRateLimitCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}

// Reset rate limit for a specific key (for testing or admin use)
export function resetRateLimit(key: string, identifier?: string): void {
  const compositeKey = identifier ? `${identifier}:${key}` : key
  rateLimitStore.delete(compositeKey)
}
