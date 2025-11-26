/**
 * Search Performance Optimization
 * Semana 39, Tarea 39.6: Search Performance Optimization
 */

import { logger } from '@/lib/monitoring'

export interface SearchQueryCache {
  query: string
  results: any[]
  resultCount: number
  ttl: number
  createdAt: Date
  hits: number
}

export interface SearchOptimization {
  id: string
  type: 'cache' | 'index' | 'query_simplification' | 'result_limiting'
  target: string
  improvement: number
  appliedDate: Date
}

export interface PerformanceMetrics {
  avgQueryTime: number
  cacheHitRate: number
  p95QueryTime: number
  p99QueryTime: number
  queriesPerSecond: number
  indexSize: number
}

export class SearchPerformanceManager {
  private queryCache: Map<string, SearchQueryCache> = new Map()
  private queryMetrics: Array<{ query: string; time: number; timestamp: Date }> = []
  private optimizations: Map<string, SearchOptimization> = new Map()
  private indexStats: { size: number; lastOptimized: Date } = { size: 0, lastOptimized: new Date() }

  constructor() {
    logger.debug({ type: 'search_performance_init' }, 'Search Performance Manager inicializado')
    this.startCacheCleanup()
  }

  /**
   * Cachear resultado de búsqueda
   */
  cacheResult(query: string, results: any[], ttl: number = 3600): void {
    const cache: SearchQueryCache = {
      query,
      results,
      resultCount: results.length,
      ttl,
      createdAt: new Date(),
      hits: 0,
    }

    this.queryCache.set(query, cache)

    logger.debug({ type: 'query_cached', query, resultCount: results.length, ttl }, `Búsqueda cacheada: ${query}`)
  }

  /**
   * Obtener resultado cacheado
   */
  getCachedResult(query: string): any[] | null {
    const cached = this.queryCache.get(query)

    if (!cached) return null

    // Verificar TTL
    const age = (Date.now() - cached.createdAt.getTime()) / 1000
    if (age > cached.ttl) {
      this.queryCache.delete(query)
      return null
    }

    cached.hits++
    return cached.results
  }

  /**
   * Registrar métrica de búsqueda
   */
  recordQueryMetric(query: string, timeMs: number): void {
    this.queryMetrics.push({ query, time: timeMs, timestamp: new Date() })

    // Limitar historial a últimas 1000 búsquedas
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift()
    }
  }

  /**
   * Obtener métricas de performance
   */
  getMetrics(): PerformanceMetrics {
    if (this.queryMetrics.length === 0) {
      return {
        avgQueryTime: 0,
        cacheHitRate: 0,
        p95QueryTime: 0,
        p99QueryTime: 0,
        queriesPerSecond: 0,
        indexSize: 0,
      }
    }

    const times = this.queryMetrics.map((m) => m.time).sort((a, b) => a - b)
    const avgTime = times.reduce((a, b) => a + b) / times.length
    const p95Index = Math.floor(times.length * 0.95)
    const p99Index = Math.floor(times.length * 0.99)

    // Calcular cache hit rate
    let totalHits = 0
    for (const cached of this.queryCache.values()) {
      totalHits += cached.hits
    }
    const cacheHitRate = this.queryMetrics.length > 0 ? totalHits / this.queryMetrics.length : 0

    // Calcular queries per second
    const timeSpan = Math.max(1, (Date.now() - this.queryMetrics[0].timestamp.getTime()) / 1000)
    const qps = this.queryMetrics.length / timeSpan

    return {
      avgQueryTime: avgTime,
      cacheHitRate,
      p95QueryTime: times[p95Index] || 0,
      p99QueryTime: times[p99Index] || 0,
      queriesPerSecond: qps,
      indexSize: this.indexStats.size,
    }
  }

  /**
   * Aplicar optimización
   */
  applyOptimization(type: string, target: string, improvement: number): SearchOptimization {
    const optimization: SearchOptimization = {
      id: `opt_${Date.now()}`,
      type: type as any,
      target,
      improvement,
      appliedDate: new Date(),
    }

    this.optimizations.set(optimization.id, optimization)

    logger.info(
      { type: 'optimization_applied', optimizationType: type, target, improvement: `${improvement}%` },
      `Optimización aplicada: ${improvement}% mejora en ${target}`,
    )

    return optimization
  }

  /**
   * Limpiar caché
   */
  clearCache(pattern?: string): number {
    let cleared = 0

    if (!pattern) {
      cleared = this.queryCache.size
      this.queryCache.clear()
    } else {
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
          cleared++
        }
      }
    }

    logger.info({ type: 'cache_cleared', count: cleared }, `${cleared} queries borradas del caché`)
    return cleared
  }

  /**
   * Iniciar limpieza automática de caché
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      let expired = 0

      for (const [key, cached] of this.queryCache) {
        const age = (now - cached.createdAt.getTime()) / 1000
        if (age > cached.ttl) {
          this.queryCache.delete(key)
          expired++
        }
      }

      if (expired > 0) {
        logger.debug({ type: 'cache_cleanup', expired }, `${expired} queries expiradas eliminadas`)
      }
    }, 300000) // Cada 5 minutos
  }

  /**
   * Obtener estadísticas de caché
   */
  getCacheStats(): { size: number; hitRate: number; avgResultsPerQuery: number } {
    let totalHits = 0
    let totalResults = 0

    for (const cached of this.queryCache.values()) {
      totalHits += cached.hits
      totalResults += cached.resultCount
    }

    return {
      size: this.queryCache.size,
      hitRate: this.queryMetrics.length > 0 ? totalHits / this.queryMetrics.length : 0,
      avgResultsPerQuery: this.queryCache.size > 0 ? totalResults / this.queryCache.size : 0,
    }
  }

  /**
   * Identificar queries lentas
   */
  getSlowQueries(threshold: number = 1000, limit: number = 10): Array<{ query: string; time: number }> {
    return this.queryMetrics
      .filter((m) => m.time > threshold)
      .map((m) => ({ query: m.query, time: m.time }))
      .sort((a, b) => b.time - a.time)
      .slice(0, limit)
  }
}

let globalSearchPerformanceManager: SearchPerformanceManager | null = null

export function initializeSearchPerformanceManager(): SearchPerformanceManager {
  if (!globalSearchPerformanceManager) {
    globalSearchPerformanceManager = new SearchPerformanceManager()
  }
  return globalSearchPerformanceManager
}

export function getSearchPerformanceManager(): SearchPerformanceManager {
  if (!globalSearchPerformanceManager) {
    return initializeSearchPerformanceManager()
  }
  return globalSearchPerformanceManager
}
