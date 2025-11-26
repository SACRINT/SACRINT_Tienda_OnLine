/**
 * Code Quality Metrics Manager
 * Semana 48, Tarea 48.7: Code Quality Metrics
 */

import { logger } from "@/lib/monitoring"

export interface CodeQualityMetric {
  id: string
  metric: string
  value: number
  threshold: number
  status: "good" | "acceptable" | "needs_improvement"
  trend: "improving" | "stable" | "declining"
}

export interface QualityReport {
  id: string
  timestamp: Date
  metrics: CodeQualityMetric[]
  overallScore: number
  recommendations: string[]
}

export class CodeQualityMetricsManager {
  private metrics: Map<string, CodeQualityMetric> = new Map()
  private reports: Map<string, QualityReport> = new Map()

  constructor() {
    logger.debug({ type: "quality_metrics_init" }, "Code Quality Metrics Manager inicializado")
  }

  recordMetric(metric: string, value: number, threshold: number, trend: string = "stable"): CodeQualityMetric {
    const qualityMetric: CodeQualityMetric = {
      id: `metric_${Date.now()}`,
      metric,
      value,
      threshold,
      status: value >= threshold ? "good" : "needs_improvement",
      trend: trend as any,
    }
    this.metrics.set(qualityMetric.id, qualityMetric)
    logger.info({ type: "metric_recorded" }, `Quality: ${metric} = ${value}`)
    return qualityMetric
  }

  generateQualityReport(): QualityReport {
    const metrics = Array.from(this.metrics.values())
    const goodCount = metrics.filter(m => m.status === "good").length
    const overallScore = (goodCount / metrics.length) * 100

    const report: QualityReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      metrics,
      overallScore,
      recommendations: overallScore < 80 ? ["Mejorar cobertura de tests", "Reducir complejidad ciclomática"] : [],
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Quality Score: ${overallScore}%`)
    return report
  }

  getStatistics() {
    return {
      totalMetrics: this.metrics.size,
      reports: this.reports.size,
      averageScore: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.value, 0) / this.metrics.size,
    }
  }
}

let globalCodeQualityManager: CodeQualityMetricsManager | null = null

export function getCodeQualityMetricsManager(): CodeQualityMetricsManager {
  if (!globalCodeQualityManager) {
    globalCodeQualityManager = new CodeQualityMetricsManager()
  }
  return globalCodeQualityManager
}
