/**
 * Caching Strategy
 * Semana 43, Tarea 43.3: Caching Strategy
 */

import { logger } from '@/lib/monitoring'

export interface CacheEntry {
  key: string
  value: any
  ttl: number
  createdAt: Date
  expiresAt: Date
  hits: number
}

export interface CacheStrategy {
  name: string
  ttl: number
  maxSize: number
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO'
}

export class CachingStrategyManager {
  private cache: Map<string, CacheEntry> = new Map()
  private strategies: Map<string, CacheStrategy> = new Map()
  private defaultStrategy: CacheStrategy

  constructor() {
    this.defaultStrategy = {
      name: 'default',
      ttl: 3600000, // 1 hour
      maxSize: 10000,
      evictionPolicy: 'LRU',
    }
    logger.debug({ type: 'caching_init' }, 'Caching Strategy Manager inicializado')
  }

  /**
   * Definir estrategia de caché
   */
  defineStrategy(name: string, ttl: number, maxSize: number, evictionPolicy: 'LRU' | 'LFU' | 'FIFO'): CacheStrategy {
    const strategy: CacheStrategy = {
      name,
      ttl,
      maxSize,
      evictionPolicy,
    }

    this.strategies.set(name, strategy)
    logger.info({ type: 'cache_strategy_defined', name, ttl, maxSize }, `Estrategia de caché definida: ${name}`)

    return strategy
  }

  /**
   * Establecer valor en caché
   */
  set(key: string, value: any, strategyName: string = 'default', ttl?: number): void {
    const strategy = this.strategies.get(strategyName) || this.defaultStrategy
    const actualTTL = ttl || strategy.ttl

    // Verificar límite de tamaño
    if (this.cache.size >= strategy.maxSize) {
      this.evict(strategy.evictionPolicy)
    }

    const entry: CacheEntry = {
      key,
      value,
      ttl: actualTTL,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + actualTTL),
      hits: 0,
    }

    this.cache.set(key, entry)

    logger.debug({ type: 'cache_set', key, strategy: strategyName }, `Valor almacenado en caché: ${key}`)
  }

  /**
   * Obtener valor de caché
   */
  get(key: string): any {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Verificar expiración
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    entry.hits++
    return entry.value
  }

  /**
   * Verificar si existe en caché
    */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (new Date() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Limpiar entrada
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Limpiar caché
   */
  clear(): void {
    this.cache.clear()
    logger.info({ type: 'cache_cleared' }, 'Caché completamente limpiada')
  }

  /**
   * Política de evicción
   */
  private evict(policy: 'LRU' | 'LFU' | 'FIFO'): void {
    let toDelete: string | null = null

    if (policy === 'LRU') {
      // Menos recientemente usado
      let oldest: CacheEntry | null = null
      for (const [key, entry] of this.cache) {
        if (!oldest || entry.createdAt < oldest.createdAt) {
          oldest = entry
          toDelete = key
        }
      }
    } else if (policy === 'LFU') {
      // Menos frecuentemente usado
      let leastUsed: CacheEntry | null = null
      for (const [key, entry] of this.cache) {
        if (!leastUsed || entry.hits < leastUsed.hits) {
          leastUsed = entry
          toDelete = key
        }
      }
    } else if (policy === 'FIFO') {
      // First in, first out
      const first = this.cache.entries().next()
      toDelete = first.value?.[0] || null
    }

    if (toDelete) {
      this.cache.delete(toDelete)
      logger.debug({ type: 'cache_evicted', policy, key: toDelete }, `Entrada eviccionada: ${toDelete}`)
    }
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    size: number
    maxSize: number
    hitRate: number
    totalHits: number
  } {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0)
    const hitRate = entries.length > 0 ? totalHits / entries.length : 0

    return {
      size: this.cache.size,
      maxSize: this.defaultStrategy.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits,
    }
  }

  /**
   * Generar reporte de caché
   */
  generateCacheReport(): string {
    const stats = this.getStatistics()
    const entries = Array.from(this.cache.values())
    const topUsed = entries.sort((a, b) => b.hits - a.hits).slice(0, 5)

    const report = `
=== REPORTE DE ESTRATEGIA DE CACHÉ ===

ESTADÍSTICAS:
- Tamaño del Caché: ${stats.size}/${stats.maxSize}
- Tasa de Hit: ${(stats.hitRate * 100).toFixed(2)}%
- Total de Hits: ${stats.totalHits}

TOP 5 ENTRADAS MÁS USADAS:
${topUsed.map((e) => `- ${e.key}: ${e.hits} hits`).join('\n')}

ESTRATEGIAS:
${Array.from(this.strategies.values())
  .map((s) => `- ${s.name}: TTL ${s.ttl}ms, Max ${s.maxSize}, ${s.evictionPolicy}`)
  .join('\n')}
    `

    logger.info({ type: 'cache_report_generated' }, 'Reporte de caché generado')
    return report
  }
}

let globalCachingStrategyManager: CachingStrategyManager | null = null

export function initializeCachingStrategyManager(): CachingStrategyManager {
  if (!globalCachingStrategyManager) {
    globalCachingStrategyManager = new CachingStrategyManager()
  }
  return globalCachingStrategyManager
}

export function getCachingStrategyManager(): CachingStrategyManager {
  if (!globalCachingStrategyManager) {
    return initializeCachingStrategyManager()
  }
  return globalCachingStrategyManager
}
