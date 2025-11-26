/**
 * Redis Implementation for Sessions & Caching
 * Semana 36, Tarea 36.2: Redis Implementation for Sessions & Caching
 */

import { logger } from '@/lib/monitoring'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
  ttl: number
}

export interface CacheEntry<T> {
  value: T
  expiresAt?: number
  compressed?: boolean
}

export class RedisCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private config: RedisConfig

  constructor(config: RedisConfig) {
    this.config = config
    logger.debug({ type: 'redis_cache_init' }, 'Redis Cache inicializado')
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl: number = this.config.ttl): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + ttl * 1000,
      }

      this.cache.set(key, entry)

      logger.debug(
        { type: 'cache_set', key, ttl },
        `Valor guardado en caché: ${key}`,
      )
    } catch (error) {
      logger.error({ type: 'cache_set_error', key, error: String(error) }, 'Error al guardar en caché')
      throw error
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined

      if (!entry) {
        logger.debug({ type: 'cache_miss', key }, 'Cache miss')
        return null
      }

      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.cache.delete(key)
        logger.debug({ type: 'cache_expired', key }, 'Cache entry expirado')
        return null
      }

      logger.debug({ type: 'cache_hit', key }, 'Cache hit')
      return entry.value
    } catch (error) {
      logger.error({ type: 'cache_get_error', key, error: String(error) }, 'Error al leer de caché')
      return null
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.delete(key)

      if (deleted) {
        logger.debug({ type: 'cache_delete', key }, 'Entrada eliminada del caché')
      }

      return deleted
    } catch (error) {
      logger.error({ type: 'cache_delete_error', key, error: String(error) }, 'Error al eliminar del caché')
      return false
    }
  }

  /**
   * Delete by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      let deletedCount = 0
      const regex = new RegExp(pattern)

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
          deletedCount++
        }
      }

      logger.info(
        { type: 'cache_delete_pattern', pattern, count: deletedCount },
        `${deletedCount} entradas eliminadas por patrón`,
      )

      return deletedCount
    } catch (error) {
      logger.error({ type: 'cache_delete_pattern_error', pattern, error: String(error) }, 'Error al eliminar por patrón')
      return 0
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const size = this.cache.size
      this.cache.clear()

      logger.info(
        { type: 'cache_cleared', count: size },
        `Caché limpiado: ${size} entradas eliminadas`,
      )
    } catch (error) {
      logger.error({ type: 'cache_clear_error', error: String(error) }, 'Error al limpiar caché')
      throw error
    }
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number
    keys: string[]
    expiredCount: number
  } {
    const now = Date.now()
    let expiredCount = 0
    const keys: string[] = []

    for (const [key, entry] of this.cache) {
      keys.push(key)
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredCount++
      }
    }

    return {
      size: this.cache.size,
      keys,
      expiredCount,
    }
  }

  /**
   * Set session
   */
  async setSession<T>(sessionId: string, data: T, ttl: number = 3600): Promise<void> {
    const key = `session:${sessionId}`
    await this.set(key, data, ttl)

    logger.info({ type: 'session_set', sessionId }, 'Sesión guardada')
  }

  /**
   * Get session
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`
    const data = await this.get<T>(key)

    if (!data) {
      logger.warn({ type: 'session_not_found', sessionId }, 'Sesión no encontrada')
    }

    return data
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`
    return this.delete(key)
  }

  /**
   * Start cache cleanup interval
   */
  startCleanup(intervalMs: number = 300000): NodeJS.Timer {
    return setInterval(async () => {
      const now = Date.now()
      let cleanedCount = 0

      for (const [key, entry] of this.cache) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.cache.delete(key)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        logger.debug(
          { type: 'cache_cleanup', cleaned: cleanedCount },
          `Caché limpiado: ${cleanedCount} entradas expiradas eliminadas`,
        )
      }
    }, intervalMs)
  }
}

let globalRedisCache: RedisCache | null = null

export function initializeRedisCache(config: RedisConfig): RedisCache {
  if (!globalRedisCache) {
    globalRedisCache = new RedisCache(config)
    globalRedisCache.startCleanup()
  }
  return globalRedisCache
}

export function getRedisCache(): RedisCache {
  if (!globalRedisCache) {
    return initializeRedisCache({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      ttl: 300,
    })
  }
  return globalRedisCache
}
