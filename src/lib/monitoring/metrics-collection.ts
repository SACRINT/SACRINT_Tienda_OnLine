/**
 * Metrics Collection Manager
 * Semana 45, Tarea 45.3: Metrics Collection
 */

import { logger } from "@/lib/monitoring"

export interface Metric {
  id: string
  name: string
  value: number
  timestamp: Date
  service: string
  unit: string
  tags?: Record<string, string>
}

export interface MetricTimeSeries {
  name: string
  dataPoints: Array<{ timestamp: Date; value: number }>
  aggregation?: "avg" | "sum" | "min" | "max"
}

export class MetricsCollectionManager {
  private metrics: Map<string, Metric> = new Map()
  private timeSeries: Map<string, MetricTimeSeries> = new Map()

  constructor() {
    logger.debug({ type: "metrics_init" }, "Metrics Collection Manager inicializado")
  }

  collectMetric(name: string, value: number, service: string, unit: string, tags?: Record<string, string>): Metric {
    const metric: Metric = {
      id: `metric_${Date.now()}`,
      name,
      value,
      timestamp: new Date(),
      service,
      unit,
      tags,
    }
    this.metrics.set(metric.id, metric)
    logger.debug({ type: "metric_collected" }, `Métrica ${name} = ${value}${unit}`)
    return metric
  }

  getMetricTimeSeries(name: string): MetricTimeSeries | null {
    return this.timeSeries.get(name) || null
  }

  getMetricsByService(service: string): Metric[] {
    return Array.from(this.metrics.values()).filter(m => m.service === service)
  }

  calculateAggregation(name: string, type: "avg" | "sum" | "min" | "max"): number {
    const metrics = Array.from(this.metrics.values()).filter(m => m.name === name)
    if (metrics.length === 0) return 0

    const values = metrics.map(m => m.value)
    switch (type) {
      case "avg":
        return values.reduce((a, b) => a + b, 0) / values.length
      case "sum":
        return values.reduce((a, b) => a + b, 0)
      case "min":
        return Math.min(...values)
      case "max":
        return Math.max(...values)
    }
  }

  getStatistics() {
    return {
      totalMetrics: this.metrics.size,
      uniqueMetricNames: new Set(Array.from(this.metrics.values()).map(m => m.name)).size,
      uniqueServices: new Set(Array.from(this.metrics.values()).map(m => m.service)).size,
    }
  }
}

let globalMetricsManager: MetricsCollectionManager | null = null

export function getMetricsCollectionManager(): MetricsCollectionManager {
  if (!globalMetricsManager) {
    globalMetricsManager = new MetricsCollectionManager()
  }
  return globalMetricsManager
}
