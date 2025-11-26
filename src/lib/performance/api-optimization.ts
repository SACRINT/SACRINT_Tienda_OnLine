/**
 * API Response Optimization
 * Semana 43, Tarea 43.6: API Response Optimization
 */

import { logger } from '@/lib/monitoring'

export interface ApiEndpoint {
  path: string
  method: string
  responseSize: number
  responseTime: number
  lastCalled: Date
  callCount: number
  optimizations: string[]
}

export interface ResponseMetrics {
  endpoint: string
  avgSize: number
  avgTime: number
  compressionRatio: number
  cacheHitRate: number
}

export class ApiOptimizationManager {
  private endpoints: Map<string, ApiEndpoint> = new Map()
  private responseCache: Map<string, any> = new Map()

  constructor() {
    logger.debug({ type: 'api_optimization_init' }, 'API Optimization Manager inicializado')
  }

  /**
   * Registrar endpoint
   */
  recordEndpoint(path: string, method: string, responseSize: number, responseTime: number): void {
    const key = `${method}:${path}`
    let endpoint = this.endpoints.get(key)

    if (!endpoint) {
      endpoint = {
        path,
        method,
        responseSize,
        responseTime,
        lastCalled: new Date(),
        callCount: 0,
        optimizations: [],
      }
      this.endpoints.set(key, endpoint)
    } else {
      endpoint.callCount++
      endpoint.responseSize = (endpoint.responseSize + responseSize) / 2
      endpoint.responseTime = (endpoint.responseTime + responseTime) / 2
      endpoint.lastCalled = new Date()
    }

    // Analizar optimizaciones
    this.analyzeEndpoint(endpoint)
  }

  /**
   * Analizar endpoint
   */
  private analyzeEndpoint(endpoint: ApiEndpoint): void {
    endpoint.optimizations = []

    if (endpoint.responseSize > 1000000) {
      endpoint.optimizations.push('Considerar paginar respuesta')
    }

    if (endpoint.responseTime > 1000) {
      endpoint.optimizations.push('Optimizar query de base de datos')
    }

    if (endpoint.callCount > 100 && endpoint.responseTime > 500) {
      endpoint.optimizations.push('Implementar caching')
    }

    if (endpoint.responseSize > 500000) {
      endpoint.optimizations.push('Habilitar compresión gzip')
    }
  }

  /**
   * Comprimir respuesta
   */
  compressResponse(data: string): string {
    // Simulación de compresión
    return Buffer.from(data).toString('base64').substring(0, Math.round(data.length * 0.7))
  }

  /**
   * Obtener ratio de compresión
   */
  getCompressionRatio(original: number, compressed: number): number {
    return Math.round(((original - compressed) / original) * 100)
  }

  /**
   * Generar reporte
   */
  generateOptimizationReport(): string {
    const endpoints = Array.from(this.endpoints.values())
    const slowEndpoints = endpoints.filter((e) => e.responseTime > 1000)
    const largeEndpoints = endpoints.filter((e) => e.responseSize > 1000000)

    const report = `
=== REPORTE DE OPTIMIZACIÓN DE API ===

ENDPOINTS MONITOREADOS: ${endpoints.length}

ENDPOINTS LENTOS (> 1000ms):
${slowEndpoints.slice(0, 5).map((e) => `- ${e.method} ${e.path}: ${e.responseTime}ms`).join('\n')}

ENDPOINTS GRANDES (> 1MB):
${largeEndpoints.slice(0, 5).map((e) => `- ${e.method} ${e.path}: ${(e.responseSize / 1000000).toFixed(2)}MB`).join('\n')}

SUGERENCIAS DE OPTIMIZACIÓN:
${Array.from(new Set(endpoints.flatMap((e) => e.optimizations)))
  .slice(0, 10)
  .map((s) => `- ${s}`)
  .join('\n')}
    `

    logger.info({ type: 'api_optimization_report_generated' }, 'Reporte de optimización de API generado')
    return report
  }

  /**
   * Obtener endpoints más lentos
   */
  getSlowestEndpoints(limit: number = 10): ApiEndpoint[] {
    return Array.from(this.endpoints.values())
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit)
  }
}

let globalApiOptimizationManager: ApiOptimizationManager | null = null

export function initializeApiOptimizationManager(): ApiOptimizationManager {
  if (!globalApiOptimizationManager) {
    globalApiOptimizationManager = new ApiOptimizationManager()
  }
  return globalApiOptimizationManager
}

export function getApiOptimizationManager(): ApiOptimizationManager {
  if (!globalApiOptimizationManager) {
    return initializeApiOptimizationManager()
  }
  return globalApiOptimizationManager
}
