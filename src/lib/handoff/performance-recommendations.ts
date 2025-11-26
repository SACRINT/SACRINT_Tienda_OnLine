/**
 * Performance Optimization Recommendations Manager
 * Semana 48, Tarea 48.6: Performance Optimization Recommendations
 */

import { logger } from "@/lib/monitoring"

export interface OptimizationRecommendation {
  id: string
  area: string
  title: string
  description: string
  impact: "low" | "medium" | "high" | "critical"
  effort: "small" | "medium" | "large"
  estimatedGain: number
  priority: number
}

export interface RecommendationReport {
  id: string
  timestamp: Date
  recommendations: OptimizationRecommendation[]
  totalPotentialGain: number
  quickWins: OptimizationRecommendation[]
}

export class PerformanceOptimizationRecommendationsManager {
  private recommendations: Map<string, OptimizationRecommendation> = new Map()
  private reports: Map<string, RecommendationReport> = new Map()

  constructor() {
    logger.debug({ type: "perf_opt_init" }, "Performance Optimization Recommendations Manager inicializado")
  }

  createRecommendation(area: string, title: string, description: string, impact: string, effort: string, estimatedGain: number): OptimizationRecommendation {
    const rec: OptimizationRecommendation = {
      id: `rec_${Date.now()}`,
      area,
      title,
      description,
      impact: impact as any,
      effort: effort as any,
      estimatedGain,
      priority: 0,
    }
    this.recommendations.set(rec.id, rec)
    logger.info({ type: "recommendation_created" }, `Rec: ${title}`)
    return rec
  }

  generateRecommendationReport(): RecommendationReport {
    const recs = Array.from(this.recommendations.values()).sort((a, b) => b.estimatedGain - a.estimatedGain)
    const quickWins = recs.filter(r => r.effort === "small" && r.impact \!== "low")

    const report: RecommendationReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      recommendations: recs,
      totalPotentialGain: recs.reduce((sum, r) => sum + r.estimatedGain, 0),
      quickWins,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Ganancia potencial: ${report.totalPotentialGain}%`)
    return report
  }

  getStatistics() {
    return {
      totalRecommendations: this.recommendations.size,
      reports: this.reports.size,
      highPriorityRecs: Array.from(this.recommendations.values()).filter(r => r.impact === "high" || r.impact === "critical").length,
    }
  }
}

let globalPerfOptRecManager: PerformanceOptimizationRecommendationsManager | null = null

export function getPerformanceOptimizationRecommendationsManager(): PerformanceOptimizationRecommendationsManager {
  if (\!globalPerfOptRecManager) {
    globalPerfOptRecManager = new PerformanceOptimizationRecommendationsManager()
  }
  return globalPerfOptRecManager
}
