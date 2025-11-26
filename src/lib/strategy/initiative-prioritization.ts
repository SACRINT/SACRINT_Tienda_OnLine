/**
 * Initiative Prioritization Manager
 * Semana 51, Tarea 51.8: Strategic Initiative & Feature Prioritization
 */

import { logger } from "@/lib/monitoring"

export interface Initiative {
  id: string
  name: string
  description: string
  objectives: string[]
  businessValue: number
  effort: number
  risk: number
  timeToMarket: number
  priority: number
  status: "backlog" | "queued" | "in-progress" | "completed" | "cancelled"
  owner: string
  alignment: "strategic" | "tactical" | "operational"
  roi: number
}

export class InitiativePrioritizationManager {
  private initiatives: Map<string, Initiative> = new Map()
  private priorityMatrix: Map<number, Initiative[]> = new Map()

  constructor() {
    logger.debug(
      { type: "initiative_prioritization_init" },
      "Manager inicializado"
    )
  }

  addInitiative(
    name: string,
    description: string,
    objectives: string[],
    businessValue: number,
    effort: number,
    risk: number,
    timeToMarket: number,
    owner: string,
    alignment: "strategic" | "tactical" | "operational"
  ): Initiative {
    const id = "init_" + Date.now()
    const priority = this.calculatePriority(businessValue, effort, risk)
    const roi = businessValue / (effort > 0 ? effort : 1)

    const initiative: Initiative = {
      id,
      name,
      description,
      objectives,
      businessValue,
      effort,
      risk,
      timeToMarket,
      priority,
      status: "backlog",
      owner,
      alignment,
      roi,
    }

    this.initiatives.set(id, initiative)

    const bucket = this.priorityMatrix.get(priority) || []
    bucket.push(initiative)
    this.priorityMatrix.set(priority, bucket)

    logger.info(
      { type: "initiative_added", initiativeId: id },
      `Iniciativa agregada: ${name} (Priority: ${priority})`
    )
    return initiative
  }

  calculatePriority(
    businessValue: number,
    effort: number,
    risk: number
  ): number {
    const effortNormalized = Math.min(effort / 10, 1)
    const riskNormalized = Math.min(risk / 10, 1)
    return Math.round(
      (businessValue * 0.6 - effortNormalized * 0.3 - riskNormalized * 0.1) *
        100
    )
  }

  reprioritize(): Initiative[] {
    const sorted = Array.from(this.initiatives.values()).sort(
      (a, b) => b.priority - a.priority
    )

    let position = 1
    for (const initiative of sorted) {
      initiative.priority = position
      position++
    }

    return sorted
  }

  getInitiativesByAlignment(
    alignment: "strategic" | "tactical" | "operational"
  ): Initiative[] {
    return Array.from(this.initiatives.values()).filter(
      (i) => i.alignment === alignment
    )
  }

  updateInitiativeStatus(
    initiativeId: string,
    status: "backlog" | "queued" | "in-progress" | "completed" | "cancelled"
  ): Initiative | null {
    const initiative = this.initiatives.get(initiativeId)
    if (!initiative) return null
    initiative.status = status
    return initiative
  }

  getTopPrioritized(count: number): Initiative[] {
    return Array.from(this.initiatives.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, count)
  }

  getStatistics(): Record<string, unknown> {
    const initiatives = Array.from(this.initiatives.values())
    const avgRoi =
      initiatives.length > 0
        ? initiatives.reduce((sum, i) => sum + i.roi, 0) / initiatives.length
        : 0

    return {
      totalInitiatives: initiatives.length,
      averagePriority:
        initiatives.length > 0
          ? initiatives.reduce((sum, i) => sum + i.priority, 0) /
            initiatives.length
          : 0,
      averageRoi: avgRoi,
      byStatus: {
        backlog: initiatives.filter((i) => i.status === "backlog").length,
        queued: initiatives.filter((i) => i.status === "queued").length,
        inProgress: initiatives.filter((i) => i.status === "in-progress")
          .length,
        completed: initiatives.filter((i) => i.status === "completed").length,
        cancelled: initiatives.filter((i) => i.status === "cancelled").length,
      },
      byAlignment: {
        strategic: initiatives.filter((i) => i.alignment === "strategic")
          .length,
        tactical: initiatives.filter((i) => i.alignment === "tactical").length,
        operational: initiatives.filter((i) => i.alignment === "operational")
          .length,
      },
    }
  }

  generatePrioritizationReport(): string {
    const stats = this.getStatistics()
    return `Initiative Prioritization Report\nTotal Initiatives: ${stats.totalInitiatives}\nAverage ROI: ${stats.averageRoi.toFixed(2)}\nAverage Priority Score: ${stats.averagePriority.toFixed(2)}`
  }
}

let globalInitiativePrioritizationManager: InitiativePrioritizationManager | null =
  null

export function getInitiativePrioritizationManager(): InitiativePrioritizationManager {
  if (!globalInitiativePrioritizationManager) {
    globalInitiativePrioritizationManager = new InitiativePrioritizationManager()
  }
  return globalInitiativePrioritizationManager
}
