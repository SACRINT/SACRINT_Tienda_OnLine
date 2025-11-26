/**
 * Competitive Advantage Manager
 * Semana 56, Tarea 56.11: Competitive Advantage & Differentiation Strategy
 */

import { logger } from "@/lib/monitoring"

export interface CompetitiveAdvantage {
  id: string
  advantageName: string
  type: "cost" | "differentiation" | "innovation" | "capability"
  description: string
  defensibility: "high" | "medium" | "low"
  durability: number
  investmentRequired: number
  expectedROI: number
  competitiveScope: string[]
  status: "emerging" | "established" | "mature" | "declining"
}

export interface DifferentiationStrategy {
  id: string
  strategyName: string
  focus: "product" | "service" | "brand" | "technology"
  targetSegment: string
  differentiators: string[]
  communicationChannels: string[]
  implementationCost: number
  expectedMarketResponse: number
  timeToMarket: number
}

export class CompetitiveAdvantageManager {
  private advantages: Map<string, CompetitiveAdvantage> = new Map()
  private differentiationStrategies: Map<string, DifferentiationStrategy> =
    new Map()

  constructor() {
    logger.debug(
      { type: "competitive_advantage_init" },
      "Manager inicializado"
    )
  }

  defineCompetitiveAdvantage(
    advantageName: string,
    type: "cost" | "differentiation" | "innovation" | "capability",
    description: string,
    defensibility: "high" | "medium" | "low",
    durability: number,
    investmentRequired: number,
    expectedROI: number,
    competitiveScope: string[]
  ): CompetitiveAdvantage {
    const id = "advantage_" + Date.now()
    const advantage: CompetitiveAdvantage = {
      id,
      advantageName,
      type,
      description,
      defensibility,
      durability,
      investmentRequired,
      expectedROI,
      competitiveScope,
      status: "emerging",
    }

    this.advantages.set(id, advantage)
    logger.info(
      { type: "competitive_advantage_defined", advantageId: id },
      `Ventaja competitiva definida: ${advantageName}`
    )
    return advantage
  }

  createDifferentiationStrategy(
    strategyName: string,
    focus: "product" | "service" | "brand" | "technology",
    targetSegment: string,
    differentiators: string[],
    communicationChannels: string[],
    implementationCost: number,
    expectedMarketResponse: number,
    timeToMarket: number
  ): DifferentiationStrategy {
    const id = "strategy_" + Date.now()
    const strategy: DifferentiationStrategy = {
      id,
      strategyName,
      focus,
      targetSegment,
      differentiators,
      communicationChannels,
      implementationCost,
      expectedMarketResponse,
      timeToMarket,
    }

    this.differentiationStrategies.set(id, strategy)
    logger.info(
      { type: "differentiation_strategy_created", strategyId: id },
      `Estrategia de diferenciación creada: ${strategyName}`
    )
    return strategy
  }

  getStatistics(): Record<string, unknown> {
    const advantages = Array.from(this.advantages.values())
    const strategies = Array.from(
      this.differentiationStrategies.values()
    )

    const defendableAdvantages = advantages.filter(
      (a) => a.defensibility === "high"
    )

    return {
      totalCompetitiveAdvantages: advantages.length,
      advantagesByType: {
        cost: advantages.filter((a) => a.type === "cost").length,
        differentiation: advantages.filter(
          (a) => a.type === "differentiation"
        ).length,
        innovation: advantages.filter((a) => a.type === "innovation").length,
        capability: advantages.filter((a) => a.type === "capability").length,
      },
      advantagesByStatus: {
        emerging: advantages.filter((a) => a.status === "emerging").length,
        established: advantages.filter((a) => a.status === "established")
          .length,
        mature: advantages.filter((a) => a.status === "mature").length,
        declining: advantages.filter((a) => a.status === "declining").length,
      },
      defendableAdvantages: defendableAdvantages.length,
      averageDurability:
        advantages.length > 0
          ? advantages.reduce((sum, a) => sum + a.durability, 0) /
            advantages.length
          : 0,
      totalInvestmentRequired: advantages.reduce(
        (sum, a) => sum + a.investmentRequired,
        0
      ),
      averageExpectedROI:
        advantages.length > 0
          ? advantages.reduce((sum, a) => sum + a.expectedROI, 0) /
            advantages.length
          : 0,
      totalDifferentiationStrategies: strategies.length,
      strategiesByFocus: {
        product: strategies.filter((s) => s.focus === "product").length,
        service: strategies.filter((s) => s.focus === "service").length,
        brand: strategies.filter((s) => s.focus === "brand").length,
        technology: strategies.filter((s) => s.focus === "technology").length,
      },
    }
  }

  generateCompetitiveReport(): string {
    const stats = this.getStatistics()
    return `Competitive Advantage Report\nAdvantages: ${stats.totalCompetitiveAdvantages}\nStrategies: ${stats.totalDifferentiationStrategies}\nDefendable: ${stats.defendableAdvantages}`
  }
}

let globalCompetitiveAdvantageManager: CompetitiveAdvantageManager | null =
  null

export function getCompetitiveAdvantageManager(): CompetitiveAdvantageManager {
  if (!globalCompetitiveAdvantageManager) {
    globalCompetitiveAdvantageManager = new CompetitiveAdvantageManager()
  }
  return globalCompetitiveAdvantageManager
}
