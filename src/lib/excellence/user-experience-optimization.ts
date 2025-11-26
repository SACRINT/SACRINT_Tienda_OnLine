/**
 * User Experience Optimization Manager
 * Semana 55, Tarea 55.3: UX Optimization & User Satisfaction
 */

import { logger } from "@/lib/monitoring"

export interface UXMetric {
  id: string
  metricName: string
  value: number
  benchmark: number
  status: "excellent" | "good" | "fair" | "poor"
  measuredDate: Date
}

export class UserExperienceOptimizationManager {
  private metrics: Map<string, UXMetric> = new Map()

  constructor() {
    logger.debug({ type: "ux_optimization_init" }, "Manager inicializado")
  }

  recordUXMetric(metricName: string, value: number, benchmark: number): UXMetric {
    const id = "ux_" + Date.now()
    let status: "excellent" | "good" | "fair" | "poor"
    if (value >= benchmark) {
      status = "excellent"
    } else if (value >= benchmark * 0.9) {
      status = "good"
    } else if (value >= benchmark * 0.8) {
      status = "fair"
    } else {
      status = "poor"
    }

    const metric: UXMetric = {
      id,
      metricName,
      value,
      benchmark,
      status,
      measuredDate: new Date(),
    }

    this.metrics.set(id, metric)
    logger.info({ type: "ux_metric_recorded", metricId: id }, `Métrica UX registrada`)
    return metric
  }

  getStatistics(): Record<string, unknown> {
    const metrics = Array.from(this.metrics.values())

    return {
      totalMetrics: metrics.length,
      byStatus: {
        excellent: metrics.filter((m) => m.status === "excellent").length,
        good: metrics.filter((m) => m.status === "good").length,
        fair: metrics.filter((m) => m.status === "fair").length,
        poor: metrics.filter((m) => m.status === "poor").length,
      },
    }
  }

  generateUXReport(): string {
    const stats = this.getStatistics()
    return `UX Optimization Report\nMetrics: ${stats.totalMetrics}`
  }
}

let globalUXOptimizationManager: UserExperienceOptimizationManager | null = null

export function getUserExperienceOptimizationManager(): UserExperienceOptimizationManager {
  if (!globalUXOptimizationManager) {
    globalUXOptimizationManager = new UserExperienceOptimizationManager()
  }
  return globalUXOptimizationManager
}
