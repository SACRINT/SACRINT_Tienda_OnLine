/**
 * Database Query Monitoring
 * Semana 31, Tarea 31.4: Monitoreo de queries Prisma, detección de queries lentas y N+1
 */

import { logger } from './logger'
import { captureException, addBreadcrumb } from './sentry'

/**
 * Interfaz para información de query
 */
export interface QueryInfo {
  model: string
  operation: string
  duration: number
  timestamp: number
  isSlow: boolean
  args?: Record<string, any>
  error?: Error
}

/**
 * Configuración de monitoreo de queries
 */
export interface QueryMonitorConfig {
  slowQueryThreshold: number // ms, default 1000
  trackN1Queries: boolean // default true
  enableLogging: boolean // default true
}

/**
 * Monitor de queries de Prisma
 */
export class DatabaseQueryMonitor {
  private config: QueryMonitorConfig
  private queryHistory: QueryInfo[] = []
  private slowQueries: QueryInfo[] = []
  private maxHistorySize = 1000

  constructor(config: Partial<QueryMonitorConfig> = {}) {
    this.config = {
      slowQueryThreshold: 1000,
      trackN1Queries: true,
      enableLogging: true,
      ...config,
    }
  }

  /**
   * Registrar una query ejecutada
   */
  recordQuery(info: QueryInfo): void {
    // Agregar al historial
    this.queryHistory.push(info)

    // Mantener límite de tamaño
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory.shift()
    }

    // Registrar si es slow
    if (info.isSlow) {
      this.slowQueries.push(info)
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift()
      }
    }

    // Loguear
    if (this.config.enableLogging) {
      const level = info.isSlow ? 'warn' : 'debug'
      logger[level](
        {
          type: 'database_query',
          model: info.model,
          operation: info.operation,
          duration: info.duration,
          isSlow: info.isSlow,
          timestamp: info.timestamp,
        },
        `DB Query: ${info.model}.${info.operation} (${info.duration}ms)`,
      )
    }

    // Enviar a Sentry si es slow
    if (info.isSlow) {
      addBreadcrumb({
        category: 'database',
        message: `Slow query: ${info.model}.${info.operation}`,
        level: 'warning',
        data: {
          duration: info.duration,
          threshold: this.config.slowQueryThreshold,
        },
      })
    }

    // Registrar error
    if (info.error) {
      logger.error(
        {
          type: 'database_query_error',
          model: info.model,
          operation: info.operation,
          error: info.error,
        },
        `DB Query failed: ${info.model}.${info.operation}`,
      )
      captureException(info.error)
    }
  }

  /**
   * Detectar posibles queries N+1
   */
  detectNPlusOneQueries(): { model: string; count: number; duration: number }[] {
    const grouped: Record<string, QueryInfo[]> = {}

    // Agrupar queries por modelo
    for (const query of this.queryHistory) {
      const key = `${query.model}.${query.operation}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(query)
    }

    // Detectar patrones N+1
    const nPlusOne = []
    for (const [key, queries] of Object.entries(grouped)) {
      if (queries.length > 5) {
        const totalDuration = queries.reduce((sum, q) => sum + q.duration, 0)
        const [model, operation] = key.split('.')

        nPlusOne.push({
          model,
          count: queries.length,
          duration: totalDuration,
        })

        logger.warn(
          {
            type: 'n_plus_one_detected',
            model,
            operation,
            queryCount: queries.length,
            totalDuration,
          },
          `N+1 Query pattern detected: ${key} executed ${queries.length} times`,
        )
      }
    }

    return nPlusOne
  }

  /**
   * Obtener estadísticas de queries
   */
  getStats(): {
    totalQueries: number
    slowQueriesCount: number
    averageDuration: number
    slowestQuery: QueryInfo | null
    queriesByModel: Record<string, number>
  } {
    const totalQueries = this.queryHistory.length
    const slowQueriesCount = this.slowQueries.length

    let totalDuration = 0
    let slowestQuery: QueryInfo | null = null
    let maxDuration = 0

    const queriesByModel: Record<string, number> = {}

    for (const query of this.queryHistory) {
      totalDuration += query.duration

      if (query.duration > maxDuration) {
        maxDuration = query.duration
        slowestQuery = query
      }

      queriesByModel[query.model] = (queriesByModel[query.model] || 0) + 1
    }

    return {
      totalQueries,
      slowQueriesCount,
      averageDuration:
        totalQueries > 0 ? totalDuration / totalQueries : 0,
      slowestQuery,
      queriesByModel,
    }
  }

  /**
   * Obtener queries lentas
   */
  getSlowQueries(limit: number = 10): QueryInfo[] {
    return this.slowQueries.slice(-limit).reverse()
  }

  /**
   * Generar reporte
   */
  generateReport(): string {
    const stats = this.getStats()
    const nPlusOne = this.detectNPlusOneQueries()

    let report = 'Database Query Monitoring Report\n'
    report += '==================================\n\n'

    report += `Total Queries: ${stats.totalQueries}\n`
    report += `Slow Queries: ${stats.slowQueriesCount}\n`
    report += `Average Duration: ${stats.averageDuration.toFixed(2)}ms\n\n`

    if (stats.slowestQuery) {
      report += `Slowest Query:\n`
      report += `  Model: ${stats.slowestQuery.model}\n`
      report += `  Operation: ${stats.slowestQuery.operation}\n`
      report += `  Duration: ${stats.slowestQuery.duration}ms\n\n`
    }

    report += 'Queries by Model:\n'
    for (const [model, count] of Object.entries(stats.queriesByModel)) {
      report += `  ${model}: ${count}\n`
    }

    if (nPlusOne.length > 0) {
      report += '\nN+1 Query Patterns Detected:\n'
      for (const pattern of nPlusOne) {
        report += `  ${pattern.model}: ${pattern.count} queries (${pattern.duration.toFixed(2)}ms total)\n`
      }
    }

    return report
  }

  /**
   * Limpiar historial
   */
  clear(): void {
    this.queryHistory = []
    this.slowQueries = []
    logger.debug(
      { type: 'db_monitor_cleared' },
      'Database query monitor historial limpiado',
    )
  }
}

/**
 * Instancia global del monitor
 */
let globalMonitor: DatabaseQueryMonitor | null = null

/**
 * Inicializar el monitor globalmente
 */
export function initializeDatabaseMonitor(
  config?: Partial<QueryMonitorConfig>,
): DatabaseQueryMonitor {
  if (!globalMonitor) {
    globalMonitor = new DatabaseQueryMonitor(config)
  }
  return globalMonitor
}

/**
 * Obtener el monitor global
 */
export function getDatabaseMonitor(): DatabaseQueryMonitor {
  if (!globalMonitor) {
    return initializeDatabaseMonitor()
  }
  return globalMonitor
}

/**
 * Middleware para Prisma que registra todas las queries
 * Usar en prismaClient.$use() en el servidor
 */
export function createPrismaMonitoringMiddleware(config?: Partial<QueryMonitorConfig>) {
  const monitor = initializeDatabaseMonitor(config)

  return async (params: any, next: any) => {
    const startTime = Date.now()

    try {
      const result = await next(params)
      const duration = Date.now() - startTime
      const isSlow = duration > monitor['config'].slowQueryThreshold

      monitor.recordQuery({
        model: params.model,
        operation: params.action,
        duration,
        timestamp: Date.now(),
        isSlow,
        args: params.args,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      monitor.recordQuery({
        model: params.model,
        operation: params.action,
        duration,
        timestamp: Date.now(),
        isSlow: true,
        args: params.args,
        error: error as Error,
      })

      throw error
    }
  }
}

/**
 * Utilidad para obtener estadísticas en servidor
 */
export function getQueryStats() {
  const monitor = getDatabaseMonitor()
  return monitor.getStats()
}

/**
 * Utilidad para obtener queries lentas
 */
export function getSlowQueries(limit?: number) {
  const monitor = getDatabaseMonitor()
  return monitor.getSlowQueries(limit)
}

/**
 * Detectar N+1 en runtime
 */
export function detectNPlusOne() {
  const monitor = getDatabaseMonitor()
  return monitor.detectNPlusOneQueries()
}
