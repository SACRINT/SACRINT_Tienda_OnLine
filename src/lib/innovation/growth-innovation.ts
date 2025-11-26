/**
 * Growth & Innovation Manager
 * Semana 54, Tarea 54.1: Growth Strategy & Innovation Initiatives
 */

import { logger } from "@/lib/monitoring"

export interface GrowthInitiative {
  id: string
  title: string
  description: string
  category: "user-acquisition" | "retention" | "monetization" | "product-expansion"
  targetMetric: string
  currentValue: number
  goalValue: number
  timeframe: string
  status: "ideation" | "planning" | "execution" | "monitoring" | "completed"
  ownerId: string
  investmentRequired: number
  expectedROI: number
}

export interface InnovationProject {
  id: string
  projectName: string
  innovationType: "disruptive" | "incremental" | "adjacent" | "platform"
  description: string
  resourcesRequired: string[]
  timelineMonths: number
  status: "exploration" | "development" | "launch" | "scale"
  viabilityScore: number
  marketPotential: number
}

export class GrowthInnovationManager {
  private growthInitiatives: Map<string, GrowthInitiative> = new Map()
  private innovationProjects: Map<string, InnovationProject> = new Map()

  constructor() {
    logger.debug({ type: "growth_innovation_init" }, "Manager inicializado")
  }

  launchGrowthInitiative(
    title: string,
    description: string,
    category: "user-acquisition" | "retention" | "monetization" | "product-expansion",
    targetMetric: string,
    goalValue: number,
    timeframe: string,
    ownerId: string,
    investmentRequired: number,
    expectedROI: number
  ): GrowthInitiative {
    const id = "growth_" + Date.now()
    const initiative: GrowthInitiative = {
      id,
      title,
      description,
      category,
      targetMetric,
      currentValue: 0,
      goalValue,
      timeframe,
      status: "ideation",
      ownerId,
      investmentRequired,
      expectedROI,
    }

    this.growthInitiatives.set(id, initiative)
    logger.info(
      { type: "growth_initiative_launched", initiativeId: id },
      `Iniciativa de crecimiento lanzada: ${title}`
    )
    return initiative
  }

  updateGrowthMetrics(initiativeId: string, currentValue: number): GrowthInitiative | null {
    const initiative = this.growthInitiatives.get(initiativeId)
    if (!initiative) return null

    initiative.currentValue = currentValue
    const progressPercent = (currentValue / initiative.goalValue) * 100
    if (progressPercent >= 100) {
      initiative.status = "completed"
    } else if (progressPercent >= 50) {
      initiative.status = "monitoring"
    }

    this.growthInitiatives.set(initiativeId, initiative)
    logger.info(
      { type: "growth_metrics_updated", initiativeId },
      `Métricas actualizadas: ${currentValue}/${initiative.goalValue}`
    )
    return initiative
  }

  startInnovationProject(
    projectName: string,
    innovationType: "disruptive" | "incremental" | "adjacent" | "platform",
    description: string,
    resourcesRequired: string[],
    timelineMonths: number,
    viabilityScore: number,
    marketPotential: number
  ): InnovationProject {
    const id = "innov_" + Date.now()
    const project: InnovationProject = {
      id,
      projectName,
      innovationType,
      description,
      resourcesRequired,
      timelineMonths,
      status: "exploration",
      viabilityScore,
      marketPotential,
    }

    this.innovationProjects.set(id, project)
    logger.info(
      { type: "innovation_project_started", projectId: id },
      `Proyecto de innovación iniciado: ${projectName}`
    )
    return project
  }

  advanceProjectStage(projectId: string): InnovationProject | null {
    const project = this.innovationProjects.get(projectId)
    if (!project) return null

    const stageFlow: Array<"exploration" | "development" | "launch" | "scale"> = [
      "exploration",
      "development",
      "launch",
      "scale",
    ]
    const currentIndex = stageFlow.indexOf(project.status)
    if (currentIndex < stageFlow.length - 1) {
      project.status = stageFlow[currentIndex + 1]
    }

    this.innovationProjects.set(projectId, project)
    logger.info(
      { type: "project_stage_advanced", projectId },
      `Proyecto avanzado a: ${project.status}`
    )
    return project
  }

  getStatistics(): Record<string, unknown> {
    const initiatives = Array.from(this.growthInitiatives.values())
    const projects = Array.from(this.innovationProjects.values())

    return {
      totalGrowthInitiatives: initiatives.length,
      initiativesByCategory: {
        userAcquisition: initiatives.filter((i) => i.category === "user-acquisition")
          .length,
        retention: initiatives.filter((i) => i.category === "retention").length,
        monetization: initiatives.filter((i) => i.category === "monetization").length,
        productExpansion: initiatives.filter((i) => i.category === "product-expansion")
          .length,
      },
      totalInvestment: initiatives.reduce((sum, i) => sum + i.investmentRequired, 0),
      totalExpectedROI: initiatives.reduce((sum, i) => sum + i.expectedROI, 0),
      totalInnovationProjects: projects.length,
      projectsByType: {
        disruptive: projects.filter((p) => p.innovationType === "disruptive").length,
        incremental: projects.filter((p) => p.innovationType === "incremental").length,
        adjacent: projects.filter((p) => p.innovationType === "adjacent").length,
        platform: projects.filter((p) => p.innovationType === "platform").length,
      },
    }
  }

  generateGrowthReport(): string {
    const stats = this.getStatistics()
    return `Growth & Innovation Report\nInitiatives: ${stats.totalGrowthInitiatives}\nInvestment: ${stats.totalInvestment}\nProjects: ${stats.totalInnovationProjects}`
  }
}

let globalGrowthInnovationManager: GrowthInnovationManager | null = null

export function getGrowthInnovationManager(): GrowthInnovationManager {
  if (!globalGrowthInnovationManager) {
    globalGrowthInnovationManager = new GrowthInnovationManager()
  }
  return globalGrowthInnovationManager
}
