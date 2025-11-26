/**
 * Roadmap Planning Manager
 * Semana 51, Tarea 51.2: Technical & Product Roadmap Planning
 */

import { logger } from "@/lib/monitoring"

export interface RoadmapItem {
  id: string
  title: string
  description: string
  phase: "discovery" | "design" | "development" | "launch" | "optimize"
  priority: "critical" | "high" | "medium" | "low"
  estimatedDuration: number
  startDate: Date
  targetDate: Date
  owner: string
  dependencies: string[]
  risks: string[]
  status: "planned" | "in-progress" | "blocked" | "completed"
}

export class RoadmapPlanningManager {
  private roadmapItems: Map<string, RoadmapItem> = new Map()
  private quarters: Map<string, string[]> = new Map()

  constructor() {
    logger.debug({ type: "roadmap_planning_init" }, "Manager inicializado")
  }

  createRoadmapItem(
    title: string,
    description: string,
    phase: "discovery" | "design" | "development" | "launch" | "optimize",
    priority: "critical" | "high" | "medium" | "low",
    estimatedDuration: number,
    startDate: Date,
    targetDate: Date,
    owner: string,
    dependencies: string[] = []
  ): RoadmapItem {
    const id = "roadmap_" + Date.now()
    const item: RoadmapItem = {
      id,
      title,
      description,
      phase,
      priority,
      estimatedDuration,
      startDate,
      targetDate,
      owner,
      dependencies,
      risks: [],
      status: "planned",
    }
    this.roadmapItems.set(id, item)
    logger.info(
      { type: "roadmap_item_created", itemId: id },
      `Item de roadmap creado: ${title}`
    )
    return item
  }

  addRiskToItem(itemId: string, risk: string): RoadmapItem | null {
    const item = this.roadmapItems.get(itemId)
    if (!item) return null
    item.risks.push(risk)
    logger.info({ type: "risk_added_to_item", itemId }, `Riesgo agregado`)
    return item
  }

  assignToQuarter(itemId: string, quarter: string): void {
    const items = this.quarters.get(quarter) || []
    items.push(itemId)
    this.quarters.set(quarter, items)
    logger.info(
      { type: "item_assigned_to_quarter", itemId, quarter },
      `Item asignado a trimestre`
    )
  }

  getItemsByPhase(
    phase: "discovery" | "design" | "development" | "launch" | "optimize"
  ): RoadmapItem[] {
    return Array.from(this.roadmapItems.values()).filter(
      (item) => item.phase === phase
    )
  }

  getItemsByPriority(
    priority: "critical" | "high" | "medium" | "low"
  ): RoadmapItem[] {
    return Array.from(this.roadmapItems.values()).filter(
      (item) => item.priority === priority
    )
  }

  updateItemStatus(
    itemId: string,
    status: "planned" | "in-progress" | "blocked" | "completed"
  ): RoadmapItem | null {
    const item = this.roadmapItems.get(itemId)
    if (!item) return null
    item.status = status
    return item
  }

  getQuarterlyRoadmap(quarter: string): RoadmapItem[] {
    const itemIds = this.quarters.get(quarter) || []
    return itemIds.map((id) => this.roadmapItems.get(id)).filter(
      (item) => item !== undefined
    ) as RoadmapItem[]
  }

  getStatistics(): Record<string, unknown> {
    const items = Array.from(this.roadmapItems.values())
    return {
      totalItems: items.length,
      byPhase: {
        discovery: items.filter((i) => i.phase === "discovery").length,
        design: items.filter((i) => i.phase === "design").length,
        development: items.filter((i) => i.phase === "development").length,
        launch: items.filter((i) => i.phase === "launch").length,
        optimize: items.filter((i) => i.phase === "optimize").length,
      },
      byStatus: {
        planned: items.filter((i) => i.status === "planned").length,
        inProgress: items.filter((i) => i.status === "in-progress").length,
        blocked: items.filter((i) => i.status === "blocked").length,
        completed: items.filter((i) => i.status === "completed").length,
      },
      totalDurationMonths: items.reduce((sum, i) => sum + i.estimatedDuration, 0),
      criticalItems: items.filter((i) => i.priority === "critical").length,
    }
  }

  generateRoadmapReport(): string {
    const stats = this.getStatistics()
    return `Roadmap Planning Report\nTotal Items: ${stats.totalItems}\nCritical Items: ${stats.criticalItems}\nTotal Duration: ${stats.totalDurationMonths} months`
  }
}

let globalRoadmapPlanningManager: RoadmapPlanningManager | null = null

export function getRoadmapPlanningManager(): RoadmapPlanningManager {
  if (!globalRoadmapPlanningManager) {
    globalRoadmapPlanningManager = new RoadmapPlanningManager()
  }
  return globalRoadmapPlanningManager
}
