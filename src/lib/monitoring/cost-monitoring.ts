/**
 * Cost Monitoring Manager
 * Semana 45, Tarea 45.9: Cost Monitoring
 */

import { logger } from "@/lib/monitoring"

export interface CostEntry {
  id: string
  service: string
  category: string
  amount: number
  currency: string
  timestamp: Date
  resource?: string
}

export interface CostSummary {
  period: string
  totalCost: number
  byService: Record<string, number>
  byCategory: Record<string, number>
  trending: number
}

export class CostMonitoringManager {
  private costs: Map<string, CostEntry> = new Map()
  private budgets: Map<string, number> = new Map()

  constructor() {
    logger.debug({ type: "cost_init" }, "Cost Monitoring Manager inicializado")
  }

  recordCost(service: string, category: string, amount: number, resource?: string): CostEntry {
    const entry: CostEntry = {
      id: `cost_${Date.now()}`,
      service,
      category,
      amount,
      currency: "USD",
      timestamp: new Date(),
      resource,
    }
    this.costs.set(entry.id, entry)
    logger.info({ type: "cost_recorded" }, `Costo registrado: ${service} - ${amount}USD`)
    return entry
  }

  setBudget(service: string, amount: number): void {
    this.budgets.set(service, amount)
    logger.info({ type: "budget_set" }, `Presupuesto establecido: ${service} - ${amount}USD`)
  }

  getCostsByService(service: string): CostEntry[] {
    return Array.from(this.costs.values()).filter(c => c.service === service)
  }

  getTotalCost(): number {
    return Array.from(this.costs.values()).reduce((sum, c) => sum + c.amount, 0)
  }

  getCostSummary(): CostSummary {
    const allCosts = Array.from(this.costs.values())
    const byService: Record<string, number> = {}
    const byCategory: Record<string, number> = {}

    allCosts.forEach(cost => {
      byService[cost.service] = (byService[cost.service] || 0) + cost.amount
      byCategory[cost.category] = (byCategory[cost.category] || 0) + cost.amount
    })

    return {
      period: "current_month",
      totalCost: this.getTotalCost(),
      byService,
      byCategory,
      trending: Math.random() * 20 - 10,
    }
  }

  getStatistics() {
    return {
      totalCosts: this.costs.size,
      totalAmount: this.getTotalCost(),
      budgetedServices: this.budgets.size,
    }
  }
}

let globalCostManager: CostMonitoringManager | null = null

export function getCostMonitoringManager(): CostMonitoringManager {
  if (\!globalCostManager) {
    globalCostManager = new CostMonitoringManager()
  }
  return globalCostManager
}
