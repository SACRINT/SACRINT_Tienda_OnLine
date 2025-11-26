/**
 * Best Practices Verification Manager
 * Semana 49, Tarea 49.11: Best Practices Verification
 */

import { logger } from "@/lib/monitoring"

export interface BestPractice {
  id: string
  area: string
  practice: string
  implemented: boolean
  evidence: string
  priority: "high" | "medium" | "low"
}

export interface BestPracticesReport {
  id: string
  timestamp: Date
  practices: BestPractice[]
  implementationRate: number
}

export class BestPracticesVerificationManager {
  private practices: Map<string, BestPractice> = new Map()
  private reports: Map<string, BestPracticesReport> = new Map()

  constructor() {
    logger.debug({ type: "best_practices_init" }, "Best Practices Verification Manager inicializado")
  }

  registerBestPractice(area: string, practice: string, priority: string = "medium"): BestPractice {
    const bp: BestPractice = {
      id: `bp_${Date.now()}`,
      area,
      practice,
      implemented: false,
      evidence: "",
      priority: priority as any,
    }
    this.practices.set(bp.id, bp)
    logger.info({ type: "practice_registered" }, practice)
    return bp
  }

  markImplemented(practiceId: string, evidence: string): BestPractice | null {
    const practice = this.practices.get(practiceId)
    if (!practice) return null
    practice.implemented = true
    practice.evidence = evidence
    logger.info({ type: "implemented" }, practice.practice)
    return practice
  }

  generateReport(): BestPracticesReport {
    const allPractices = Array.from(this.practices.values())
    const implemented = allPractices.filter(p => p.implemented).length
    const implementationRate = (implemented / allPractices.length) * 100

    const report: BestPracticesReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      practices: allPractices,
      implementationRate,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Implementation: ${implementationRate.toFixed(1)}%`)
    return report
  }

  getStatistics() {
    const allPractices = Array.from(this.practices.values())
    return {
      totalPractices: allPractices.length,
      implemented: allPractices.filter(p => p.implemented).length,
      pending: allPractices.filter(p => !p.implemented).length,
    }
  }
}

let globalBestPracticesManager: BestPracticesVerificationManager | null = null

export function getBestPracticesVerificationManager(): BestPracticesVerificationManager {
  if (!globalBestPracticesManager) {
    globalBestPracticesManager = new BestPracticesVerificationManager()
  }
  return globalBestPracticesManager
}
