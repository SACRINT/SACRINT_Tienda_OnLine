/**
 * Performance Monitoring & Metrics
 * Semana 43, Tarea 43.1: Performance Monitoring & Metrics
 */

import { logger } from '@/lib/monitoring'

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export interface PerformanceMark {
  name: string
  startTime: number
  duration: number
}

export interface PerformanceReport {
  timestamp: Date
  metrics: PerformanceMetric[]
  summary: {
    avgResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    requestsPerSecond: number
    errorRate: number
  }
}

export class PerformanceMonitoringManager {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private marks: Map<string, PerformanceMark> = new Map()
  private reports: PerformanceReport[] = []

  constructor() {
    logger.debug({ type: 'performance_monitoring_init' }, 'Performance Monitoring Manager inicializado')
  }

  /**
   * Registrar métrica de rendimiento
   */
  recordMetric(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>): PerformanceMetric {
    const metric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(metric)

    logger.debug(
      { type: 'performance_metric_recorded', name, value, unit },
      `Métrica registrada: ${name}=${value}${unit}`
    )

    return metric
  }

  /**
   * Marcar inicio de operación
   */
  markStart(name: string): void {
    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      duration: 0,
    }

    this.marks.set(name, mark)
  }

  /**
   * Marcar fin de operación
   */
  markEnd(name: string): number {
    const mark = this.marks.get(name)
    if (!mark) return 0

    const duration = performance.now() - mark.startTime
    mark.duration = duration

    this.recordMetric(`${name}_duration`, Math.round(duration), 'ms')
    this.marks.delete(name)

    return duration
  }

  /**
   * Medir operación
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.markStart(name)
    try {
      return await fn()
    } finally {
      this.markEnd(name)
    }
  }

  /**
   * Obtener métrica promedio
   */
  getAverageMetric(name: string): number {
    const metricsList = this.metrics.get(name) || []
    if (metricsList.length === 0) return 0

    const sum = metricsList.reduce((acc, m) => acc + m.value, 0)
    return sum / metricsList.length
  }

  /**
   * Obtener percentil
   */
  getPercentile(name: string, percentile: number): number {
    const metricsList = this.metrics.get(name) || []
    if (metricsList.length === 0) return 0

    const sorted = metricsList.map((m) => m.value).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1

    return sorted[Math.max(0, index)]
  }

  /**
   * Calcular resumen
   */
  calculateSummary(): PerformanceReport['summary'] {
    const responseTimes = this.metrics.get('response_time') || []
    const requests = responseTimes.length

    const avgResponseTime = responseTimes.length > 0 ? this.getAverageMetric('response_time') : 0
    const p95ResponseTime = this.getPercentile('response_time', 95)
    const p99ResponseTime = this.getPercentile('response_time', 99)

    const errors = (this.metrics.get('errors') || []).reduce((sum, m) => sum + m.value, 0)
    const errorRate = requests > 0 ? (errors / requests) * 100 : 0

    return {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      requestsPerSecond: requests / 60,
      errorRate: Math.round(errorRate * 100) / 100,
    }
  }

  /**
   * Generar reporte
   */
  generateReport(): PerformanceReport {
    const allMetrics: PerformanceMetric[] = []
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics.slice(-10)) // Últimas 10 de cada tipo
    }

    const report: PerformanceReport = {
      timestamp: new Date(),
      metrics: allMetrics,
      summary: this.calculateSummary(),
    }

    this.reports.push(report)

    logger.info({ type: 'performance_report_generated' }, 'Reporte de rendimiento generado')

    return report
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    totalMetrics: number
    avgResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
  } {
    const summary = this.calculateSummary()
    const totalMetrics = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.length, 0)

    return {
      totalMetrics,
      avgResponseTime: summary.avgResponseTime,
      p95ResponseTime: summary.p95ResponseTime,
      p99ResponseTime: summary.p99ResponseTime,
    }
  }
}

let globalPerformanceMonitoringManager: PerformanceMonitoringManager | null = null

export function initializePerformanceMonitoringManager(): PerformanceMonitoringManager {
  if (!globalPerformanceMonitoringManager) {
    globalPerformanceMonitoringManager = new PerformanceMonitoringManager()
  }
  return globalPerformanceMonitoringManager
}

export function getPerformanceMonitoringManager(): PerformanceMonitoringManager {
  if (!globalPerformanceMonitoringManager) {
    return initializePerformanceMonitoringManager()
  }
  return globalPerformanceMonitoringManager
}
