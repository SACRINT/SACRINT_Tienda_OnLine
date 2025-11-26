/**
 * Advanced Rate Limiting & Throttling
 * Semana 38, Tarea 38.4: Advanced Rate Limiting & Throttling
 */

import { logger } from '@/lib/monitoring'

export type RateLimitStrategy = 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket'

export interface RateLimitConfig {
  strategy: RateLimitStrategy
  windowSize: number // milliseconds
  maxRequests: number
  burst?: number // para token-bucket
  penalty?: number // milliseconds de espera
}

export interface RateLimitKey {
  clientId: string
  endpoint: string
  userId?: string
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface ThrottleConfig {
  minInterval: number // milliseconds entre requests
  maxConcurrent?: number
  queueSize?: number
}

export interface RateLimitMetrics {
  totalRequests: number
  blockedRequests: number
  blockRate: number
  averageWaitTime: number
}

export class RateLimiter {
  private config: Map<string, RateLimitConfig> = new Map()
  private state: Map<string, any> = new Map()
  private metrics: Map<string, { total: number; blocked: number; totalWait: number; count: number }> = new Map()

  constructor() {
    logger.debug({ type: 'rate_limiter_init' }, 'Rate Limiter inicializado')
  }

  /**
   * Configurar límite de rate
   */
  setConfig(key: string, config: RateLimitConfig): void {
    this.config.set(key, config)
    this.initializeState(key)
    logger.debug({ type: 'rate_limit_config_set', key }, `Rate limit configurado: ${key}`)
  }

  /**
   * Inicializar estado
   */
  private initializeState(key: string): void {
    const config = this.config.get(key)
    if (!config) return

    switch (config.strategy) {
      case 'fixed-window':
        this.state.set(key, {
          windowStart: Date.now(),
          requestCount: 0,
        })
        break
      case 'sliding-window':
        this.state.set(key, {
          requests: [],
        })
        break
      case 'token-bucket':
        this.state.set(key, {
          tokens: config.maxRequests,
          lastRefill: Date.now(),
        })
        break
      case 'leaky-bucket':
        this.state.set(key, {
          queue: [],
          processing: false,
        })
        break
    }
  }

  /**
   * Verificar rate limit
   */
  checkLimit(key: string, clientId: string, endpoint: string = 'default'): RateLimitStatus {
    const config = this.config.get(key)
    if (!config) {
      return { allowed: true, remaining: -1, resetTime: 0 }
    }

    const startTime = Date.now()
    let allowed = false
    let remaining = 0
    let resetTime = 0

    switch (config.strategy) {
      case 'fixed-window':
        ({ allowed, remaining, resetTime } = this.checkFixedWindow(key, config))
        break
      case 'sliding-window':
        ({ allowed, remaining, resetTime } = this.checkSlidingWindow(key, config))
        break
      case 'token-bucket':
        ({ allowed, remaining, resetTime } = this.checkTokenBucket(key, config))
        break
      case 'leaky-bucket':
        ({ allowed, remaining, resetTime } = this.checkLeakyBucket(key, config))
        break
    }

    // Registrar métrica
    this.recordMetric(key, allowed, Date.now() - startTime)

    if (!allowed) {
      logger.warn(
        { type: 'rate_limit_exceeded', key, clientId, endpoint },
        `Rate limit excedido: ${key} para ${clientId}`,
      )
    }

    return {
      allowed,
      remaining: Math.max(0, remaining),
      resetTime,
      retryAfter: allowed ? undefined : config.penalty || 1000,
    }
  }

  /**
   * Fixed Window Strategy
   */
  private checkFixedWindow(
    key: string,
    config: RateLimitConfig,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    let state = this.state.get(key) || { windowStart: Date.now(), requestCount: 0 }

    const now = Date.now()
    if (now - state.windowStart > config.windowSize) {
      state = { windowStart: now, requestCount: 0 }
    }

    const allowed = state.requestCount < config.maxRequests
    if (allowed) {
      state.requestCount++
    }

    this.state.set(key, state)

    return {
      allowed,
      remaining: config.maxRequests - state.requestCount,
      resetTime: state.windowStart + config.windowSize,
    }
  }

  /**
   * Sliding Window Strategy
   */
  private checkSlidingWindow(
    key: string,
    config: RateLimitConfig,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    let state = this.state.get(key) || { requests: [] }

    const now = Date.now()
    const cutoff = now - config.windowSize

    // Remover requests antiguos
    state.requests = state.requests.filter((timestamp: number) => timestamp > cutoff)

    const allowed = state.requests.length < config.maxRequests
    if (allowed) {
      state.requests.push(now)
    }

    this.state.set(key, state)

    const oldestRequest = state.requests[0] || now
    return {
      allowed,
      remaining: config.maxRequests - state.requests.length,
      resetTime: oldestRequest + config.windowSize,
    }
  }

  /**
   * Token Bucket Strategy
   */
  private checkTokenBucket(
    key: string,
    config: RateLimitConfig,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    let state = this.state.get(key) || { tokens: config.maxRequests, lastRefill: Date.now() }

    const now = Date.now()
    const elapsedMs = now - state.lastRefill
    const tokensToAdd = (elapsedMs / config.windowSize) * config.maxRequests
    state.tokens = Math.min(config.maxRequests, state.tokens + tokensToAdd)
    state.lastRefill = now

    const allowed = state.tokens >= 1
    if (allowed) {
      state.tokens--
    }

    this.state.set(key, state)

    return {
      allowed,
      remaining: Math.floor(state.tokens),
      resetTime: now + config.windowSize,
    }
  }

  /**
   * Leaky Bucket Strategy
   */
  private checkLeakyBucket(
    key: string,
    config: RateLimitConfig,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    let state = this.state.get(key) || { queue: [], processing: false }

    state.queue.push(Date.now())

    if (state.queue.length > config.maxRequests * 10) {
      state.queue.shift()
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + config.penalty || 1000,
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests * 10 - state.queue.length),
      resetTime: Date.now() + config.windowSize,
    }
  }

  /**
   * Registrar métrica
   */
  private recordMetric(key: string, allowed: boolean, waitTime: number): void {
    const current = this.metrics.get(key) || { total: 0, blocked: 0, totalWait: 0, count: 0 }

    current.total++
    if (!allowed) current.blocked++
    current.totalWait += waitTime
    current.count++

    this.metrics.set(key, current)
  }

  /**
   * Obtener métricas
   */
  getMetrics(key: string): RateLimitMetrics | null {
    const metric = this.metrics.get(key)
    if (!metric) return null

    return {
      totalRequests: metric.total,
      blockedRequests: metric.blocked,
      blockRate: metric.total > 0 ? Math.round((metric.blocked / metric.total) * 100) : 0,
      averageWaitTime: metric.count > 0 ? Math.round(metric.totalWait / metric.count) : 0,
    }
  }

  /**
   * Reset de límites
   */
  reset(key: string): void {
    this.initializeState(key)
    logger.info({ type: 'rate_limit_reset', key }, `Rate limit reseteado: ${key}`)
  }

  /**
   * Obtener configuración
   */
  getConfig(key: string): RateLimitConfig | null {
    return this.config.get(key) || null
  }
}

export class Throttler {
  private lastCall: Map<string, number> = new Map()
  private concurrent: Map<string, number> = new Map()
  private queue: Map<string, any[]> = new Map()

  constructor(private config: Map<string, ThrottleConfig> = new Map()) {
    logger.debug({ type: 'throttler_init' }, 'Throttler inicializado')
  }

  /**
   * Configurar throttle
   */
  setConfig(key: string, config: ThrottleConfig): void {
    this.config.set(key, config)
    logger.debug({ type: 'throttle_config_set', key }, `Throttle configurado: ${key}`)
  }

  /**
   * Ejecutar con throttle
   */
  async throttle<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const config = this.config.get(key)
    if (!config) {
      return fn()
    }

    // Verificar tiempo mínimo
    const lastTime = this.lastCall.get(key) || 0
    const elapsed = Date.now() - lastTime
    if (elapsed < config.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, config.minInterval - elapsed))
    }

    // Verificar concurrencia
    if (config.maxConcurrent) {
      const count = this.concurrent.get(key) || 0
      if (count >= config.maxConcurrent) {
        // Encolar
        const queue = this.queue.get(key) || []
        queue.push(fn)
        this.queue.set(key, queue)

        while (this.queue.get(key)?.length) {
          await new Promise((resolve) => setTimeout(resolve, config.minInterval))
        }

        return fn()
      }

      this.concurrent.set(key, count + 1)
    }

    try {
      const result = await fn()
      this.lastCall.set(key, Date.now())
      return result
    } finally {
      if (config.maxConcurrent) {
        const count = this.concurrent.get(key) || 0
        this.concurrent.set(key, Math.max(0, count - 1))
      }
    }
  }

  /**
   * Obtener estado
   */
  getStatus(key: string): { lastCall: number; concurrent: number; queued: number } {
    return {
      lastCall: this.lastCall.get(key) || 0,
      concurrent: this.concurrent.get(key) || 0,
      queued: (this.queue.get(key) || []).length,
    }
  }
}

let globalRateLimiter: RateLimiter | null = null
let globalThrottler: Throttler | null = null

export function initializeRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter()
  }
  return globalRateLimiter
}

export function getRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    return initializeRateLimiter()
  }
  return globalRateLimiter
}

export function initializeThrottler(): Throttler {
  if (!globalThrottler) {
    globalThrottler = new Throttler()
  }
  return globalThrottler
}

export function getThrottler(): Throttler {
  if (!globalThrottler) {
    return initializeThrottler()
  }
  return globalThrottler
}
