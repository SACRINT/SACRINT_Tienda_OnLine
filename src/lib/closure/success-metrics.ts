/**
 * Success Metrics Manager
 * Semana 52, Tarea 52.9: Project Success Metrics & Evaluation
 */

import { logger } from "@/lib/monitoring"

export interface SuccessMetric {
  id: string
  metricName: string
  category: "timeline" | "budget" | "quality" | "scope" | "customer"
  target: number
  actual: number
  unit: string
  weight: number
  status: "achieved" | "partially-achieved" | "not-achieved"
  evaluatedDate: Date
}

export interface ProjectScorecard {
  id: string
  projectName: string
  projectId: string
  evaluationDate: Date
  metrics: SuccessMetric[]
  overallScore: number
  successRating: "highly-successful" | "successful" | "partially-successful" | "unsuccessful"
  strengths: string[]
  weaknesses: string[]
  evaluatedBy: string
}

export interface BenefitsRealization {
  id: string
  benefit: string
  expectedValue: number
  realizedValue: number
  realization Percentage: number
  timeline: string
  owner: string
  status: "planned" | "in-progress" | "realized"
}

export class SuccessMetricsManager {
  private metrics: Map<string, SuccessMetric> = new Map()
  private scorecards: Map<string, ProjectScorecard> = new Map()
  private benefitsRealization: Map<string, BenefitsRealization> = new Map()

  constructor() {
    logger.debug({ type: "success_metrics_init" }, "Manager inicializado")
  }

  defineSuccessMetric(
    metricName: string,
    category: "timeline" | "budget" | "quality" | "scope" | "customer",
    target: number,
    unit: string,
    weight: number = 1
  ): SuccessMetric {
    const id = "metric_" + Date.now()
    const metric: SuccessMetric = {
      id,
      metricName,
      category,
      target,
      actual: 0,
      unit,
      weight,
      status: "not-achieved",
      evaluatedDate: new Date(),
    }

    this.metrics.set(id, metric)
    logger.info(
      { type: "success_metric_defined", metricId: id },
      `Métrica de éxito definida: ${metricName}`
    )
    return metric
  }

  recordActualValue(metricId: string, actual: number): SuccessMetric | null {
    const metric = this.metrics.get(metricId)
    if (!metric) return null

    metric.actual = actual

    if (actual >= metric.target) {
      metric.status = "achieved"
    } else if (actual >= metric.target * 0.8) {
      metric.status = "partially-achieved"
    } else {
      metric.status = "not-achieved"
    }

    metric.evaluatedDate = new Date()
    this.metrics.set(metricId, metric)
    logger.info(
      { type: "metric_actual_recorded", metricId },
      `Valor actual registrado: ${actual}`
    )
    return metric
  }

  createProjectScorecard(
    projectName: string,
    projectId: string,
    metrics: SuccessMetric[],
    evaluatedBy: string,
    strengths: string[],
    weaknesses: string[]
  ): ProjectScorecard {
    const id = "scorecard_" + Date.now()

    const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0)
    const weightedScore = metrics.reduce((sum, m) => {
      const statusValue =
        m.status === "achieved"
          ? 100
          : m.status === "partially-achieved"
            ? 70
            : 0
      return sum + (statusValue * m.weight) / totalWeight
    }, 0)

    let successRating: "highly-successful" | "successful" | "partially-successful" | "unsuccessful"
    if (weightedScore >= 90) {
      successRating = "highly-successful"
    } else if (weightedScore >= 75) {
      successRating = "successful"
    } else if (weightedScore >= 50) {
      successRating = "partially-successful"
    } else {
      successRating = "unsuccessful"
    }

    const scorecard: ProjectScorecard = {
      id,
      projectName,
      projectId,
      evaluationDate: new Date(),
      metrics,
      overallScore: weightedScore,
      successRating,
      strengths,
      weaknesses,
      evaluatedBy,
    }

    this.scorecards.set(id, scorecard)
    logger.info(
      { type: "scorecard_created", scorecardId: id },
      `Scorecard creado: ${projectName} (Score: ${weightedScore.toFixed(2)})`
    )
    return scorecard
  }

  trackBenefitsRealization(
    benefit: string,
    expectedValue: number,
    timeline: string,
    owner: string
  ): BenefitsRealization {
    const id = "benefit_" + Date.now()
    const benefitRealization: BenefitsRealization = {
      id,
      benefit,
      expectedValue,
      realizedValue: 0,
      realizationPercentage: 0,
      timeline,
      owner,
      status: "planned",
    }

    this.benefitsRealization.set(id, benefitRealization)
    logger.info(
      { type: "benefits_tracking_started", benefitId: id },
      `Tracking de beneficios iniciado: ${benefit}`
    )
    return benefitRealization
  }

  recordRealizedBenefit(
    benefitId: string,
    realizedValue: number
  ): BenefitsRealization | null {
    const benefit = this.benefitsRealization.get(benefitId)
    if (!benefit) return null

    benefit.realizedValue = realizedValue
    benefit.realizationPercentage =
      (realizedValue / benefit.expectedValue) * 100 || 0

    if (benefit.realizationPercentage >= 100) {
      benefit.status = "realized"
    } else if (benefit.realizationPercentage > 0) {
      benefit.status = "in-progress"
    }

    this.benefitsRealization.set(benefitId, benefit)
    return benefit
  }

  getStatistics(): Record<string, unknown> {
    const metrics = Array.from(this.metrics.values())
    const scorecards = Array.from(this.scorecards.values())
    const benefits = Array.from(this.benefitsRealization.values())

    return {
      totalMetrics: metrics.length,
      metricsByStatus: {
        achieved: metrics.filter((m) => m.status === "achieved").length,
        partiallyAchieved: metrics.filter((m) => m.status === "partially-achieved")
          .length,
        notAchieved: metrics.filter((m) => m.status === "not-achieved").length,
      },
      totalScorecards: scorecards.length,
      scorecardsByRating: {
        highlySuccessful: scorecards.filter(
          (s) => s.successRating === "highly-successful"
        ).length,
        successful: scorecards.filter((s) => s.successRating === "successful")
          .length,
        partiallySuccessful: scorecards.filter(
          (s) => s.successRating === "partially-successful"
        ).length,
        unsuccessful: scorecards.filter((s) => s.successRating === "unsuccessful")
          .length,
      },
      averageScorecardScore:
        scorecards.length > 0
          ? scorecards.reduce((sum, s) => sum + s.overallScore, 0) /
            scorecards.length
          : 0,
      totalBenefitsTracked: benefits.length,
      benefitsByStatus: {
        planned: benefits.filter((b) => b.status === "planned").length,
        inProgress: benefits.filter((b) => b.status === "in-progress").length,
        realized: benefits.filter((b) => b.status === "realized").length,
      },
      averageBenefitsRealization:
        benefits.length > 0
          ? benefits.reduce((sum, b) => sum + b.realizationPercentage, 0) /
            benefits.length
          : 0,
    }
  }

  generateSuccessReport(): string {
    const stats = this.getStatistics()
    return `Success Metrics Report\nTotal Metrics: ${stats.totalMetrics}\nAchieved: ${stats.metricsByStatus.achieved}\nAverage Scorecard: ${stats.averageScorecardScore.toFixed(2)}\nBenefits Realization: ${stats.averageBenefitsRealization.toFixed(2)}%`
  }
}

let globalSuccessMetricsManager: SuccessMetricsManager | null = null

export function getSuccessMetricsManager(): SuccessMetricsManager {
  if (!globalSuccessMetricsManager) {
    globalSuccessMetricsManager = new SuccessMetricsManager()
  }
  return globalSuccessMetricsManager
}
