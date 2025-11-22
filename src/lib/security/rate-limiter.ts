/**
 * Rate Limiter
 * Sistema de rate limiting para APIs
 */

import { logger } from "../monitoring/logger";
import { trackError } from "../monitoring/metrics";

export interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests por ventana
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    // Cleanup automático cada minuto
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Verificar si un cliente ha excedido el límite
   */
  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    let entry = this.store.get(identifier);

    // Crear nueva entrada si no existe o si la ventana expiró
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false,
      };
      this.store.set(identifier, entry);
    }

    // Incrementar contador
    entry.count++;

    const allowed = entry.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    if (!allowed && !entry.blocked) {
      entry.blocked = true;
      logger.warn(
        {
          type: "rate_limit_exceeded",
          identifier,
          count: entry.count,
          limit: this.config.maxRequests,
        },
        `Rate limit exceeded for ${identifier}`,
      );
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Resetear límite para un identificador
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Limpiar entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [identifier, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(identifier);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(
        { type: "rate_limiter_cleanup", cleaned },
        `Cleaned ${cleaned} expired rate limit entries`,
      );
    }
  }

  /**
   * Destructor
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Instancias predefinidas para diferentes endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100,
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
});

export const checkoutRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 10,
});

/**
 * Middleware helper para Next.js
 */
export async function withRateLimit(
  identifier: string,
  limiter: RateLimiter = apiRateLimiter,
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  try {
    const { allowed, remaining, resetTime } = await limiter.checkLimit(identifier);

    const headers = {
      "X-RateLimit-Limit": limiter["config"].maxRequests.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": new Date(resetTime).toISOString(),
    };

    return { allowed, headers };
  } catch (error) {
    trackError("rate_limiter_error", error instanceof Error ? error.message : "Unknown");
    logger.error({ error }, "Rate limiter error");
    // En caso de error, permitir request
    return { allowed: true, headers: {} };
  }
}

// Anonymous/guest rate limiter (more restrictive)
export const anonymousRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 20, // Más restrictivo para usuarios no autenticados
});

// Rate limit presets
export const RATE_LIMITS = {
  auth: authRateLimiter,
  api: apiRateLimiter,
  checkout: checkoutRateLimiter,
  ANONYMOUS: anonymousRateLimiter,
} as const;

// Collection of all rate limiters
export const rateLimiters = {
  auth: authRateLimiter,
  api: apiRateLimiter,
  checkout: checkoutRateLimiter,
};

/**
 * Get identifier from request (IP or user ID)
 */
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) return userId;

  // Try to get IP from headers
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  return ip;
}

/**
 * Create rate limit headers
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
  limit: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
  };
}

/**
 * Apply rate limit to a request (used in API routes)
 * Returns result with allowed flag and optional response
 */
export async function applyRateLimit(
  req: Request,
  options?: {
    config?: { interval?: number; limit?: number };
    limiter?: RateLimiter;
    userId?: string;
  },
): Promise<{ allowed: boolean; response?: Response }> {
  try {
    // Use provided limiter or create one based on config
    let rateLimiter = options?.limiter || apiRateLimiter;

    if (options?.config) {
      // Create temporary rate limiter with custom config
      rateLimiter = new RateLimiter({
        windowMs: options.config.interval || 60 * 1000,
        maxRequests: options.config.limit || 100,
      });
    }

    const identifier = getIdentifier(req, options?.userId);
    const { allowed, remaining, resetTime } = await rateLimiter.checkLimit(identifier);

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: "Too many requests",
            message: "Please try again later",
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": rateLimiter["config"].maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(resetTime).toISOString(),
              "Retry-After": retryAfter.toString(),
            },
          },
        ),
      };
    }

    return { allowed: true };
  } catch (error) {
    trackError("rate_limiter_error", error instanceof Error ? error.message : "Unknown");
    logger.error({ error }, "Rate limiter error");
    // En caso de error, permitir request
    return { allowed: true };
  }
}

export default RateLimiter;
