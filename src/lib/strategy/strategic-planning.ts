/**
 * Strategic Planning Manager
 * Semana 51, Tarea 51.1: Strategic Planning & Leadership Direction
 */

import { logger } from "@/lib/monitoring"

export interface StrategicGoal {
  id: string
  title: string
  description: string
  timeframe: "1-year" | "3-year" | "5-year"
  category: "growth" | "efficiency" | "innovation" | "market"
  objectives: string[]
  kpis: string[]
  owner: string
  status: "draft" | "approved" | "executing" | "completed" | "archived"
  createdAt: Date
  updatedAt: Date
}

export class StrategicPlanningManager {
  private strategicGoals: Map<string, StrategicGoal> = new Map()
  private visionStatement: string = ""
  private missionStatement: string = ""

  constructor() {
    logger.debug({ type: "strategic_planning_init" }, "Manager inicializado")
  }

  defineStrategicGoal(
    title: string,
    description: string,
    timeframe: "1-year" | "3-year" | "5-year",
    category: "growth" | "efficiency" | "innovation" | "market",
    objectives: string[],
    kpis: string[],
    owner: string
  ): StrategicGoal {
    const id = "goal_" + Date.now()
    const goal: StrategicGoal = {
      id,
      title,
      description,
      timeframe,
      category,
      objectives,
      kpis,
      owner,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.strategicGoals.set(id, goal)
    logger.info(
      { type: "strategic_goal_defined", goalId: id },
      `Objetivo estratégico definido: ${title}`
    )
    return goal
  }

  approveGoal(goalId: string): StrategicGoal | null {
    const goal = this.strategicGoals.get(goalId)
    if (!goal) {
      logger.warn({ type: "goal_not_found", goalId }, "Objetivo no encontrado")
      return null
    }
    goal.status = "approved"
    goal.updatedAt = new Date()
    this.strategicGoals.set(goalId, goal)
    logger.info({ type: "goal_approved", goalId }, "Objetivo aprobado")
    return goal
  }

  setVisionStatement(vision: string): void {
    this.visionStatement = vision
    logger.info({ type: "vision_statement_set" }, "Visión establecida")
  }

  setMissionStatement(mission: string): void {
    this.missionStatement = mission
    logger.info({ type: "mission_statement_set" }, "Misión establecida")
  }

  getGoalsByTimeframe(
    timeframe: "1-year" | "3-year" | "5-year"
  ): StrategicGoal[] {
    return Array.from(this.strategicGoals.values()).filter(
      (g) => g.timeframe === timeframe
    )
  }

  getGoalsByCategory(
    category: "growth" | "efficiency" | "innovation" | "market"
  ): StrategicGoal[] {
    return Array.from(this.strategicGoals.values()).filter(
      (g) => g.category === category
    )
  }

  updateGoalStatus(
    goalId: string,
    status: "draft" | "approved" | "executing" | "completed" | "archived"
  ): StrategicGoal | null {
    const goal = this.strategicGoals.get(goalId)
    if (!goal) return null
    goal.status = status
    goal.updatedAt = new Date()
    this.strategicGoals.set(goalId, goal)
    return goal
  }

  getStatistics(): Record<string, unknown> {
    const goals = Array.from(this.strategicGoals.values())
    return {
      totalGoals: goals.length,
      byStatus: {
        draft: goals.filter((g) => g.status === "draft").length,
        approved: goals.filter((g) => g.status === "approved").length,
        executing: goals.filter((g) => g.status === "executing").length,
        completed: goals.filter((g) => g.status === "completed").length,
        archived: goals.filter((g) => g.status === "archived").length,
      },
      byTimeframe: {
        "1-year": goals.filter((g) => g.timeframe === "1-year").length,
        "3-year": goals.filter((g) => g.timeframe === "3-year").length,
        "5-year": goals.filter((g) => g.timeframe === "5-year").length,
      },
      byCategory: {
        growth: goals.filter((g) => g.category === "growth").length,
        efficiency: goals.filter((g) => g.category === "efficiency").length,
        innovation: goals.filter((g) => g.category === "innovation").length,
        market: goals.filter((g) => g.category === "market").length,
      },
    }
  }

  generateStrategicReport(): string {
    const stats = this.getStatistics()
    const statusSummary = JSON.stringify(stats.byStatus, null, 2)
    return `Strategic Planning Report\nVision: ${this.visionStatement}\nMission: ${this.missionStatement}\nTotal Goals: ${stats.totalGoals}\nStatus Breakdown: ${statusSummary}`
  }
}

let globalStrategicPlanningManager: StrategicPlanningManager | null = null

export function getStrategicPlanningManager(): StrategicPlanningManager {
  if (!globalStrategicPlanningManager) {
    globalStrategicPlanningManager = new StrategicPlanningManager()
  }
  return globalStrategicPlanningManager
}
