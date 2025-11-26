/**
 * Support Team Performance Tracking
 * Semana 41, Tarea 41.8: Support Team Performance Tracking
 */

import { logger } from '@/lib/monitoring'

export interface AgentPerformance {
  agentId: string
  name: string
  ticketsHandled: number
  ticketsResolved: number
  averageResolutionTime: number
  customerSatisfactionRating: number
  responseTimeAccuracy: number
  firstContactResolutionRate: number
  productivityScore: number
  qualityScore: number
  lastUpdated: Date
}

export interface TeamPerformance {
  teamId: string
  totalTickets: number
  resolvedTickets: number
  pendingTickets: number
  averageResolutionTime: number
  teamSatisfaction: number
  teamProductivity: number
  targetMet: boolean
}

export class SupportTeamPerformanceManager {
  private agentPerformance: Map<string, AgentPerformance> = new Map()
  private teamPerformance: Map<string, TeamPerformance> = new Map()
  private performanceHistory: AgentPerformance[] = []

  constructor() {
    logger.debug({ type: 'team_performance_init' }, 'Support Team Performance Manager inicializado')
  }

  /**
   * Registrar performance de agente
   */
  recordAgentPerformance(
    agentId: string,
    name: string,
    ticketsHandled: number,
    ticketsResolved: number,
    resolutionTime: number,
    satisfaction: number,
    fcr: number
  ): AgentPerformance {
    const performance: AgentPerformance = {
      agentId,
      name,
      ticketsHandled,
      ticketsResolved,
      averageResolutionTime: resolutionTime,
      customerSatisfactionRating: Math.min(5, Math.max(0, satisfaction)),
      responseTimeAccuracy: ticketsHandled > 0 ? (ticketsResolved / ticketsHandled) * 100 : 0,
      firstContactResolutionRate: fcr,
      productivityScore: ticketsHandled * 10,
      qualityScore: (satisfaction / 5) * 100,
      lastUpdated: new Date(),
    }

    this.agentPerformance.set(agentId, performance)
    this.performanceHistory.push(performance)

    logger.info(
      { type: 'agent_performance_recorded', agentId, name, satisfaction },
      `Performance registrado para agente: ${name}`
    )

    return performance
  }

  /**
   * Obtener performance de agente
   */
  getAgentPerformance(agentId: string): AgentPerformance | null {
    return this.agentPerformance.get(agentId) || null
  }

  /**
   * Obtener top performers
   */
  getTopPerformers(limit: number = 10): AgentPerformance[] {
    return Array.from(this.agentPerformance.values())
      .sort((a, b) => {
        const scoreA = (a.qualityScore + a.productivityScore) / 2
        const scoreB = (b.qualityScore + b.productivityScore) / 2
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  /**
   * Obtener necesitados de mejora
   */
  getNeedsImprovement(threshold: number = 60): AgentPerformance[] {
    return Array.from(this.agentPerformance.values()).filter((p) => {
      const overallScore = (p.qualityScore + p.productivityScore) / 2
      return overallScore < threshold
    })
  }

  /**
   * Calcular performance del equipo
   */
  calculateTeamPerformance(teamId: string, agentIds: string[]): TeamPerformance {
    const teamAgents = agentIds
      .map((id) => this.agentPerformance.get(id))
      .filter((a) => a !== undefined) as AgentPerformance[]

    if (teamAgents.length === 0) {
      return {
        teamId,
        totalTickets: 0,
        resolvedTickets: 0,
        pendingTickets: 0,
        averageResolutionTime: 0,
        teamSatisfaction: 0,
        teamProductivity: 0,
        targetMet: false,
      }
    }

    const totalTickets = teamAgents.reduce((sum, a) => sum + a.ticketsHandled, 0)
    const resolvedTickets = teamAgents.reduce((sum, a) => sum + a.ticketsResolved, 0)
    const avgResolutionTime =
      teamAgents.reduce((sum, a) => sum + a.averageResolutionTime, 0) / teamAgents.length
    const avgSatisfaction =
      teamAgents.reduce((sum, a) => sum + a.customerSatisfactionRating, 0) / teamAgents.length
    const avgProductivity = teamAgents.reduce((sum, a) => sum + a.productivityScore, 0) / teamAgents.length

    const performance: TeamPerformance = {
      teamId,
      totalTickets,
      resolvedTickets,
      pendingTickets: totalTickets - resolvedTickets,
      averageResolutionTime: Math.round(avgResolutionTime),
      teamSatisfaction: Math.round(avgSatisfaction * 100) / 100,
      teamProductivity: Math.round(avgProductivity),
      targetMet: avgSatisfaction >= 4.0 && avgProductivity >= 60,
    }

    this.teamPerformance.set(teamId, performance)
    return performance
  }

  /**
   * Generar reporte de desempeño
   */
  generatePerformanceReport(agentId?: string): string {
    if (agentId) {
      const performance = this.getAgentPerformance(agentId)
      if (!performance) return 'Agente no encontrado'

      return `
=== REPORTE DE DESEMPEÑO - AGENTE ===
Agente: ${performance.name} (${performance.agentId})

MÉTRICAS PRINCIPALES:
- Tickets Manejados: ${performance.ticketsHandled}
- Tickets Resueltos: ${performance.ticketsResolved}
- Tasa de Resolución: ${performance.responseTimeAccuracy.toFixed(2)}%

CALIDAD:
- Calificación de Satisfacción: ${performance.customerSatisfactionRating}/5
- Puntuación de Calidad: ${performance.qualityScore.toFixed(2)}%
- Tasa de Resolución en Primer Contacto: ${performance.firstContactResolutionRate}%

PRODUCTIVIDAD:
- Tiempo Promedio de Resolución: ${performance.averageResolutionTime} minutos
- Puntuación de Productividad: ${performance.productivityScore}
- Última Actualización: ${performance.lastUpdated.toISOString()}
      `
    } else {
      const topPerformers = this.getTopPerformers(5)
      const needsImprovement = this.getNeedsImprovement()

      return `
=== REPORTE GENERAL DE DESEMPEÑO DE EQUIPO ===

TOP 5 PERFORMERS:
${topPerformers.map((p, i) => `${i + 1}. ${p.name}: ${((p.qualityScore + p.productivityScore) / 2).toFixed(2)}% rendimiento`).join('\n')}

NECESITADOS DE MEJORA (< 60%):
${needsImprovement.length > 0 ? needsImprovement.map((p) => `- ${p.name}: ${((p.qualityScore + p.productivityScore) / 2).toFixed(2)}% rendimiento`).join('\n') : '- Ninguno'}

TOTAL DE AGENTES: ${this.agentPerformance.size}
      `
    }
  }

  /**
   * Establecer metas de desempeño
   */
  setPerformanceGoals(agentId: string, goals: { satisfaction: number; productivity: number; fcr: number }): boolean {
    const performance = this.agentPerformance.get(agentId)
    if (!performance) return false

    logger.info(
      { type: 'performance_goals_set', agentId, goals },
      `Metas establecidas para agente ${performance.name}`
    )

    return true
  }

  /**
   * Evaluar contra metas
   */
  evaluateAgainstGoals(agentId: string, goals: any): { met: boolean; gaps: string[] } {
    const performance = this.agentPerformance.get(agentId)
    if (!performance) return { met: false, gaps: ['Agente no encontrado'] }

    const gaps: string[] = []

    if (performance.customerSatisfactionRating < goals.satisfaction) {
      gaps.push(`Satisfacción: ${performance.customerSatisfactionRating} < ${goals.satisfaction}`)
    }
    if (performance.productivityScore < goals.productivity) {
      gaps.push(`Productividad: ${performance.productivityScore} < ${goals.productivity}`)
    }
    if (performance.firstContactResolutionRate < goals.fcr) {
      gaps.push(`FCR: ${performance.firstContactResolutionRate}% < ${goals.fcr}%`)
    }

    return {
      met: gaps.length === 0,
      gaps,
    }
  }

  /**
   * Obtener histórico de performance
   */
  getPerformanceHistory(agentId: string, limit: number = 30): AgentPerformance[] {
    return this.performanceHistory
      .filter((p) => p.agentId === agentId)
      .slice(-limit)
  }
}

let globalSupportTeamPerformanceManager: SupportTeamPerformanceManager | null = null

export function initializeSupportTeamPerformanceManager(): SupportTeamPerformanceManager {
  if (!globalSupportTeamPerformanceManager) {
    globalSupportTeamPerformanceManager = new SupportTeamPerformanceManager()
  }
  return globalSupportTeamPerformanceManager
}

export function getSupportTeamPerformanceManager(): SupportTeamPerformanceManager {
  if (!globalSupportTeamPerformanceManager) {
    return initializeSupportTeamPerformanceManager()
  }
  return globalSupportTeamPerformanceManager
}
