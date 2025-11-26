/**
 * Custom Metrics y Métricas Personalizadas
 * Semana 31, Tarea 31.8: Sistema de métricas personalizadas para negocio
 */

import { logger } from './logger'

/**
 * Tipo de métrica
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timing'

/**
 * Valor de métrica
 */
export interface MetricValue {
  timestamp: number
  value: number
  tags?: Record<string, string>
}

/**
 * Métrica personalizada
 */
export interface CustomMetric {
  name: string
  type: MetricType
  unit?: string
  description?: string
  values: MetricValue[]
}

/**
 * Estadísticas de métrica
 */
export interface MetricStats {
  name: string
  type: MetricType
  count: number
  sum: number
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
  lastValue: number
  lastUpdated: number
}

/**
 * Monitor de métricas personalizadas
 */
export class CustomMetricsMonitor {
  private metrics: Map<string, CustomMetric> = new Map()
  private maxValuesPerMetric = 10000

  constructor() {
    logger.debug(
      { type: 'custom_metrics_init' },
      'Custom Metrics Monitor inicializado',
    )
  }

  /**
   * Registrar una nueva métrica
   */
  registerMetric(
    name: string,
    type: MetricType,
    description?: string,
    unit?: string,
  ): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        type,
        unit,
        description,
        values: [],
      })

      logger.debug(
        { type: 'custom_metric_registered', name, metricType: type },
        `Métrica registrada: ${name}`,
      )
    }
  }

  /**
   * Registrar un valor de contador (incrementa)
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.ensureMetric(name, 'counter')
    const metric = this.metrics.get(name)!

    const lastValue = metric.values.length > 0
      ? metric.values[metric.values.length - 1].value
      : 0

    metric.values.push({
      timestamp: Date.now(),
      value: lastValue + value,
      tags,
    })

    this.pruneValues(name)

    logger.debug(
      {
        type: 'counter_incremented',
        metric: name,
        value,
        tags,
      },
      `Contador ${name} incrementado en ${value}`,
    )
  }

  /**
   * Registrar un valor de gauge (valor actual)
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.ensureMetric(name, 'gauge')
    const metric = this.metrics.get(name)!

    metric.values.push({
      timestamp: Date.now(),
      value,
      tags,
    })

    this.pruneValues(name)

    logger.debug(
      {
        type: 'gauge_set',
        metric: name,
        value,
        tags,
      },
      `Gauge ${name} establecido a ${value}`,
    )
  }

  /**
   * Registrar un valor de histograma
   */
  recordHistogram(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    this.ensureMetric(name, 'histogram')
    const metric = this.metrics.get(name)!

    metric.values.push({
      timestamp: Date.now(),
      value,
      tags,
    })

    this.pruneValues(name)

    logger.debug(
      {
        type: 'histogram_recorded',
        metric: name,
        value,
        tags,
      },
      `Histograma ${name} registrado: ${value}`,
    )
  }

  /**
   * Registrar tiempo de operación
   */
  recordTiming(
    name: string,
    durationMs: number,
    tags?: Record<string, string>,
  ): void {
    this.ensureMetric(name, 'timing')
    const metric = this.metrics.get(name)!

    metric.values.push({
      timestamp: Date.now(),
      value: durationMs,
      tags,
    })

    this.pruneValues(name)

    logger.debug(
      {
        type: 'timing_recorded',
        metric: name,
        duration: durationMs,
        tags,
      },
      `Timing ${name}: ${durationMs}ms`,
    )
  }

  /**
   * Medir duración de una función
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>,
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.recordTiming(name, duration, tags)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.recordTiming(name, duration, { ...tags, error: 'true' })
      throw error
    }
  }

  /**
   * Medir duración de una función síncrona
   */
  measure<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>,
  ): T {
    const start = Date.now()
    try {
      const result = fn()
      const duration = Date.now() - start
      this.recordTiming(name, duration, tags)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.recordTiming(name, duration, { ...tags, error: 'true' })
      throw error
    }
  }

  /**
   * Calcular percentil
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Obtener estadísticas de métrica
   */
  getStats(name: string): MetricStats | null {
    const metric = this.metrics.get(name)
    if (!metric || metric.values.length === 0) {
      return null
    }

    const values = metric.values.map((v) => v.value)

    return {
      name,
      type: metric.type,
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: this.calculatePercentile(values, 50),
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99),
      lastValue: values[values.length - 1],
      lastUpdated: metric.values[metric.values.length - 1].timestamp,
    }
  }

  /**
   * Obtener todas las estadísticas
   */
  getAllStats(): MetricStats[] {
    const stats: MetricStats[] = []

    for (const name of this.metrics.keys()) {
      const stat = this.getStats(name)
      if (stat) {
        stats.push(stat)
      }
    }

    return stats
  }

  /**
   * Exportar métricas en formato Prometheus
   */
  exportPrometheus(): string {
    let output = ''

    for (const metric of this.metrics.values()) {
      if (metric.values.length === 0) continue

      const lastValue = metric.values[metric.values.length - 1]

      // Formato: metric_name{tags} value timestamp
      const tags = lastValue.tags
        ? Object.entries(lastValue.tags)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',')
        : ''

      const metricLine =
        `${metric.name}${tags ? `{${tags}}` : ''} ${lastValue.value} ${lastValue.timestamp}\n`

      output += metricLine
    }

    return output
  }

  /**
   * Generar reporte
   */
  generateReport(): string {
    const stats = this.getAllStats()

    let report = 'Custom Metrics Report\n'
    report += '====================\n\n'

    if (stats.length === 0) {
      report += 'No metrics registered.\n'
      return report
    }

    report += `Total Metrics: ${stats.length}\n\n`

    for (const stat of stats.sort((a, b) => b.lastUpdated - a.lastUpdated)) {
      report += `${stat.name} (${stat.type})\n`
      report += `  Count: ${stat.count} | Last: ${stat.lastValue}`

      if (stat.type === 'histogram' || stat.type === 'timing') {
        report += `\n  Min: ${stat.min.toFixed(2)} | Avg: ${stat.avg.toFixed(2)} | Max: ${stat.max.toFixed(2)}`
        report += `\n  P50: ${stat.p50.toFixed(2)} | P95: ${stat.p95.toFixed(2)} | P99: ${stat.p99.toFixed(2)}`
      }

      report += '\n\n'
    }

    return report
  }

  /**
   * Limpiar valores antiguos
   */
  private pruneValues(name: string): void {
    const metric = this.metrics.get(name)
    if (!metric) return

    if (metric.values.length > this.maxValuesPerMetric) {
      metric.values = metric.values.slice(-this.maxValuesPerMetric)
    }
  }

  /**
   * Asegurar que métrica existe
   */
  private ensureMetric(name: string, type: MetricType): void {
    if (!this.metrics.has(name)) {
      this.registerMetric(name, type)
    }
  }

  /**
   * Limpiar métrica
   */
  clearMetric(name: string): void {
    const metric = this.metrics.get(name)
    if (metric) {
      metric.values = []
      logger.debug(
        { type: 'metric_cleared', name },
        `Métrica limpiada: ${name}`,
      )
    }
  }

  /**
   * Limpiar todas las métricas
   */
  clearAll(): void {
    for (const metric of this.metrics.values()) {
      metric.values = []
    }
    logger.debug(
      { type: 'all_metrics_cleared' },
      'Todas las métricas limpiadas',
    )
  }
}

/**
 * Instancia global
 */
let globalMonitor: CustomMetricsMonitor | null = null

/**
 * Inicializar globalmente
 */
export function initializeCustomMetricsMonitor(): CustomMetricsMonitor {
  if (!globalMonitor) {
    globalMonitor = new CustomMetricsMonitor()
  }
  return globalMonitor
}

/**
 * Obtener monitor global
 */
export function getCustomMetricsMonitor(): CustomMetricsMonitor {
  if (!globalMonitor) {
    return initializeCustomMetricsMonitor()
  }
  return globalMonitor
}

/**
 * Métricas predefinidas para e-commerce
 */
export const ECommerceMetrics = {
  /**
   * Registrar venta
   */
  recordSale: (amount: number, currency: string = 'USD') => {
    const monitor = getCustomMetricsMonitor()
    monitor.incrementCounter('sales_total', 1, { currency })
    monitor.setGauge('sales_amount', amount, { currency })
  },

  /**
   * Registrar producto visto
   */
  recordProductView: (productId: string, category: string) => {
    const monitor = getCustomMetricsMonitor()
    monitor.incrementCounter('product_views', 1, { category })
  },

  /**
   * Registrar carrito abandonado
   */
  recordAbandonedCart: (value: number) => {
    const monitor = getCustomMetricsMonitor()
    monitor.incrementCounter('abandoned_carts', 1)
    monitor.recordHistogram('abandoned_cart_value', value)
  },

  /**
   * Registrar búsqueda
   */
  recordSearch: (query: string, resultCount: number) => {
    const monitor = getCustomMetricsMonitor()
    monitor.incrementCounter('searches', 1)
    monitor.recordHistogram('search_results_count', resultCount)
  },

  /**
   * Registrar login
   */
  recordLogin: (method: string = 'password') => {
    const monitor = getCustomMetricsMonitor()
    monitor.incrementCounter('logins', 1, { method })
  },

  /**
   * Registrar checkout completado
   */
  recordCheckout: (orderId: string, total: number) => {
    const monitor = getCustomMetricsMonitor()
    monitor.incrementCounter('checkouts_completed', 1)
    monitor.recordHistogram('order_total', total)
  },

  /**
   * Registrar devolución
   */
  recordReturn: (orderId: string, amount: number) => {
    const monitor = getCustomMetricsMonitor()
    monitor.incrementCounter('returns', 1)
    monitor.recordHistogram('return_amount', amount)
  },
}
