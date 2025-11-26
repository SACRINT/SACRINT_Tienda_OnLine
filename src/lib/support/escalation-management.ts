/**
 * Support Escalation Management
 * Semana 41, Tarea 41.10: Support Escalation Management
 */

import { logger } from '@/lib/monitoring'

export interface EscalationRule {
  id: string
  name: string
  triggerCondition: 'timeout' | 'priority' | 'reassignments' | 'customer_request' | 'satisfaction'
  threshold: number
  escalateTo: 'supervisor' | 'manager' | 'director'
  notifyChannels: Array<'email' | 'sms' | 'slack' | 'dashboard'>
  isActive: boolean
}

export interface Escalation {
  id: string
  ticketId: string
  escalatedBy: string
  escalationLevel: 'level1' | 'level2' | 'level3'
  reason: string
  escalatedFrom: string
  escalatedTo: string
  status: 'pending' | 'acknowledged' | 'resolved' | 'closed'
  createdAt: Date
  resolvedAt?: Date
  notes?: string
}

export interface EscalationMetrics {
  totalEscalations: number
  pendingEscalations: number
  resolvedEscalations: number
  averageResolutionTime: number
  resolutionRate: number
  escalationRate: number
}

export class SupportEscalationManager {
  private escalationRules: Map<string, EscalationRule> = new Map()
  private escalations: Map<string, Escalation> = new Map()
  private escalationHistory: Escalation[] = []

  constructor() {
    logger.debug({ type: 'escalation_init' }, 'Support Escalation Manager inicializado')
  }

  /**
   * Crear regla de escalación
   */
  createEscalationRule(
    name: string,
    triggerCondition: string,
    threshold: number,
    escalateTo: string,
    notifyChannels: string[] = ['email']
  ): EscalationRule {
    const rule: EscalationRule = {
      id: `esc_rule_${Date.now()}`,
      name,
      triggerCondition: triggerCondition as any,
      threshold,
      escalateTo: escalateTo as any,
      notifyChannels: notifyChannels as any,
      isActive: true,
    }

    this.escalationRules.set(rule.id, rule)
    logger.info({ type: 'escalation_rule_created', ruleName: name }, `Regla de escalación creada: ${name}`)

    return rule
  }

  /**
   * Crear escalación
   */
  createEscalation(
    ticketId: string,
    escalatedBy: string,
    reason: string,
    escalatedFrom: string,
    escalatedTo: string,
    level: string = 'level1'
  ): Escalation {
    const escalation: Escalation = {
      id: `esc_${Date.now()}`,
      ticketId,
      escalatedBy,
      escalationLevel: level as any,
      reason,
      escalatedFrom,
      escalatedTo,
      status: 'pending',
      createdAt: new Date(),
    }

    this.escalations.set(escalation.id, escalation)
    this.escalationHistory.push(escalation)

    logger.info(
      { type: 'escalation_created', ticketId, escalationLevel: level, reason },
      `Escalación creada para ticket: ${ticketId}`
    )

    return escalation
  }

  /**
   * Evaluar si debe escalarse
   */
  shouldEscalate(ticketData: {
    ticketId: string
    ageMinutes: number
    priority: string
    reassignmentCount: number
    customerRequest: boolean
    satisfactionScore: number
  }): EscalationRule | null {
    const rules = Array.from(this.escalationRules.values()).filter((r) => r.isActive)

    for (const rule of rules) {
      let shouldTrigger = false

      switch (rule.triggerCondition) {
        case 'timeout':
          shouldTrigger = ticketData.ageMinutes >= rule.threshold
          break
        case 'priority':
          shouldTrigger = ticketData.priority === 'urgent'
          break
        case 'reassignments':
          shouldTrigger = ticketData.reassignmentCount >= rule.threshold
          break
        case 'customer_request':
          shouldTrigger = ticketData.customerRequest
          break
        case 'satisfaction':
          shouldTrigger = ticketData.satisfactionScore < rule.threshold
          break
      }

      if (shouldTrigger) {
        return rule
      }
    }

    return null
  }

  /**
   * Procesar escalación
   */
  processEscalation(escalationId: string): boolean {
    const escalation = this.escalations.get(escalationId)
    if (!escalation) return false

    escalation.status = 'acknowledged'
    logger.info({ type: 'escalation_acknowledged', escalationId }, `Escalación reconocida: ${escalationId}`)

    return true
  }

  /**
   * Resolver escalación
   */
  resolveEscalation(escalationId: string, resolution: string): Escalation | null {
    const escalation = this.escalations.get(escalationId)
    if (!escalation) return null

    escalation.status = 'resolved'
    escalation.resolvedAt = new Date()
    escalation.notes = resolution

    logger.info(
      { type: 'escalation_resolved', escalationId, resolutionTime: escalation.resolvedAt.getTime() - escalation.createdAt.getTime() },
      `Escalación resuelta: ${escalationId}`
    )

    return escalation
  }

  /**
   * Re-escalar a nivel superior
   */
  escalateToNextLevel(escalationId: string): Escalation | null {
    const escalation = this.escalations.get(escalationId)
    if (!escalation) return null

    const levelMap = { level1: 'level2', level2: 'level3', level3: 'level3' }
    escalation.escalationLevel = levelMap[escalation.escalationLevel] as any

    logger.info(
      { type: 'escalation_escalated', escalationId, newLevel: escalation.escalationLevel },
      `Escalación escalada al siguiente nivel: ${escalation.escalationLevel}`
    )

    return escalation
  }

  /**
   * Obtener escalaciones activas
   */
  getActiveEscalations(): Escalation[] {
    return Array.from(this.escalations.values()).filter((e) => e.status === 'pending' || e.status === 'acknowledged')
  }

  /**
   * Obtener escalaciones de ticket
   */
  getTicketEscalations(ticketId: string): Escalation[] {
    return Array.from(this.escalations.values()).filter((e) => e.ticketId === ticketId)
  }

  /**
   * Calcular métricas de escalación
   */
  calculateEscalationMetrics(): EscalationMetrics {
    const total = this.escalations.size
    const pending = Array.from(this.escalations.values()).filter((e) => e.status === 'pending').length
    const acknowledged = Array.from(this.escalations.values()).filter((e) => e.status === 'acknowledged').length
    const resolved = Array.from(this.escalations.values()).filter((e) => e.status === 'resolved').length

    const resolvedEscalations = this.escalationHistory.filter((e) => e.status === 'resolved')
    const avgResolutionTime =
      resolvedEscalations.length > 0
        ? resolvedEscalations.reduce((sum, e) => {
            const time = (e.resolvedAt?.getTime() || 0) - e.createdAt.getTime()
            return sum + time
          }, 0) / resolvedEscalations.length
        : 0

    return {
      totalEscalations: total,
      pendingEscalations: pending + acknowledged,
      resolvedEscalations: resolved,
      averageResolutionTime: Math.round(avgResolutionTime / 60000), // Convert to minutes
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      escalationRate: 0, // Will be calculated by support analytics
    }
  }

  /**
   * Generar reporte de escalación
   */
  generateEscalationReport(): string {
    const metrics = this.calculateEscalationMetrics()
    const active = this.getActiveEscalations()

    const report = `
=== REPORTE DE ESCALACIONES ===

MÉTRICAS GENERALES:
- Total de Escalaciones: ${metrics.totalEscalations}
- Escalaciones Pendientes: ${metrics.pendingEscalations}
- Escalaciones Resueltas: ${metrics.resolvedEscalations}
- Tasa de Resolución: ${metrics.resolutionRate}%

RENDIMIENTO:
- Tiempo Promedio de Resolución: ${metrics.averageResolutionTime} minutos

ESCALACIONES ACTIVAS:
${active.length > 0 ? active.map((e) => `- Ticket ${e.ticketId}: ${e.reason} (${e.escalationLevel})`).join('\n') : '- Ninguna'}

DISTRIBUCIÓN POR NIVEL:
- Level 1: ${Array.from(this.escalations.values()).filter((e) => e.escalationLevel === 'level1').length}
- Level 2: ${Array.from(this.escalations.values()).filter((e) => e.escalationLevel === 'level2').length}
- Level 3: ${Array.from(this.escalations.values()).filter((e) => e.escalationLevel === 'level3').length}
    `

    logger.info({ type: 'escalation_report_generated' }, 'Reporte de escalación generado')
    return report
  }

  /**
   * Obtener historial de escalación
   */
  getEscalationHistory(limit: number = 50): Escalation[] {
    return this.escalationHistory.slice(-limit)
  }

  /**
   * Desactivar regla
   */
  disableRule(ruleId: string): boolean {
    const rule = this.escalationRules.get(ruleId)
    if (rule) {
      rule.isActive = false
      return true
    }
    return false
  }
}

let globalSupportEscalationManager: SupportEscalationManager | null = null

export function initializeSupportEscalationManager(): SupportEscalationManager {
  if (!globalSupportEscalationManager) {
    globalSupportEscalationManager = new SupportEscalationManager()
  }
  return globalSupportEscalationManager
}

export function getSupportEscalationManager(): SupportEscalationManager {
  if (!globalSupportEscalationManager) {
    return initializeSupportEscalationManager()
  }
  return globalSupportEscalationManager
}
