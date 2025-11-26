/**
 * Budget Planning Manager
 * Semana 51, Tarea 51.4: Financial Planning & Budget Allocation
 */

import { logger } from "@/lib/monitoring"

export interface BudgetAllocation {
  id: string
  category: string
  allocatedAmount: number
  spentAmount: number
  currency: string
  fiscalYear: string
  owner: string
  status: "draft" | "approved" | "in-execution" | "completed"
  description: string
  createdAt: Date
}

export interface BudgetLine {
  id: string
  budgetAllocationId: string
  description: string
  estimatedCost: number
  actualCost: number
  variance: number
  status: "planned" | "in-progress" | "completed"
}

export class BudgetPlanningManager {
  private budgetAllocations: Map<string, BudgetAllocation> = new Map()
  private budgetLines: Map<string, BudgetLine[]> = new Map()
  private totalBudget: number = 0

  constructor() {
    logger.debug({ type: "budget_planning_init" }, "Manager inicializado")
  }

  createBudgetAllocation(
    category: string,
    allocatedAmount: number,
    currency: string,
    fiscalYear: string,
    owner: string,
    description: string
  ): BudgetAllocation {
    const id = "budget_" + Date.now()
    const allocation: BudgetAllocation = {
      id,
      category,
      allocatedAmount,
      spentAmount: 0,
      currency,
      fiscalYear,
      owner,
      status: "draft",
      description,
      createdAt: new Date(),
    }
    this.budgetAllocations.set(id, allocation)
    this.totalBudget += allocatedAmount
    this.budgetLines.set(id, [])
    logger.info(
      { type: "budget_allocation_created", budgetId: id },
      `Presupuesto creado: ${category}`
    )
    return allocation
  }

  addBudgetLine(
    budgetAllocationId: string,
    description: string,
    estimatedCost: number
  ): BudgetLine | null {
    const allocation = this.budgetAllocations.get(budgetAllocationId)
    if (!allocation) return null

    const line: BudgetLine = {
      id: "line_" + Date.now(),
      budgetAllocationId,
      description,
      estimatedCost,
      actualCost: 0,
      variance: 0,
      status: "planned",
    }

    const lines = this.budgetLines.get(budgetAllocationId) || []
    lines.push(line)
    this.budgetLines.set(budgetAllocationId, lines)
    logger.info(
      { type: "budget_line_added", budgetAllocationId },
      `Línea de presupuesto agregada`
    )
    return line
  }

  recordExpense(
    budgetAllocationId: string,
    budgetLineId: string,
    actualCost: number
  ): BudgetLine | null {
    const lines = this.budgetLines.get(budgetAllocationId) || []
    const line = lines.find((l) => l.id === budgetLineId)
    if (!line) return null

    line.actualCost = actualCost
    line.variance = actualCost - line.estimatedCost
    line.status = "completed"

    const allocation = this.budgetAllocations.get(budgetAllocationId)
    if (allocation) {
      allocation.spentAmount += actualCost
      this.budgetAllocations.set(budgetAllocationId, allocation)
    }

    logger.info({ type: "expense_recorded", budgetLineId }, `Gasto registrado`)
    return line
  }

  approveBudget(budgetAllocationId: string): BudgetAllocation | null {
    const allocation = this.budgetAllocations.get(budgetAllocationId)
    if (!allocation) return null
    allocation.status = "approved"
    this.budgetAllocations.set(budgetAllocationId, allocation)
    return allocation
  }

  getBudgetUtilization(budgetAllocationId: string): number {
    const allocation = this.budgetAllocations.get(budgetAllocationId)
    if (!allocation || allocation.allocatedAmount === 0) return 0
    return (allocation.spentAmount / allocation.allocatedAmount) * 100
  }

  getStatistics(): Record<string, unknown> {
    const allocations = Array.from(this.budgetAllocations.values())
    const totalSpent = allocations.reduce((sum, a) => sum + a.spentAmount, 0)
    return {
      totalBudget: this.totalBudget,
      totalSpent,
      totalRemaining: this.totalBudget - totalSpent,
      utilizationPercent: (totalSpent / this.totalBudget) * 100 || 0,
      numberOfAllocations: allocations.length,
      byStatus: {
        draft: allocations.filter((a) => a.status === "draft").length,
        approved: allocations.filter((a) => a.status === "approved").length,
        inExecution: allocations.filter((a) => a.status === "in-execution")
          .length,
        completed: allocations.filter((a) => a.status === "completed").length,
      },
    }
  }

  generateBudgetReport(): string {
    const stats = this.getStatistics()
    return `Budget Planning Report\nTotal Budget: ${stats.totalBudget}\nTotal Spent: ${stats.totalSpent}\nUtilization: ${stats.utilizationPercent.toFixed(2)}%`
  }
}

let globalBudgetPlanningManager: BudgetPlanningManager | null = null

export function getBudgetPlanningManager(): BudgetPlanningManager {
  if (!globalBudgetPlanningManager) {
    globalBudgetPlanningManager = new BudgetPlanningManager()
  }
  return globalBudgetPlanningManager
}
