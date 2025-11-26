/**
 * Compliance Checklist Manager
 * Semana 49, Tarea 49.9: Compliance Checklist
 */

import { logger } from "@/lib/monitoring"

export interface ComplianceItem {
  id: string
  requirement: string
  category: string
  status: "not_started" | "in_progress" | "completed"
  dueDate: Date
  completedAt?: Date
}

export interface ComplianceReport {
  id: string
  timestamp: Date
  items: ComplianceItem[]
  completionPercentage: number
  allCompliant: boolean
}

export class ComplianceChecklistManager {
  private items: Map<string, ComplianceItem> = new Map()
  private reports: Map<string, ComplianceReport> = new Map()

  constructor() {
    logger.debug({ type: "compliance_init" }, "Compliance Checklist Manager inicializado")
  }

  addComplianceItem(requirement: string, category: string, daysUntilDue: number = 30): ComplianceItem {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysUntilDue)

    const item: ComplianceItem = {
      id: `item_${Date.now()}`,
      requirement,
      category,
      status: "not_started",
      dueDate,
    }
    this.items.set(item.id, item)
    logger.info({ type: "item_added" }, requirement)
    return item
  }

  completeItem(itemId: string): ComplianceItem | null {
    const item = this.items.get(itemId)
    if (!item) return null
    item.status = "completed"
    item.completedAt = new Date()
    logger.info({ type: "item_completed" }, item.requirement)
    return item
  }

  generateComplianceReport(): ComplianceReport {
    const allItems = Array.from(this.items.values())
    const completed = allItems.filter(i => i.status === "completed").length
    const completionPercentage = (completed / allItems.length) * 100

    const report: ComplianceReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      items: allItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      completionPercentage,
      allCompliant: completionPercentage === 100,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Compliance: ${completionPercentage.toFixed(1)}%`)
    return report
  }

  getStatistics() {
    const allItems = Array.from(this.items.values())
    return {
      totalRequirements: allItems.length,
      completed: allItems.filter(i => i.status === "completed").length,
      overdue: allItems.filter(i => i.dueDate < new Date() && i.status !== "completed").length,
    }
  }
}

let globalComplianceManager: ComplianceChecklistManager | null = null

export function getComplianceChecklistManager(): ComplianceChecklistManager {
  if (!globalComplianceManager) {
    globalComplianceManager = new ComplianceChecklistManager()
  }
  return globalComplianceManager
}
