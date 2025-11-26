/**
 * Risk Assessment Manager
 * Semana 51, Tarea 51.7: Risk Identification & Mitigation Planning
 */

import { logger } from "@/lib/monitoring"

export interface Risk {
  id: string
  title: string
  description: string
  category:
    | "technical"
    | "operational"
    | "financial"
    | "market"
    | "organizational"
  probability: "very-low" | "low" | "medium" | "high" | "very-high"
  impact: "negligible" | "minor" | "moderate" | "major" | "critical"
  riskScore: number
  mitigation: string
  contingency: string
  owner: string
  status: "identified" | "assessed" | "monitoring" | "mitigated"
  createdAt: Date
}

export class RiskAssessmentManager {
  private risks: Map<string, Risk> = new Map()
  private riskRegister: Risk[] = []

  constructor() {
    logger.debug({ type: "risk_assessment_init" }, "Manager inicializado")
  }

  identifyRisk(
    title: string,
    description: string,
    category:
      | "technical"
      | "operational"
      | "financial"
      | "market"
      | "organizational",
    probability: "very-low" | "low" | "medium" | "high" | "very-high",
    impact: "negligible" | "minor" | "moderate" | "major" | "critical",
    mitigation: string,
    contingency: string,
    owner: string
  ): Risk {
    const id = "risk_" + Date.now()
    const riskScore = this.calculateRiskScore(probability, impact)

    const risk: Risk = {
      id,
      title,
      description,
      category,
      probability,
      impact,
      riskScore,
      mitigation,
      contingency,
      owner,
      status: "identified",
      createdAt: new Date(),
    }

    this.risks.set(id, risk)
    this.riskRegister.push(risk)

    logger.info(
      { type: "risk_identified", riskId: id },
      `Riesgo identificado: ${title} (Score: ${riskScore})`
    )
    return risk
  }

  calculateRiskScore(
    probability: "very-low" | "low" | "medium" | "high" | "very-high",
    impact: "negligible" | "minor" | "moderate" | "major" | "critical"
  ): number {
    const probabilityMap: Record<string, number> = {
      "very-low": 1,
      low: 2,
      medium: 3,
      high: 4,
      "very-high": 5,
    }
    const impactMap: Record<string, number> = {
      negligible: 1,
      minor: 2,
      moderate: 3,
      major: 4,
      critical: 5,
    }

    return probabilityMap[probability] * impactMap[impact]
  }

  updateRiskStatus(
    riskId: string,
    status: "identified" | "assessed" | "monitoring" | "mitigated"
  ): Risk | null {
    const risk = this.risks.get(riskId)
    if (!risk) return null
    risk.status = status
    return risk
  }

  getRisksByCategory(
    category:
      | "technical"
      | "operational"
      | "financial"
      | "market"
      | "organizational"
  ): Risk[] {
    return Array.from(this.risks.values()).filter((r) => r.category === category)
  }

  getHighRisks(): Risk[] {
    return Array.from(this.risks.values())
      .filter((r) => r.riskScore >= 16)
      .sort((a, b) => b.riskScore - a.riskScore)
  }

  generateRiskRegister(): string {
    const highRisks = this.getHighRisks()
    return `Risk Register Report\nTotal Risks: ${this.riskRegister.length}\nHigh Risks: ${highRisks.length}\nRegister Size: ${this.riskRegister.length} items`
  }

  getStatistics(): Record<string, unknown> {
    const risks = Array.from(this.risks.values())
    return {
      totalRisks: risks.length,
      byCategory: {
        technical: risks.filter((r) => r.category === "technical").length,
        operational: risks.filter((r) => r.category === "operational").length,
        financial: risks.filter((r) => r.category === "financial").length,
        market: risks.filter((r) => r.category === "market").length,
        organizational: risks.filter((r) => r.category === "organizational")
          .length,
      },
      byStatus: {
        identified: risks.filter((r) => r.status === "identified").length,
        assessed: risks.filter((r) => r.status === "assessed").length,
        monitoring: risks.filter((r) => r.status === "monitoring").length,
        mitigated: risks.filter((r) => r.status === "mitigated").length,
      },
      highRiskCount: risks.filter((r) => r.riskScore >= 16).length,
      averageRiskScore:
        risks.length > 0
          ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length
          : 0,
    }
  }
}

let globalRiskAssessmentManager: RiskAssessmentManager | null = null

export function getRiskAssessmentManager(): RiskAssessmentManager {
  if (!globalRiskAssessmentManager) {
    globalRiskAssessmentManager = new RiskAssessmentManager()
  }
  return globalRiskAssessmentManager
}
