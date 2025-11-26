/**
 * Organizational Maturity Manager
 * Semana 56, Tarea 56.5: Organizational Maturity & Capabilities Evolution
 */

import { logger } from "@/lib/monitoring"

export interface MaturityLevel {
  id: string
  dimension: string
  currentLevel: 1 | 2 | 3 | 4 | 5
  targetLevel: 1 | 2 | 3 | 4 | 5
  assessmentDate: Date
  evidence: string[]
  improvementAreas: string[]
}

export interface CapabilityMetric {
  id: string
  capabilityName: string
  category: "technical" | "process" | "people" | "governance"
  maturityScore: number
  benchmark: number
  gap: number
  improvementPlan: string
}

export class OrganizationalMaturityManager {
  private maturityLevels: Map<string, MaturityLevel> = new Map()
  private capabilityMetrics: Map<string, CapabilityMetric> = new Map()

  constructor() {
    logger.debug(
      { type: "organizational_maturity_init" },
      "Manager inicializado"
    )
  }

  assessMaturityLevel(
    dimension: string,
    currentLevel: 1 | 2 | 3 | 4 | 5,
    targetLevel: 1 | 2 | 3 | 4 | 5,
    evidence: string[],
    improvementAreas: string[]
  ): MaturityLevel {
    const id = "maturity_" + Date.now()
    const assessment: MaturityLevel = {
      id,
      dimension,
      currentLevel,
      targetLevel,
      assessmentDate: new Date(),
      evidence,
      improvementAreas,
    }

    this.maturityLevels.set(id, assessment)
    logger.info(
      { type: "maturity_assessed", assessmentId: id },
      `Madurez organizacional evaluada: ${dimension} (Nivel ${currentLevel})`
    )
    return assessment
  }

  recordCapabilityMetric(
    capabilityName: string,
    category: "technical" | "process" | "people" | "governance",
    maturityScore: number,
    benchmark: number,
    improvementPlan: string
  ): CapabilityMetric {
    const id = "capability_" + Date.now()
    const metric: CapabilityMetric = {
      id,
      capabilityName,
      category,
      maturityScore,
      benchmark,
      gap: benchmark - maturityScore,
      improvementPlan,
    }

    this.capabilityMetrics.set(id, metric)
    logger.info(
      { type: "capability_metric_recorded", metricId: id },
      `Métrica de capacidad registrada: ${capabilityName}`
    )
    return metric
  }

  getStatistics(): Record<string, unknown> {
    const maturityLevels = Array.from(this.maturityLevels.values())
    const capabilities = Array.from(this.capabilityMetrics.values())

    const averageCurrentLevel =
      maturityLevels.length > 0
        ? maturityLevels.reduce((sum, m) => sum + m.currentLevel, 0) /
          maturityLevels.length
        : 0

    const capabilitiesByCategory = {
      technical: capabilities.filter((c) => c.category === "technical").length,
      process: capabilities.filter((c) => c.category === "process").length,
      people: capabilities.filter((c) => c.category === "people").length,
      governance: capabilities.filter((c) => c.category === "governance")
        .length,
    }

    return {
      totalMaturityAssessments: maturityLevels.length,
      averageCurrentMaturityLevel: averageCurrentLevel,
      averageTargetMaturityLevel:
        maturityLevels.length > 0
          ? maturityLevels.reduce((sum, m) => sum + m.targetLevel, 0) /
            maturityLevels.length
          : 0,
      totalCapabilityMetrics: capabilities.length,
      capabilitiesByCategory,
      averageMaturityScore:
        capabilities.length > 0
          ? capabilities.reduce((sum, c) => sum + c.maturityScore, 0) /
            capabilities.length
          : 0,
      averageGap:
        capabilities.length > 0
          ? capabilities.reduce((sum, c) => sum + c.gap, 0) / capabilities.length
          : 0,
    }
  }

  generateMaturityReport(): string {
    const stats = this.getStatistics()
    return `Organizational Maturity Report\nAssessments: ${stats.totalMaturityAssessments}\nCapabilities: ${stats.totalCapabilityMetrics}\nAvg Gap: ${stats.averageGap.toFixed(2)}`
  }
}

let globalOrganizationalMaturityManager: OrganizationalMaturityManager | null =
  null

export function getOrganizationalMaturityManager(): OrganizationalMaturityManager {
  if (!globalOrganizationalMaturityManager) {
    globalOrganizationalMaturityManager = new OrganizationalMaturityManager()
  }
  return globalOrganizationalMaturityManager
}
