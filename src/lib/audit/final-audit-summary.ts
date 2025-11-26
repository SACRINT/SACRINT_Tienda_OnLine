/**
 * Final Audit Summary Manager
 * Semana 49, Tarea 49.12: Final Audit Summary
 */

import { logger } from "@/lib/monitoring"

export interface AuditCategory {
  category: string
  score: number
  maxScore: number
  status: "pass" | "warn" | "fail"
}

export interface FinalAuditSummary {
  id: string
  timestamp: Date
  categories: AuditCategory[]
  overallScore: number
  readyForProduction: boolean
  recommendations: string[]
}

export class FinalAuditSummaryManager {
  private summaries: Map<string, FinalAuditSummary> = new Map()

  constructor() {
    logger.debug({ type: "final_audit_init" }, "Final Audit Summary Manager inicializado")
  }

  createAuditSummary(categories: AuditCategory[]): FinalAuditSummary {
    const totalScore = categories.reduce((sum, c) => sum + c.score, 0)
    const maxScore = categories.reduce((sum, c) => sum + c.maxScore, 0)
    const overallScore = (totalScore / maxScore) * 100
    const readyForProduction = overallScore >= 85 && !categories.some(c => c.status === "fail")

    const summary: FinalAuditSummary = {
      id: `summary_${Date.now()}`,
      timestamp: new Date(),
      categories,
      overallScore,
      readyForProduction,
      recommendations: overallScore < 90 ? ["Resolver problemas antes del deployment"] : [],
    }
    this.summaries.set(summary.id, summary)

    const status = readyForProduction ? "APROBADO" : "BLOQUEADO"
    logger.info({ type: "audit_completed" }, `Score: ${overallScore.toFixed(1)}% - ${status}`)
    return summary
  }

  getLatestSummary(): FinalAuditSummary | null {
    const allSummaries = Array.from(this.summaries.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return allSummaries[0] || null
  }

  getStatistics() {
    const allSummaries = Array.from(this.summaries.values())
    const approved = allSummaries.filter(s => s.readyForProduction).length
    return {
      totalAudits: allSummaries.length,
      approvedForProduction: approved,
      averageScore: allSummaries.length > 0 ? allSummaries.reduce((sum, s) => sum + s.overallScore, 0) / allSummaries.length : 0,
    }
  }
}

let globalFinalAuditManager: FinalAuditSummaryManager | null = null

export function getFinalAuditSummaryManager(): FinalAuditSummaryManager {
  if (!globalFinalAuditManager) {
    globalFinalAuditManager = new FinalAuditSummaryManager()
  }
  return globalFinalAuditManager
}
