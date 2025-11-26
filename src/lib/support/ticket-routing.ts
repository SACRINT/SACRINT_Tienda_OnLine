/**
 * Automated Ticket Routing
 * Semana 41, Tarea 41.9: Automated Ticket Routing
 */

import { logger } from '@/lib/monitoring'

export interface RoutingRule {
  id: string
  name: string
  priority: number
  conditions: RouteCondition[]
  destinationTeamId: string
  destinationAgentId?: string
  isActive: boolean
}

export interface RouteCondition {
  field: 'category' | 'priority' | 'language' | 'keyword' | 'customer_type'
  operator: 'equals' | 'contains' | 'startsWith' | 'in'
  value: string | string[]
}

export interface RoutingDecision {
  ticketId: string
  routedToAgentId: string
  routedToTeamId: string
  rule: string
  timestamp: Date
  reasonCode: string
}

export interface AgentCapacity {
  agentId: string
  maxTickets: number
  currentTickets: number
  specializations: string[]
  languages: string[]
  isAvailable: boolean
}

export class AutomaticTicketRoutingManager {
  private routingRules: Map<string, RoutingRule> = new Map()
  private agentCapacities: Map<string, AgentCapacity> = new Map()
  private routingHistory: RoutingDecision[] = []
  private failedRoutes: Array<{ ticketId: string; reason: string; timestamp: Date }> = []

  constructor() {
    logger.debug({ type: 'ticket_routing_init' }, 'Automatic Ticket Routing Manager inicializado')
  }

  /**
   * Registrar agente con capacidad
   */
  registerAgent(agentId: string, maxTickets: number, specializations: string[] = [], languages: string[] = []): AgentCapacity {
    const capacity: AgentCapacity = {
      agentId,
      maxTickets,
      currentTickets: 0,
      specializations,
      languages,
      isAvailable: true,
    }

    this.agentCapacities.set(agentId, capacity)
    logger.info(
      { type: 'agent_registered_routing', agentId, maxTickets, specializations },
      `Agente registrado para routing: ${agentId}`
    )

    return capacity
  }

  /**
   * Crear regla de routing
   */
  createRoutingRule(name: string, conditions: RouteCondition[], destinationTeamId: string, priority: number = 1): RoutingRule {
    const rule: RoutingRule = {
      id: `rule_${Date.now()}`,
      name,
      priority,
      conditions,
      destinationTeamId,
      isActive: true,
    }

    this.routingRules.set(rule.id, rule)
    logger.info({ type: 'routing_rule_created', ruleName: name }, `Regla de routing creada: ${name}`)

    return rule
  }

  /**
   * Enrutar ticket automáticamente
   */
  routeTicket(
    ticketId: string,
    category: string,
    priority: string,
    language: string = 'es',
    keywords: string[] = [],
    customerType: string = 'regular'
  ): RoutingDecision | null {
    // Obtener reglas activas ordenadas por prioridad
    const activeRules = Array.from(this.routingRules.values())
      .filter((r) => r.isActive)
      .sort((a, b) => b.priority - a.priority)

    // Evaluar cada regla
    for (const rule of activeRules) {
      if (this.matchesConditions(rule.conditions, { category, priority, language, keywords, customerType })) {
        // Encontrar agente disponible en el equipo
        const agent = this.findAvailableAgent(rule.destinationTeamId, language)

        if (agent) {
          this.increaseAgentTicketCount(agent.agentId)

          const decision: RoutingDecision = {
            ticketId,
            routedToAgentId: agent.agentId,
            routedToTeamId: rule.destinationTeamId,
            rule: rule.name,
            timestamp: new Date(),
            reasonCode: `RULE_${rule.id}`,
          }

          this.routingHistory.push(decision)
          logger.info(
            { type: 'ticket_routed', ticketId, agentId: agent.agentId, rule: rule.name },
            `Ticket enrutado a agente: ${agent.agentId}`
          )

          return decision
        }
      }
    }

    // Si no hay regla que coincida o agente disponible, registrar fallo
    this.failedRoutes.push({
      ticketId,
      reason: 'No agents available or rules matched',
      timestamp: new Date(),
    })

    logger.warn(
      { type: 'routing_failed', ticketId, category, priority },
      `No se pudo enrutar ticket: ${ticketId}`
    )

    return null
  }

  /**
   * Verificar si coincide con condiciones
   */
  private matchesConditions(
    conditions: RouteCondition[],
    data: {
      category: string
      priority: string
      language: string
      keywords: string[]
      customerType: string
    }
  ): boolean {
    return conditions.every((condition) => {
      const value = data[condition.field as keyof typeof data]

      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'contains':
          return typeof value === 'string' && value.includes(condition.value as string)
        case 'startsWith':
          return typeof value === 'string' && value.startsWith(condition.value as string)
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value as string)
        default:
          return false
      }
    })
  }

  /**
   * Encontrar agente disponible
   */
  private findAvailableAgent(teamId: string, language: string): AgentCapacity | null {
    const agents = Array.from(this.agentCapacities.values()).filter(
      (a) =>
        a.isAvailable &&
        a.currentTickets < a.maxTickets &&
        a.languages.includes(language)
    )

    // Devolver agente con menos tickets (load balancing)
    return agents.length > 0 ? agents.sort((a, b) => a.currentTickets - b.currentTickets)[0] : null
  }

  /**
   * Incrementar contador de tickets del agente
   */
  increaseAgentTicketCount(agentId: string): void {
    const capacity = this.agentCapacities.get(agentId)
    if (capacity) {
      capacity.currentTickets++
      if (capacity.currentTickets >= capacity.maxTickets) {
        capacity.isAvailable = false
      }
    }
  }

  /**
   * Decrementar contador de tickets del agente
   */
  decreaseAgentTicketCount(agentId: string): void {
    const capacity = this.agentCapacities.get(agentId)
    if (capacity) {
      capacity.currentTickets = Math.max(0, capacity.currentTickets - 1)
      capacity.isAvailable = capacity.currentTickets < capacity.maxTickets
    }
  }

  /**
   * Reasignar ticket
   */
  reassignTicket(ticketId: string, newAgentId: string): RoutingDecision | null {
    const currentCapacity = this.agentCapacities.get(newAgentId)
    if (!currentCapacity || !currentCapacity.isAvailable || currentCapacity.currentTickets >= currentCapacity.maxTickets) {
      return null
    }

    const previousRoute = this.routingHistory.find((r) => r.ticketId === ticketId)
    if (previousRoute) {
      this.decreaseAgentTicketCount(previousRoute.routedToAgentId)
    }

    this.increaseAgentTicketCount(newAgentId)

    const decision: RoutingDecision = {
      ticketId,
      routedToAgentId: newAgentId,
      routedToTeamId: '', // Will be set by caller
      rule: 'MANUAL_REASSIGNMENT',
      timestamp: new Date(),
      reasonCode: 'MANUAL',
    }

    this.routingHistory.push(decision)
    logger.info({ type: 'ticket_reassigned', ticketId, newAgentId }, `Ticket reasignado a: ${newAgentId}`)

    return decision
  }

  /**
   * Obtener estadísticas de routing
   */
  getRoutingStatistics(): {
    totalRouted: number
    successRate: number
    failedRoutes: number
    averageRoutingTime: number
    topRules: Array<{ rule: string; count: number }>
  } {
    const total = this.routingHistory.length
    const failed = this.failedRoutes.length
    const successRate = total > 0 ? ((total - failed) / total) * 100 : 0

    // Contar por regla
    const ruleStats: Record<string, number> = {}
    this.routingHistory.forEach((r) => {
      ruleStats[r.rule] = (ruleStats[r.rule] || 0) + 1
    })

    const topRules = Object.entries(ruleStats)
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRouted: total,
      successRate: Math.round(successRate),
      failedRoutes: failed,
      averageRoutingTime: 0,
      topRules,
    }
  }

  /**
   * Obtener capacidad de agente
   */
  getAgentCapacity(agentId: string): AgentCapacity | null {
    return this.agentCapacities.get(agentId) || null
  }

  /**
   * Obtener historial de routing
   */
  getRoutingHistory(ticketId?: string, limit: number = 50): RoutingDecision[] {
    let history = [...this.routingHistory].slice(-limit)
    return ticketId ? history.filter((r) => r.ticketId === ticketId) : history
  }
}

let globalAutomaticTicketRoutingManager: AutomaticTicketRoutingManager | null = null

export function initializeAutomaticTicketRoutingManager(): AutomaticTicketRoutingManager {
  if (!globalAutomaticTicketRoutingManager) {
    globalAutomaticTicketRoutingManager = new AutomaticTicketRoutingManager()
  }
  return globalAutomaticTicketRoutingManager
}

export function getAutomaticTicketRoutingManager(): AutomaticTicketRoutingManager {
  if (!globalAutomaticTicketRoutingManager) {
    return initializeAutomaticTicketRoutingManager()
  }
  return globalAutomaticTicketRoutingManager
}
