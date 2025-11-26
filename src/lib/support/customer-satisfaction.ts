/**
 * Customer Satisfaction (NPS/CSAT)
 * Semana 41, Tarea 41.7: Customer Satisfaction (NPS/CSAT)
 */

import { logger } from '@/lib/monitoring'

export interface CSATResponse {
  id: string
  customerId: string
  ticketId: string
  score: number
  comment?: string
  category: 'support' | 'product' | 'delivery' | 'overall'
  createdAt: Date
}

export interface NPSResponse {
  id: string
  customerId: string
  score: number
  comment?: string
  promoterType: 'promoter' | 'passive' | 'detractor'
  createdAt: Date
}

export interface SatisfactionMetrics {
  csat: number
  nps: number
  totalResponses: number
  promoters: number
  passives: number
  detractors: number
  avgCSAT: number
  responsiveRate: number
}

export class CustomerSatisfactionManager {
  private csatResponses: Map<string, CSATResponse> = new Map()
  private npsResponses: Map<string, NPSResponse> = new Map()
  private surveyHistory: CSATResponse[] = []
  private npsHistory: NPSResponse[] = []

  constructor() {
    logger.debug({ type: 'satisfaction_init' }, 'Customer Satisfaction Manager inicializado')
  }

  /**
   * Crear respuesta CSAT
   */
  createCSATResponse(customerId: string, ticketId: string, score: number, category: string, comment?: string): CSATResponse {
    const response: CSATResponse = {
      id: `csat_${Date.now()}`,
      customerId,
      ticketId,
      score: Math.min(5, Math.max(1, score)),
      comment,
      category: category as any,
      createdAt: new Date(),
    }

    this.csatResponses.set(response.id, response)
    this.surveyHistory.push(response)

    logger.info(
      { type: 'csat_response_created', customerId, ticketId, score },
      `Respuesta CSAT registrada: ${score}/5`
    )

    return response
  }

  /**
   * Crear respuesta NPS
   */
  createNPSResponse(customerId: string, score: number, comment?: string): NPSResponse {
    const promoterType = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor'

    const response: NPSResponse = {
      id: `nps_${Date.now()}`,
      customerId,
      score: Math.min(10, Math.max(0, score)),
      comment,
      promoterType,
      createdAt: new Date(),
    }

    this.npsResponses.set(response.id, response)
    this.npsHistory.push(response)

    logger.info(
      { type: 'nps_response_created', customerId, score, promoterType },
      `Respuesta NPS registrada: ${score}/10 (${promoterType})`
    )

    return response
  }

  /**
   * Calcular NPS
   */
  calculateNPS(): number {
    if (this.npsResponses.size === 0) return 0

    const responses = Array.from(this.npsResponses.values())
    const promoters = responses.filter((r) => r.promoterType === 'promoter').length
    const detractors = responses.filter((r) => r.promoterType === 'detractor').length

    return Math.round(((promoters - detractors) / responses.length) * 100)
  }

  /**
   * Calcular CSAT
   */
  calculateCSAT(): number {
    if (this.csatResponses.size === 0) return 0

    const responses = Array.from(this.csatResponses.values())
    const satisfied = responses.filter((r) => r.score >= 4).length
    const avgScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length

    return Math.round((satisfied / responses.length) * 100)
  }

  /**
   * Obtener métricas de satisfacción
   */
  getSatisfactionMetrics(): SatisfactionMetrics {
    const csatResponses = Array.from(this.csatResponses.values())
    const npsResponses = Array.from(this.npsResponses.values())

    const totalResponses = csatResponses.length + npsResponses.length
    const promoters = npsResponses.filter((r) => r.promoterType === 'promoter').length
    const passives = npsResponses.filter((r) => r.promoterType === 'passive').length
    const detractors = npsResponses.filter((r) => r.promoterType === 'detractor').length

    const avgCSAT = csatResponses.length > 0 ? csatResponses.reduce((sum, r) => sum + r.score, 0) / csatResponses.length : 0

    return {
      csat: this.calculateCSAT(),
      nps: this.calculateNPS(),
      totalResponses,
      promoters,
      passives,
      detractors,
      avgCSAT: Math.round(avgCSAT * 100) / 100,
      responsiveRate: totalResponses > 0 ? 100 : 0,
    }
  }

  /**
   * Obtener respuestas CSAT por categoría
   */
  getCSATByCategory(category: string): CSATResponse[] {
    return Array.from(this.csatResponses.values()).filter((r) => r.category === category)
  }

  /**
   * Obtener tendencias de satisfacción
   */
  getSatisfactionTrends(timeWindowDays: number = 30): {
    avgCSATTrend: number
    avgNPSTrend: number
    volumeTrend: number
  } {
    const now = new Date()
    const cutoff = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000)

    const recentCSAT = this.surveyHistory.filter((r) => r.createdAt >= cutoff)
    const recentNPS = this.npsHistory.filter((r) => r.createdAt >= cutoff)

    const avgCSAT = recentCSAT.length > 0 ? recentCSAT.reduce((sum, r) => sum + r.score, 0) / recentCSAT.length : 0
    const avgNPS = recentNPS.length > 0 ? recentNPS.reduce((sum, r) => sum + r.score, 0) / recentNPS.length : 0

    return {
      avgCSATTrend: Math.round(avgCSAT * 100) / 100,
      avgNPSTrend: Math.round(avgNPS * 100) / 100,
      volumeTrend: recentCSAT.length + recentNPS.length,
    }
  }

  /**
   * Generar reporte de satisfacción
   */
  generateSatisfactionReport(): string {
    const metrics = this.getSatisfactionMetrics()
    const trends = this.getSatisfactionTrends()

    const report = `
=== REPORTE DE SATISFACCIÓN DEL CLIENTE ===

NPS (Net Promoter Score):
- Puntuación NPS: ${metrics.nps}
- Promotores: ${metrics.promoters}
- Pasivos: ${metrics.passives}
- Detractores: ${metrics.detractors}

CSAT (Customer Satisfaction):
- Puntuación CSAT: ${metrics.csat}%
- Promedio CSAT: ${metrics.avgCSAT}/5
- Total de Respuestas: ${metrics.totalResponses}

TENDENCIAS (últimos 30 días):
- Tendencia CSAT: ${trends.avgCSATTrend}/5
- Tendencia NPS: ${trends.avgNPSTrend}/10
- Volumen de Respuestas: ${trends.volumeTrend}

CLASIFICACIÓN DE SENTIMIENTOS:
- Promotores: ${metrics.totalResponses > 0 ? Math.round((metrics.promoters / metrics.totalResponses) * 100) : 0}%
- Pasivos: ${metrics.totalResponses > 0 ? Math.round((metrics.passives / metrics.totalResponses) * 100) : 0}%
- Detractores: ${metrics.totalResponses > 0 ? Math.round((metrics.detractors / metrics.totalResponses) * 100) : 0}%
    `

    logger.info({ type: 'satisfaction_report_generated' }, 'Reporte de satisfacción generado')
    return report
  }

  /**
   * Obtener comentarios de detractores
   */
  getDetractorFeedback(): NPSResponse[] {
    return Array.from(this.npsResponses.values())
      .filter((r) => r.promoterType === 'detractor' && r.comment)
      .slice(-10)
  }

  /**
   * Obtener respuestas bajas de CSAT
   */
  getLowCSATResponses(threshold: number = 3): CSATResponse[] {
    return Array.from(this.csatResponses.values()).filter((r) => r.score <= threshold)
  }
}

let globalCustomerSatisfactionManager: CustomerSatisfactionManager | null = null

export function initializeCustomerSatisfactionManager(): CustomerSatisfactionManager {
  if (!globalCustomerSatisfactionManager) {
    globalCustomerSatisfactionManager = new CustomerSatisfactionManager()
  }
  return globalCustomerSatisfactionManager
}

export function getCustomerSatisfactionManager(): CustomerSatisfactionManager {
  if (!globalCustomerSatisfactionManager) {
    return initializeCustomerSatisfactionManager()
  }
  return globalCustomerSatisfactionManager
}
