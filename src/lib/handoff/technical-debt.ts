/**
 * Technical Debt Manager
 * Semana 48, Tarea 48.8: Technical Debt Management
 */

import { logger } from "@/lib/monitoring"

export interface DebtItem {
  id: string
  title: string
  description: string
  area: string
  impact: "low" | "medium" | "high"
  estimatedEffort: number
  priority: number
  createdAt: Date
  targetDate?: Date
}

export interface DebtMetrics {
  id: string
  timestamp: Date
  totalDebt: number
  activeItems: number
  resolvedItems: number
  debtScore: number
}

export class TechnicalDebtManager {
  private debtItems: Map<string, DebtItem> = new Map()
  private metrics: Map<string, DebtMetrics> = new Map()

  constructor() {
    logger.debug({ type: "tech_debt_init" }, "Technical Debt Manager inicializado")
  }

  createDebtItem(title: string, description: string, area: string, impact: string, estimatedEffort: number): DebtItem {
    const item: DebtItem = {
      id: `debt_${Date.now()}`,
      title,
      description,
      area,
      impact: impact as any,
      estimatedEffort,
      priority: 0,
      createdAt: new Date(),
    }
    this.debtItems.set(item.id, item)
    logger.warn({ type: "debt_created" }, `Debt: ${title}`)
    return item
  }

  generateDebtMetrics(): DebtMetrics {
    const items = Array.from(this.debtItems.values())
    const totalEffort = items.reduce((sum, i) => sum + i.estimatedEffort, 0)
    const highImpactCount = items.filter(i => i.impact === "high").length

    const metrics: DebtMetrics = {
      id: `metrics_${Date.now()}`,
      timestamp: new Date(),
      totalDebt: totalEffort,
      activeItems: items.length,
      resolvedItems: 0,
      debtScore: (highImpactCount * 10) + (items.length * 5),
    }
    this.metrics.set(metrics.id, metrics)
    logger.info({ type: "metrics_generated" }, `Debt Score: ${metrics.debtScore}`)
    return metrics
  }

  getStatistics() {
    const items = Array.from(this.debtItems.values())
    return {
      totalDebtItems: items.length,
      highPriorityItems: items.filter(i => i.priority > 8).length,
      estimatedTotalEffort: items.reduce((sum, i) => sum + i.estimatedEffort, 0),
    }
  }
}

let globalTechDebtManager: TechnicalDebtManager | null = null

export function getTechnicalDebtManager(): TechnicalDebtManager {
  if (!globalTechDebtManager) {
    globalTechDebtManager = new TechnicalDebtManager()
  }
  return globalTechDebtManager
}
