/**
 * Support Analytics & Metrics
 * Semana 41, Tarea 41.6: Support Analytics & Metrics
 */

import { logger } from '@/lib/monitoring'

export interface SupportMetric {
  metricId: string
  date: Date
  ticketVolume: number
  averageResponseTime: number
  averageResolutionTime: number
  customerSatisfactionScore: number
  firstContactResolutionRate: number
  channelMetrics: Record<string, ChannelMetric>
}

export interface ChannelMetric {
  channel: 'email' | 'chat' | 'phone' | 'social'
  ticketCount: number
  averageResponseTime: number
  satisfactionScore: number
  volumeTrend: number
}

export interface AgentMetric {
  agentId: string
  date: Date
  ticketsHandled: number
  averageResolutionTime: number
  customerSatisfaction: number
  firstContactResolution: number
  handlingTime: number
  idleTime: number
}

export interface SupportAnalytics {
  totalTickets: number
  resolvedTickets: number
  pendingTickets: number
  averageResponseTime: number
  averageResolutionTime: number
  satisfactionScore: number
  firstContactResolutionRate: number
  channelDistribution: Record<string, number>
}

export class SupportAnalyticsManager {
  private metrics: Map<string, SupportMetric> = new Map()
  private agentMetrics: Map<string, AgentMetric[]> = new Map()
  private ticketEvents: Array<{ ticketId: string; event: string; timestamp: Date; data: any }> = []

  constructor() {
    logger.debug({ type: 'support_analytics_init' }, 'Support Analytics Manager inicializado')
  }

  /**
   * Registrar evento de ticket
   */
  recordTicketEvent(ticketId: string, event: 'created' | 'responded' | 'resolved' | 'escalated', data?: any): void {
    this.ticketEvents.push({
      ticketId,
      event,
      timestamp: new Date(),
      data,
    })

    logger.debug({ type: 'ticket_event_recorded', ticketId, event }, `Evento de ticket registrado: ${event}`)
  }

  /**
   * Registrar métrica de agente
   */
  recordAgentMetric(
    agentId: string,
    ticketsHandled: number,
    resolutionTime: number,
    satisfaction: number,
    fcr: number
  ): AgentMetric {
    const metric: AgentMetric = {
      agentId,
      date: new Date(),
      ticketsHandled,
      averageResolutionTime: resolutionTime,
      customerSatisfaction: satisfaction,
      firstContactResolution: fcr,
      handlingTime: resolutionTime,
      idleTime: Math.max(0, 480 - resolutionTime),
    }

    if (!this.agentMetrics.has(agentId)) {
      this.agentMetrics.set(agentId, [])
    }
    this.agentMetrics.get(agentId)!.push(metric)

    return metric
  }

  /**
   * Calcular métricas de soporte
   */
  calculateMetrics(timeWindowDays: number = 30): SupportAnalytics {
    const now = new Date()
    const cutoff = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000)

    const relevantEvents = this.ticketEvents.filter((e) => e.timestamp >= cutoff)
    const uniqueTickets = [...new Set(relevantEvents.map((e) => e.ticketId))].length

    const resolvedCount = relevantEvents.filter((e) => e.event === 'resolved').length
    const fcr =
      uniqueTickets > 0
        ? (relevantEvents.filter((e) => e.event === 'resolved' && e.data?.fcr === true).length / uniqueTickets) * 100
        : 0

    const responseTimes = relevantEvents
      .filter((e) => e.event === 'responded' && e.data?.responseTime)
      .map((e) => e.data.responseTime)

    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0

    const resolutionTimes = relevantEvents
      .filter((e) => e.event === 'resolved' && e.data?.resolutionTime)
      .map((e) => e.data.resolutionTime)

    const avgResolutionTime =
      resolutionTimes.length > 0 ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length : 0

    const satisfactionScores = relevantEvents
      .filter((e) => e.data?.satisfaction)
      .map((e) => e.data.satisfaction)

    const avgSatisfaction =
      satisfactionScores.length > 0 ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length : 0

    const channelDistribution: Record<string, number> = {}
    const channelsInEvents = relevantEvents.map((e) => e.data?.channel || 'unknown')
    for (const channel of channelsInEvents) {
      channelDistribution[channel] = (channelDistribution[channel] || 0) + 1
    }

    return {
      totalTickets: uniqueTickets,
      resolvedTickets: resolvedCount,
      pendingTickets: uniqueTickets - resolvedCount,
      averageResponseTime: Math.round(avgResponseTime),
      averageResolutionTime: Math.round(avgResolutionTime),
      satisfactionScore: Math.round(avgSatisfaction * 100) / 100,
      firstContactResolutionRate: Math.round(fcr),
      channelDistribution,
    }
  }

  /**
   * Obtener top agents por performance
   */
  getTopAgents(limit: number = 10): AgentMetric[] {
    const allMetrics = Array.from(this.agentMetrics.values()).flat()
    return allMetrics.sort((a, b) => b.customerSatisfaction - a.customerSatisfaction).slice(0, limit)
  }

  /**
   * Obtener métricas de agente
   */
  getAgentMetrics(agentId: string): AgentMetric[] {
    return this.agentMetrics.get(agentId) || []
  }

  /**
   * Generar reporte de soporte
   */
  generateSupportReport(timeWindowDays: number = 30): string {
    const metrics = this.calculateMetrics(timeWindowDays)
    const topAgents = this.getTopAgents(5)

    const report = `
=== REPORTE DE SOPORTE ===
Periodo: Últimos ${timeWindowDays} días

MÉTRICAS GENERALES:
- Total de Tickets: ${metrics.totalTickets}
- Tickets Resueltos: ${metrics.resolvedTickets}
- Tickets Pendientes: ${metrics.pendingTickets}
- Tasa de Resolución: ${metrics.resolvedTickets > 0 ? Math.round((metrics.resolvedTickets / metrics.totalTickets) * 100) : 0}%

RENDIMIENTO:
- Tiempo Promedio de Respuesta: ${metrics.averageResponseTime} minutos
- Tiempo Promedio de Resolución: ${metrics.averageResolutionTime} minutos
- Calificación de Satisfacción: ${metrics.satisfactionScore}/5
- Tasa de Resolución en Primer Contacto: ${metrics.firstContactResolutionRate}%

DISTRIBUCIÓN POR CANAL:
${Object.entries(metrics.channelDistribution)
  .map(([channel, count]) => `- ${channel}: ${count} tickets`)
  .join('\n')}

TOP 5 AGENTES:
${topAgents.map((a, i) => `${i + 1}. Agente ${a.agentId}: ${a.customerSatisfaction.toFixed(2)}/5 satisfacción`).join('\n')}
    `

    logger.info({ type: 'support_report_generated', timeWindow: timeWindowDays }, 'Reporte de soporte generado')
    return report
  }

  /**
   * Obtener tendencias
   */
  getTrends(): {
    ticketVolumeTrend: number
    satisfactionTrend: number
    responseTimeTrend: number
  } {
    const last7Days = this.calculateMetrics(7)
    const last30Days = this.calculateMetrics(30)

    return {
      ticketVolumeTrend: last7Days.totalTickets - last30Days.totalTickets / 4.3,
      satisfactionTrend: last7Days.satisfactionScore - last30Days.satisfactionScore,
      responseTimeTrend: last7Days.averageResponseTime - last30Days.averageResponseTime,
    }
  }

  /**
   * Obtener eventos
   */
  getTicketEvents(ticketId?: string, limit: number = 50): Array<{ ticketId: string; event: string; timestamp: Date; data: any }> {
    let events = [...this.ticketEvents].slice(-limit)
    return ticketId ? events.filter((e) => e.ticketId === ticketId) : events
  }
}

let globalSupportAnalyticsManager: SupportAnalyticsManager | null = null

export function initializeSupportAnalyticsManager(): SupportAnalyticsManager {
  if (!globalSupportAnalyticsManager) {
    globalSupportAnalyticsManager = new SupportAnalyticsManager()
  }
  return globalSupportAnalyticsManager
}

export function getSupportAnalyticsManager(): SupportAnalyticsManager {
  if (!globalSupportAnalyticsManager) {
    return initializeSupportAnalyticsManager()
  }
  return globalSupportAnalyticsManager
}
