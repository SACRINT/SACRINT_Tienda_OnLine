/**
 * Perpetual Excellence Framework Manager
 * Semana 56, Tarea 56.2: Perpetual Excellence Framework & Systems
 */

import { logger } from "@/lib/monitoring"

export interface ExcellenceFramework {
  id: string
  frameworkName: string
  version: string
  releaseDate: Date
  pillars: string[]
  metrics: ExcellenceMetric[]
  status: "active" | "archived"
}

export interface ExcellenceMetric {
  id: string
  metricName: string
  category: "quality" | "performance" | "reliability" | "innovation"
  target: number
  current: number
  unit: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly"
}

export class PerpetualExcellenceManager {
  private frameworks: Map<string, ExcellenceFramework> = new Map()
  private metricHistories: Map<string, ExcellenceMetric[]> = new Map()

  constructor() {
    logger.debug(
      { type: "perpetual_excellence_init" },
      "Manager inicializado"
    )
  }

  createExcellenceFramework(
    frameworkName: string,
    version: string,
    pillars: string[],
    metrics: Array<{
      metricName: string
      category: "quality" | "performance" | "reliability" | "innovation"
      target: number
      unit: string
      frequency: "daily" | "weekly" | "monthly" | "quarterly"
    }>
  ): ExcellenceFramework {
    const id = "framework_" + Date.now()
    const frameworkMetrics: ExcellenceMetric[] = metrics.map((m) => ({
      id: "metric_" + Date.now(),
      metricName: m.metricName,
      category: m.category,
      target: m.target,
      current: 0,
      unit: m.unit,
      frequency: m.frequency,
    }))

    const framework: ExcellenceFramework = {
      id,
      frameworkName,
      version,
      releaseDate: new Date(),
      pillars,
      metrics: frameworkMetrics,
      status: "active",
    }

    this.frameworks.set(id, framework)
    logger.info(
      { type: "excellence_framework_created", frameworkId: id },
      `Marco de excelencia creado: ${frameworkName} v${version}`
    )
    return framework
  }

  recordMetricValue(
    frameworkId: string,
    metricId: string,
    value: number
  ): ExcellenceMetric | null {
    const framework = this.frameworks.get(frameworkId)
    if (!framework) return null

    const metric = framework.metrics.find((m) => m.id === metricId)
    if (!metric) return null

    metric.current = value

    if (!this.metricHistories.has(metricId)) {
      this.metricHistories.set(metricId, [])
    }
    this.metricHistories.get(metricId)!.push({ ...metric })

    logger.info(
      { type: "metric_value_recorded", metricId, value },
      `Valor de métrica registrado: ${metric.metricName} = ${value}`
    )
    return metric
  }

  getStatistics(): Record<string, unknown> {
    const frameworks = Array.from(this.frameworks.values())
    const allMetrics = frameworks.flatMap((f) => f.metrics)

    const achievingTarget = allMetrics.filter((m) => m.current >= m.target)

    return {
      totalFrameworks: frameworks.length,
      activeFrameworks: frameworks.filter((f) => f.status === "active").length,
      totalMetrics: allMetrics.length,
      metricsAchievingTarget: achievingTarget.length,
      metricsAchievingPercentage:
        allMetrics.length > 0
          ? (achievingTarget.length / allMetrics.length) * 100
          : 0,
      metricsByCategory: {
        quality: allMetrics.filter((m) => m.category === "quality").length,
        performance: allMetrics.filter((m) => m.category === "performance")
          .length,
        reliability: allMetrics.filter((m) => m.category === "reliability")
          .length,
        innovation: allMetrics.filter((m) => m.category === "innovation")
          .length,
      },
    }
  }

  generateExcellenceReport(): string {
    const stats = this.getStatistics()
    return `Perpetual Excellence Report\nFrameworks: ${stats.totalFrameworks}\nMetrics: ${stats.totalMetrics}\nAchieving Target: ${stats.metricsAchievingPercentage.toFixed(1)}%`
  }
}

let globalPerpetualExcellenceManager: PerpetualExcellenceManager | null = null

export function getPerpetualExcellenceManager(): PerpetualExcellenceManager {
  if (!globalPerpetualExcellenceManager) {
    globalPerpetualExcellenceManager = new PerpetualExcellenceManager()
  }
  return globalPerpetualExcellenceManager
}
