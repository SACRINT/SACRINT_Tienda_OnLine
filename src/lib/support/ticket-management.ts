/**
 * Ticket Management System
 * Semana 41, Tarea 41.1: Ticket Management System
 */

import { logger } from '@/lib/monitoring'

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'billing' | 'technical' | 'general' | 'feature_request'

export interface Ticket {
  id: string
  customerId: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  tags?: string[]
  metadata?: Record<string, any>
}

export interface TicketResponse {
  id: string
  ticketId: string
  authorId: string
  message: string
  isInternalNote: boolean
  attachments?: string[]
  createdAt: Date
}

export interface TicketMetrics {
  totalTickets: number
  openTickets: number
  averageResolutionTime: number
  averageResponseTime: number
  resolutionRate: number
}

export class TicketManagementManager {
  private tickets: Map<string, Ticket> = new Map()
  private responses: Map<string, TicketResponse[]> = new Map()
  private ticketMetrics: Map<string, { resolution: number; response: number; count: number }> = new Map()

  constructor() {
    logger.debug({ type: 'ticket_management_init' }, 'Ticket Management Manager inicializado')
  }

  /**
   * Crear ticket
   */
  createTicket(customerId: string, subject: string, description: string, priority: TicketPriority, category: TicketCategory): Ticket {
    try {
      const ticket: Ticket = {
        id: `ticket_${Date.now()}_${Math.random()}`,
        customerId,
        subject,
        description,
        status: 'open',
        priority,
        category,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.tickets.set(ticket.id, ticket)
      this.responses.set(ticket.id, [])

      logger.info({ type: 'ticket_created', ticketId: ticket.id, customerId, priority }, `Ticket creado: ${ticket.id}`)

      return ticket
    } catch (error) {
      logger.error({ type: 'ticket_creation_error', error: String(error) }, 'Error al crear ticket')
      throw error
    }
  }

  /**
   * Obtener ticket
   */
  getTicket(ticketId: string): Ticket | null {
    return this.tickets.get(ticketId) || null
  }

  /**
   * Actualizar estado
   */
  updateTicketStatus(ticketId: string, status: TicketStatus): Ticket | null {
    const ticket = this.getTicket(ticketId)
    if (!ticket) return null

    const oldStatus = ticket.status
    ticket.status = status
    ticket.updatedAt = new Date()

    if (status === 'resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date()
      this.recordMetric(ticketId, ticket)
    }

    logger.info({ type: 'ticket_status_updated', ticketId, oldStatus, newStatus: status }, `Estado actualizado: ${oldStatus} → ${status}`)

    return ticket
  }

  /**
   * Agregar respuesta
   */
  addResponse(ticketId: string, authorId: string, message: string, isInternalNote: boolean = false): TicketResponse | null {
    const ticket = this.getTicket(ticketId)
    if (!ticket) return null

    const response: TicketResponse = {
      id: `response_${Date.now()}`,
      ticketId,
      authorId,
      message,
      isInternalNote,
      createdAt: new Date(),
    }

    const responses = this.responses.get(ticketId) || []
    responses.push(response)
    this.responses.set(ticketId, responses)

    ticket.updatedAt = new Date()

    logger.debug({ type: 'response_added', ticketId, responseId: response.id }, 'Respuesta agregada a ticket')

    return response
  }

  /**
   * Obtener respuestas
   */
  getResponses(ticketId: string, includeInternal: boolean = false): TicketResponse[] {
    const responses = this.responses.get(ticketId) || []
    return includeInternal ? responses : responses.filter((r) => !r.isInternalNote)
  }

  /**
   * Asignar ticket
   */
  assignTicket(ticketId: string, staffId: string): Ticket | null {
    const ticket = this.getTicket(ticketId)
    if (!ticket) return null

    ticket.assignedTo = staffId
    ticket.updatedAt = new Date()

    logger.info({ type: 'ticket_assigned', ticketId, staffId }, `Ticket asignado a ${staffId}`)

    return ticket
  }

  /**
   * Obtener tickets del cliente
   */
  getCustomerTickets(customerId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter((t) => t.customerId === customerId)
  }

  /**
   * Obtener tickets asignados
   */
  getAssignedTickets(staffId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter((t) => t.assignedTo === staffId && t.status !== 'closed')
  }

  /**
   * Registrar métrica
   */
  private recordMetric(ticketId: string, ticket: Ticket): void {
    if (!ticket.resolvedAt) return

    const resolution = ticket.resolvedAt.getTime() - ticket.createdAt.getTime()
    const metric = this.ticketMetrics.get(ticket.assignedTo || 'unassigned') || { resolution: 0, response: 0, count: 0 }

    metric.resolution += resolution
    metric.count++
    this.ticketMetrics.set(ticket.assignedTo || 'unassigned', metric)
  }

  /**
   * Obtener métricas
   */
  getMetrics(): TicketMetrics {
    const tickets = Array.from(this.tickets.values())
    const openTickets = tickets.filter((t) => t.status === 'open').length
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved')

    let totalResolutionTime = 0
    for (const ticket of resolvedTickets) {
      if (ticket.resolvedAt) {
        totalResolutionTime += ticket.resolvedAt.getTime() - ticket.createdAt.getTime()
      }
    }

    return {
      totalTickets: tickets.length,
      openTickets,
      averageResolutionTime: resolvedTickets.length > 0 ? totalResolutionTime / resolvedTickets.length : 0,
      averageResponseTime: 0, // Calcular desde responses
      resolutionRate: tickets.length > 0 ? resolvedTickets.length / tickets.length : 0,
    }
  }
}

let globalTicketManagementManager: TicketManagementManager | null = null

export function initializeTicketManagementManager(): TicketManagementManager {
  if (!globalTicketManagementManager) {
    globalTicketManagementManager = new TicketManagementManager()
  }
  return globalTicketManagementManager
}

export function getTicketManagementManager(): TicketManagementManager {
  if (!globalTicketManagementManager) {
    return initializeTicketManagementManager()
  }
  return globalTicketManagementManager
}
