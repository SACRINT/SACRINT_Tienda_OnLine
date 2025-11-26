/**
 * Health Checks - Servicios, Base de Datos, Cache
 * Semana 31, Tarea 31.7: Sistema de health checks para servicios críticos
 */

import { logger } from './logger'
import { addBreadcrumb } from './sentry'

/**
 * Estado de un servicio
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

/**
 * Resultado de check de un servicio
 */
export interface HealthCheckResult {
  name: string
  status: HealthStatus
  timestamp: number
  responseTime: number
  message?: string
  details?: Record<string, any>
}

/**
 * Función de check
 */
export type HealthCheckFn = () => Promise<{
  healthy: boolean
  responseTime: number
  message?: string
  details?: Record<string, any>
}>

/**
 * Configuración de check
 */
export interface HealthCheckConfig {
  name: string
  check: HealthCheckFn
  timeout: number // ms
  interval: number // ms entre checks
  critical: boolean // ¿Es crítico?
}

/**
 * Estado agregado de todos los servicios
 */
export interface HealthCheckSummary {
  status: HealthStatus
  timestamp: number
  checks: HealthCheckResult[]
  uptime: number // %
  lastCriticalError?: string
}

/**
 * Monitor de health checks
 */
export class HealthCheckMonitor {
  private checks: Map<string, HealthCheckConfig> = new Map()
  private results: Map<string, HealthCheckResult[]> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private maxHistoryPerService = 100

  constructor() {
    logger.debug({ type: 'health_monitor_init' }, 'Health Check Monitor inicializado')
  }

  /**
   * Registrar un check
   */
  registerCheck(config: HealthCheckConfig): void {
    this.checks.set(config.name, config)
    this.results.set(config.name, [])

    logger.debug(
      { type: 'health_check_registered', name: config.name },
      `Health check registrado: ${config.name}`,
    )
  }

  /**
   * Ejecutar un check individual
   */
  async runCheck(name: string): Promise<HealthCheckResult> {
    const config = this.checks.get(name)
    if (!config) {
      throw new Error(`Health check no encontrado: ${name}`)
    }

    const startTime = Date.now()

    try {
      const result = await Promise.race([
        config.check(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Health check timeout')),
            config.timeout,
          ),
        ),
      ]) as Awaited<ReturnType<HealthCheckFn>>

      const responseTime = Date.now() - startTime

      const healthResult: HealthCheckResult = {
        name,
        status: result.healthy ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        responseTime,
        message: result.message,
        details: result.details,
      }

      // Guardar en historial
      const history = this.results.get(name) || []
      history.push(healthResult)
      if (history.length > this.maxHistoryPerService) {
        history.shift()
      }
      this.results.set(name, history)

      logger.debug(
        {
          type: 'health_check_result',
          name,
          status: healthResult.status,
          responseTime,
        },
        `Health Check ${name}: ${healthResult.status}`,
      )

      return healthResult
    } catch (error) {
      const responseTime = Date.now() - startTime

      const healthResult: HealthCheckResult = {
        name,
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime,
        message: error instanceof Error ? error.message : 'Unknown error',
      }

      // Guardar en historial
      const history = this.results.get(name) || []
      history.push(healthResult)
      if (history.length > this.maxHistoryPerService) {
        history.shift()
      }
      this.results.set(name, history)

      logger.warn(
        {
          type: 'health_check_failed',
          name,
          error: error instanceof Error ? error.message : String(error),
        },
        `Health Check FAILED: ${name}`,
      )

      // Alertar si es crítico
      if (config.critical) {
        addBreadcrumb({
          category: 'health',
          message: `Critical service unhealthy: ${name}`,
          level: 'error',
          data: { error: healthResult.message },
        })
      }

      return healthResult
    }
  }

  /**
   * Ejecutar todos los checks
   */
  async runAllChecks(): Promise<HealthCheckResult[]> {
    const promises = Array.from(this.checks.keys()).map((name) =>
      this.runCheck(name),
    )

    const results = await Promise.all(promises)
    return results
  }

  /**
   * Iniciar monitoreo periódico
   */
  startMonitoring(): void {
    for (const [name, config] of this.checks) {
      if (this.intervals.has(name)) {
        continue // Ya está corriendo
      }

      // Ejecutar check inicial
      this.runCheck(name).catch((error) => {
        logger.error(
          { type: 'health_check_init_error', name, error },
          `Error ejecutando check inicial: ${name}`,
        )
      })

      // Configurar intervalo
      const interval = setInterval(
        () => {
          this.runCheck(name).catch((error) => {
            logger.error(
              { type: 'health_check_interval_error', name, error },
              `Error en intervalo de check: ${name}`,
            )
          })
        },
        config.interval,
      )

      this.intervals.set(name, interval)
    }

    logger.info(
      { type: 'health_monitoring_started', count: this.checks.size },
      `Health monitoring iniciado para ${this.checks.size} servicios`,
    )
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring(): void {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval)
    }
    this.intervals.clear()
    logger.info(
      { type: 'health_monitoring_stopped' },
      'Health monitoring detenido',
    )
  }

  /**
   * Obtener resultado más reciente de un check
   */
  getLatestResult(name: string): HealthCheckResult | undefined {
    const history = this.results.get(name)
    return history?.[history.length - 1]
  }

  /**
   * Obtener historial de un check
   */
  getCheckHistory(name: string, limit: number = 50): HealthCheckResult[] {
    const history = this.results.get(name) || []
    return history.slice(-limit)
  }

  /**
   * Calcular uptime (basado en últimas 100 ejecuciones)
   */
  calculateUptime(name: string): number {
    const history = this.getCheckHistory(name)
    if (history.length === 0) return 100

    const healthy = history.filter(
      (r) => r.status === 'healthy' || r.status === 'degraded',
    ).length

    return (healthy / history.length) * 100
  }

  /**
   * Obtener resumen de salud
   */
  async getHealthSummary(): Promise<HealthCheckSummary> {
    const results = await this.runAllChecks()

    // Determinar estado general
    const hasCriticalUnhealthy = results.some(
      (r) => this.checks.get(r.name)?.critical && r.status === 'unhealthy',
    )

    const allHealthy = results.every((r) => r.status === 'healthy')
    const allDegraded = results.every(
      (r) => r.status === 'healthy' || r.status === 'degraded',
    )

    let overallStatus: HealthStatus = 'unknown'
    if (hasCriticalUnhealthy) {
      overallStatus = 'unhealthy'
    } else if (allHealthy) {
      overallStatus = 'healthy'
    } else if (allDegraded) {
      overallStatus = 'degraded'
    }

    // Calcular uptime promedio
    const uptimes = Array.from(this.checks.keys()).map((name) =>
      this.calculateUptime(name),
    )
    const avgUptime =
      uptimes.length > 0
        ? uptimes.reduce((a, b) => a + b) / uptimes.length
        : 100

    const lastCriticalError = results
      .filter((r) => this.checks.get(r.name)?.critical)
      .find((r) => r.status === 'unhealthy')?.message

    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks: results,
      uptime: avgUptime,
      lastCriticalError,
    }
  }

  /**
   * Generar reporte
   */
  async generateReport(): Promise<string> {
    const summary = await this.getHealthSummary()

    let report = 'Health Check Report\n'
    report += '===================\n\n'

    report += `Overall Status: ${summary.status.toUpperCase()}\n`
    report += `Average Uptime: ${summary.uptime.toFixed(2)}%\n`
    report += `Timestamp: ${new Date(summary.timestamp).toISOString()}\n\n`

    report += 'Service Status:\n'
    for (const check of summary.checks) {
      const config = this.checks.get(check.name)
      const uptime = this.calculateUptime(check.name)
      const icon =
        check.status === 'healthy'
          ? '✅'
          : check.status === 'degraded'
            ? '⚠️'
            : '❌'

      report += `${icon} ${check.name} (${check.status}) - ${check.responseTime}ms\n`
      report += `   Uptime: ${uptime.toFixed(2)}% | Critical: ${config?.critical ? 'Yes' : 'No'}\n`
      if (check.message) {
        report += `   Message: ${check.message}\n`
      }
    }

    return report
  }
}

/**
 * Instancia global
 */
let globalMonitor: HealthCheckMonitor | null = null

/**
 * Inicializar globalmente
 */
export function initializeHealthCheckMonitor(): HealthCheckMonitor {
  if (!globalMonitor) {
    globalMonitor = new HealthCheckMonitor()
  }
  return globalMonitor
}

/**
 * Obtener monitor global
 */
export function getHealthCheckMonitor(): HealthCheckMonitor {
  if (!globalMonitor) {
    return initializeHealthCheckMonitor()
  }
  return globalMonitor
}

/**
 * Health check predefinidos comunes
 */
export const CommonHealthChecks = {
  /**
   * Check de disponibilidad de base de datos
   */
  database: (prisma: any): HealthCheckConfig => ({
    name: 'Database',
    critical: true,
    timeout: 5000,
    interval: 30000, // 30 segundos
    check: async () => {
      const start = Date.now()
      try {
        await prisma.$queryRaw`SELECT 1`
        return {
          healthy: true,
          responseTime: Date.now() - start,
        }
      } catch (error) {
        return {
          healthy: false,
          responseTime: Date.now() - start,
          message: error instanceof Error ? error.message : 'Database check failed',
        }
      }
    },
  }),

  /**
   * Check de memoria
   */
  memory: (): HealthCheckConfig => ({
    name: 'Memory',
    critical: false,
    timeout: 1000,
    interval: 60000, // 1 minuto
    check: async () => {
      const start = Date.now()
      const memUsage = process.memoryUsage()
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

      return {
        healthy: heapUsedPercent < 85,
        responseTime: Date.now() - start,
        details: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
          percentage: heapUsedPercent.toFixed(2) + '%',
        },
      }
    },
  }),

  /**
   * Check de CPU
   */
  uptime: (): HealthCheckConfig => ({
    name: 'Uptime',
    critical: true,
    timeout: 1000,
    interval: 300000, // 5 minutos
    check: async () => {
      const start = Date.now()
      const uptime = process.uptime()

      return {
        healthy: true,
        responseTime: Date.now() - start,
        details: {
          uptime: Math.round(uptime) + 's',
          hours: (uptime / 3600).toFixed(2),
        },
      }
    },
  }),

  /**
   * Check de API externo
   */
  externalAPI: (
    endpoint: string,
    timeout: number = 5000,
  ): HealthCheckConfig => ({
    name: `External API: ${endpoint}`,
    critical: false,
    timeout,
    interval: 60000,
    check: async () => {
      const start = Date.now()
      try {
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(timeout) })
        return {
          healthy: response.ok,
          responseTime: Date.now() - start,
          details: { statusCode: response.status },
        }
      } catch (error) {
        return {
          healthy: false,
          responseTime: Date.now() - start,
          message: error instanceof Error ? error.message : 'API check failed',
        }
      }
    },
  }),
}
