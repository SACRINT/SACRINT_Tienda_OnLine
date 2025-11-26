/**
 * Strategic Metrics Manager
 * Semana 51, Tarea 51.10: Strategic KPI & Success Metrics
 */

import { logger } from "@/lib/monitoring"

export interface KPI {
  id: string
  name: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  owner: string
  status: "on-track" | "at-risk" | "off-track"
  trend: "improving" | "stable" | "declining"
  lastUpdated: Date
}

export interface StrategicMetric {
  id: string
  metricName: string
  baselineValue: number
  currentValue: number
  goalValue: number
  progressPercent: number
  category: "financial" | "customer" | "process" | "people"
  timeframe: string
  dataPoints: MetricDataPoint[]
}

export interface MetricDataPoint {
  timestamp: Date
  value: number
  status: "on-track" | "warning" | "critical"
}

export class StrategicMetricsManager {
  private kpis: Map<string, KPI> = new Map()
  private metrics: Map<string, StrategicMetric> = new Map()
  private dashboard: Map<string, unknown> = new Map()

  constructor() {
    logger.debug({ type: "strategic_metrics_init" }, "Manager inicializado")
  }

  defineKPI(
    name: string,
    description: string,
    targetValue: number,
    unit: string,
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    owner: string
  ): KPI {
    const id = "kpi_" + Date.now()
    const kpi: KPI = {
      id,
      name,
      description,
      targetValue,
      currentValue: 0,
      unit,
      frequency,
      owner,
      status: "on-track",
      trend: "stable",
      lastUpdated: new Date(),
    }
    this.kpis.set(id, kpi)
    logger.info({ type: "kpi_defined", kpiId: id }, `KPI definido: ${name}`)
    return kpi
  }

  updateKPIValue(kpiId: string, currentValue: number): KPI | null {
    const kpi = this.kpis.get(kpiId)
    if (!kpi) return null

    const previousValue = kpi.currentValue
    kpi.currentValue = currentValue

    if (currentValue >= kpi.targetValue) {
      kpi.status = "on-track"
    } else if (currentValue >= kpi.targetValue * 0.8) {
      kpi.status = "at-risk"
    } else {
      kpi.status = "off-track"
    }

    if (currentValue > previousValue) {
      kpi.trend = "improving"
    } else if (currentValue < previousValue) {
      kpi.trend = "declining"
    } else {
      kpi.trend = "stable"
    }

    kpi.lastUpdated = new Date()
    this.kpis.set(kpiId, kpi)
    logger.info(
      { type: "kpi_updated", kpiId },
      `KPI actualizado: ${currentValue} ${kpi.unit}`
    )
    return kpi
  }

  createStrategicMetric(
    metricName: string,
    baselineValue: number,
    goalValue: number,
    category: "financial" | "customer" | "process" | "people",
    timeframe: string
  ): StrategicMetric {
    const id = "metric_" + Date.now()
    const metric: StrategicMetric = {
      id,
      metricName,
      baselineValue,
      currentValue: baselineValue,
      goalValue,
      progressPercent: 0,
      category,
      timeframe,
      dataPoints: [
        {
          timestamp: new Date(),
          value: baselineValue,
          status: "on-track",
        },
      ],
    }
    this.metrics.set(id, metric)
    logger.info(
      { type: "strategic_metric_created", metricId: id },
      `Métrica estratégica creada: ${metricName}`
    )
    return metric
  }

  recordMetricDataPoint(metricId: string, value: number): StrategicMetric | null {
    const metric = this.metrics.get(metricId)
    if (!metric) return null

    const progress = ((value - metric.baselineValue) / (metric.goalValue - metric.baselineValue)) * 100
    metric.progressPercent = Math.max(0, Math.min(100, progress))
    metric.currentValue = value

    const status =
      metric.progressPercent >= 80
        ? ("on-track" as const)
        : metric.progressPercent >= 50
          ? ("warning" as const)
          : ("critical" as const)

    metric.dataPoints.push({
      timestamp: new Date(),
      value,
      status,
    })

    this.metrics.set(metricId, metric)
    return metric
  }

  getKPIsByOwner(owner: string): KPI[] {
    return Array.from(this.kpis.values()).filter((k) => k.owner === owner)
  }

  getMetricsByCategory(
    category: "financial" | "customer" | "process" | "people"
  ): StrategicMetric[] {
    return Array.from(this.metrics.values()).filter(
      (m) => m.category === category
    )
  }

  getStatistics(): Record<string, unknown> {
    const kpis = Array.from(this.kpis.values())
    const metrics = Array.from(this.metrics.values())

    return {
      totalKPIs: kpis.length,
      kpisByStatus: {
        onTrack: kpis.filter((k) => k.status === "on-track").length,
        atRisk: kpis.filter((k) => k.status === "at-risk").length,
        offTrack: kpis.filter((k) => k.status === "off-track").length,
      },
      totalMetrics: metrics.length,
      metricsByCategory: {
        financial: metrics.filter((m) => m.category === "financial").length,
        customer: metrics.filter((m) => m.category === "customer").length,
        process: metrics.filter((m) => m.category === "process").length,
        people: metrics.filter((m) => m.category === "people").length,
      },
      averageMetricProgress:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.progressPercent, 0) /
            metrics.length
          : 0,
    }
  }

  generateMetricsReport(): string {
    const stats = this.getStatistics()
    return `Strategic Metrics Report\nTotal KPIs: ${stats.totalKPIs}\nTotal Metrics: ${stats.totalMetrics}\nAverage Progress: ${stats.averageMetricProgress.toFixed(2)}%`
  }
}

let globalStrategicMetricsManager: StrategicMetricsManager | null = null

export function getStrategicMetricsManager(): StrategicMetricsManager {
  if (!globalStrategicMetricsManager) {
    globalStrategicMetricsManager = new StrategicMetricsManager()
  }
  return globalStrategicMetricsManager
}
