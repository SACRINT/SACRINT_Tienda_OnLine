/**
 * Future Roadmap Visioning Manager
 * Semana 56, Tarea 56.4: Future Roadmap Planning & Strategic Direction
 */

import { logger } from "@/lib/monitoring"

export interface FutureRoadmapPhase {
  id: string
  phaseNumber: number
  phaseName: string
  timeframe: string
  objectives: string[]
  expectedOutcomes: string[]
  investmentRequired: number
  riskLevel: "low" | "medium" | "high"
  status: "planned" | "proposed" | "approved"
}

export interface StrategicInitiative {
  id: string
  initiativeName: string
  description: string
  phases: FutureRoadmapPhase[]
  totalDuration: number
  strategicValue: number
  marketOpportunity: string
}

export class FutureRoadmapManager {
  private initiatives: Map<string, StrategicInitiative> = new Map()
  private roadmapVersions: Map<string, Array<StrategicInitiative>> = new Map()

  constructor() {
    logger.debug({ type: "future_roadmap_init" }, "Manager inicializado")
  }

  createStrategicInitiative(
    initiativeName: string,
    description: string,
    totalDuration: number,
    strategicValue: number,
    marketOpportunity: string,
    phases: Array<{
      phaseNumber: number
      phaseName: string
      timeframe: string
      objectives: string[]
      expectedOutcomes: string[]
      investmentRequired: number
      riskLevel: "low" | "medium" | "high"
    }>
  ): StrategicInitiative {
    const id = "initiative_" + Date.now()
    const initiativePhases: FutureRoadmapPhase[] = phases.map((p) => ({
      id: "phase_" + Date.now(),
      phaseNumber: p.phaseNumber,
      phaseName: p.phaseName,
      timeframe: p.timeframe,
      objectives: p.objectives,
      expectedOutcomes: p.expectedOutcomes,
      investmentRequired: p.investmentRequired,
      riskLevel: p.riskLevel,
      status: "planned",
    }))

    const initiative: StrategicInitiative = {
      id,
      initiativeName,
      description,
      phases: initiativePhases,
      totalDuration,
      strategicValue,
      marketOpportunity,
    }

    this.initiatives.set(id, initiative)
    logger.info(
      { type: "strategic_initiative_created", initiativeId: id },
      `Iniciativa estratégica creada: ${initiativeName}`
    )
    return initiative
  }

  publishRoadmapVersion(version: string): Array<StrategicInitiative> {
    const initiatives = Array.from(this.initiatives.values())
    this.roadmapVersions.set(version, JSON.parse(JSON.stringify(initiatives)))
    logger.info(
      { type: "roadmap_version_published", version },
      `Versión de hoja de ruta publicada: ${version}`
    )
    return initiatives
  }

  getStatistics(): Record<string, unknown> {
    const initiatives = Array.from(this.initiatives.values())
    const allPhases = initiatives.flatMap((i) => i.phases)

    return {
      totalInitiatives: initiatives.length,
      totalPhases: allPhases.length,
      phasesByStatus: {
        planned: allPhases.filter((p) => p.status === "planned").length,
        proposed: allPhases.filter((p) => p.status === "proposed").length,
        approved: allPhases.filter((p) => p.status === "approved").length,
      },
      phasesByRiskLevel: {
        low: allPhases.filter((p) => p.riskLevel === "low").length,
        medium: allPhases.filter((p) => p.riskLevel === "medium").length,
        high: allPhases.filter((p) => p.riskLevel === "high").length,
      },
      totalInvestmentRequired: allPhases.reduce(
        (sum, p) => sum + p.investmentRequired,
        0
      ),
      averageStrategicValue:
        initiatives.length > 0
          ? initiatives.reduce((sum, i) => sum + i.strategicValue, 0) /
            initiatives.length
          : 0,
      roadmapVersions: this.roadmapVersions.size,
    }
  }

  generateRoadmapReport(): string {
    const stats = this.getStatistics()
    return `Future Roadmap Report\nInitiatives: ${stats.totalInitiatives}\nPhases: ${stats.totalPhases}\nTotal Investment: $${stats.totalInvestmentRequired.toLocaleString()}`
  }
}

let globalFutureRoadmapManager: FutureRoadmapManager | null = null

export function getFutureRoadmapManager(): FutureRoadmapManager {
  if (!globalFutureRoadmapManager) {
    globalFutureRoadmapManager = new FutureRoadmapManager()
  }
  return globalFutureRoadmapManager
}
