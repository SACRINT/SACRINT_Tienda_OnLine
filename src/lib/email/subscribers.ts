/**
 * Subscriber List Management y Segmentation
 * Semana 32, Tarea 32.3: Gestión de listas de suscriptores y segmentación avanzada
 */

import { logger } from '@/lib/monitoring'

/**
 * Estado de suscriptor
 */
export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced' | 'complaint' | 'cleaned'

/**
 * Suscriptor
 */
export interface Subscriber {
  id: string
  email: string
  tenantId: string
  firstName?: string
  lastName?: string
  status: SubscriberStatus
  listIds: string[]
  tags: string[]
  preferences?: {
    marketing: boolean
    notifications: boolean
    weekly_digest: boolean
    personalizedOffers: boolean
  }
  metadata?: Record<string, any>
  engagementScore: number // 0-100
  lastEngaged?: Date
  subscribedAt: Date
  unsubscribedAt?: Date
  bounceType?: 'hard' | 'soft'
  bounceAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Lista de suscriptores
 */
export interface SubscriberList {
  id: string
  tenantId: string
  name: string
  description?: string
  subscriberCount: number
  activeCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Segmento de audiencia
 */
export interface Segment {
  id: string
  tenantId: string
  name: string
  description?: string
  rules: SegmentRule[]
  subscriberIds: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Regla de segmento
 */
export interface SegmentRule {
  field: 'engagementScore' | 'lastEngaged' | 'tags' | 'status' | 'listIds' | 'metadata'
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'includes'
  value: any
}

/**
 * Manager de suscriptores
 */
export class SubscriberManager {
  private subscribers: Map<string, Subscriber> = new Map()
  private lists: Map<string, SubscriberList> = new Map()
  private segments: Map<string, Segment> = new Map()

  constructor() {
    logger.debug({ type: 'subscriber_manager_init' }, 'Subscriber Manager inicializado')
  }

  /**
   * Crear lista de suscriptores
   */
  createList(
    tenantId: string,
    data: { name: string; description?: string },
  ): SubscriberList {
    const list: SubscriberList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId,
      name: data.name,
      description: data.description,
      subscriberCount: 0,
      activeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.lists.set(list.id, list)

    logger.debug(
      { type: 'subscriber_list_created', listId: list.id, tenantId },
      `Lista de suscriptores creada: ${list.name}`,
    )

    return list
  }

  /**
   * Suscribir email a lista
   */
  subscribe(
    tenantId: string,
    email: string,
    listId: string,
    data?: {
      firstName?: string
      lastName?: string
      tags?: string[]
      preferences?: Subscriber['preferences']
      metadata?: Record<string, any>
    },
  ): Subscriber {
    const list = this.lists.get(listId)
    if (!list) {
      throw new Error(`Lista no encontrada: ${listId}`)
    }

    let subscriber = Array.from(this.subscribers.values()).find(
      (s) => s.email === email && s.tenantId === tenantId,
    )

    if (subscriber) {
      // Email ya existe, agregar a lista si no está
      if (!subscriber.listIds.includes(listId)) {
        subscriber.listIds.push(listId)
        subscriber.updatedAt = new Date()

        if (subscriber.status === 'active') {
          list.activeCount++
        }
      }
    } else {
      // Crear nuevo suscriptor
      subscriber = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        email,
        tenantId,
        firstName: data?.firstName,
        lastName: data?.lastName,
        status: 'active',
        listIds: [listId],
        tags: data?.tags || [],
        preferences: data?.preferences || {
          marketing: true,
          notifications: true,
          weekly_digest: false,
          personalizedOffers: true,
        },
        metadata: data?.metadata,
        engagementScore: 50,
        subscribedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.subscribers.set(subscriber.id, subscriber)
      list.subscriberCount++
      list.activeCount++
    }

    logger.debug(
      { type: 'subscriber_added', email, listId },
      `Suscriptor agregado a lista`,
    )

    return subscriber
  }

  /**
   * Desuscribir suscriptor
   */
  unsubscribe(subscriberId: string, reason?: string): Subscriber {
    const subscriber = this.subscribers.get(subscriberId)
    if (!subscriber) {
      throw new Error(`Suscriptor no encontrado: ${subscriberId}`)
    }

    subscriber.status = 'unsubscribed'
    subscriber.unsubscribedAt = new Date()
    subscriber.updatedAt = new Date()

    // Actualizar contadores de listas
    for (const listId of subscriber.listIds) {
      const list = this.lists.get(listId)
      if (list && list.activeCount > 0) {
        list.activeCount--
      }
    }

    logger.info(
      { type: 'subscriber_unsubscribed', subscriberId, email: subscriber.email, reason },
      `Suscriptor desuscrito: ${subscriber.email}`,
    )

    return subscriber
  }

  /**
   * Registrar bounce
   */
  recordBounce(email: string, bounceType: 'hard' | 'soft'): Subscriber | null {
    const subscriber = Array.from(this.subscribers.values()).find((s) => s.email === email)
    if (!subscriber) {
      return null
    }

    subscriber.status = bounceType === 'hard' ? 'bounced' : 'active'
    subscriber.bounceType = bounceType
    subscriber.bounceAt = new Date()
    subscriber.updatedAt = new Date()

    // Reducir engagement score
    subscriber.engagementScore = Math.max(0, subscriber.engagementScore - 20)

    logger.debug(
      { type: 'bounce_recorded', email, bounceType },
      `Bounce registrado: ${email}`,
    )

    return subscriber
  }

  /**
   * Actualizar engagement score
   */
  updateEngagement(subscriberId: string, action: 'opened' | 'clicked' | 'complained'): void {
    const subscriber = this.subscribers.get(subscriberId)
    if (!subscriber) return

    switch (action) {
      case 'opened':
        subscriber.engagementScore = Math.min(100, subscriber.engagementScore + 5)
        break
      case 'clicked':
        subscriber.engagementScore = Math.min(100, subscriber.engagementScore + 10)
        break
      case 'complained':
        subscriber.status = 'complaint'
        subscriber.engagementScore = Math.max(0, subscriber.engagementScore - 50)
        break
    }

    subscriber.lastEngaged = new Date()
    subscriber.updatedAt = new Date()

    logger.debug(
      { type: 'engagement_updated', subscriberId, action, score: subscriber.engagementScore },
      `Engagement actualizado`,
    )
  }

  /**
   * Crear segmento
   */
  createSegment(
    tenantId: string,
    data: {
      name: string
      description?: string
      rules: SegmentRule[]
    },
  ): Segment {
    const segment: Segment = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId,
      name: data.name,
      description: data.description,
      rules: data.rules,
      subscriberIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Evaluar reglas y obtener suscriptores
    segment.subscriberIds = this.evaluateSegment(segment)

    this.segments.set(segment.id, segment)

    logger.debug(
      { type: 'segment_created', segmentId: segment.id, subscriberCount: segment.subscriberIds.length },
      `Segmento creado: ${segment.name}`,
    )

    return segment
  }

  /**
   * Evaluar reglas de segmento
   */
  private evaluateSegment(segment: Segment): string[] {
    const matching: string[] = []

    for (const subscriber of this.subscribers.values()) {
      if (subscriber.tenantId !== segment.tenantId) continue

      let matchesAllRules = true

      for (const rule of segment.rules) {
        if (!this.evaluateRule(subscriber, rule)) {
          matchesAllRules = false
          break
        }
      }

      if (matchesAllRules) {
        matching.push(subscriber.id)
      }
    }

    return matching
  }

  /**
   * Evaluar una regla contra suscriptor
   */
  private evaluateRule(subscriber: Subscriber, rule: SegmentRule): boolean {
    const value = (subscriber as any)[rule.field]

    switch (rule.operator) {
      case 'equals':
        return value === rule.value

      case 'contains':
        return String(value).includes(rule.value)

      case 'greaterThan':
        return Number(value) > rule.value

      case 'lessThan':
        return Number(value) < rule.value

      case 'includes':
        return Array.isArray(value) && value.includes(rule.value)

      default:
        return false
    }
  }

  /**
   * Obtener suscriptores de segmento
   */
  getSegmentSubscribers(segmentId: string): Subscriber[] {
    const segment = this.segments.get(segmentId)
    if (!segment) {
      return []
    }

    return segment.subscriberIds
      .map((id) => this.subscribers.get(id))
      .filter((s) => s !== undefined) as Subscriber[]
  }

  /**
   * Limpiar lista (remover bounces hard)
   */
  cleanList(listId: string): { removed: number; active: number } {
    const list = this.lists.get(listId)
    if (!list) {
      throw new Error(`Lista no encontrada: ${listId}`)
    }

    let removed = 0

    for (const subscriber of this.subscribers.values()) {
      if (
        subscriber.listIds.includes(listId) &&
        subscriber.bounceType === 'hard' &&
        subscriber.status === 'bounced'
      ) {
        subscriber.listIds = subscriber.listIds.filter((id) => id !== listId)
        subscriber.status = 'cleaned'
        removed++

        if (list.activeCount > 0) {
          list.activeCount--
        }
      }
    }

    list.updatedAt = new Date()

    logger.info(
      { type: 'list_cleaned', listId, removed, remaining: list.activeCount },
      `Lista limpiada: ${removed} emails removidos`,
    )

    return {
      removed,
      active: list.activeCount,
    }
  }

  /**
   * Exportar lista
   */
  exportList(listId: string): { email: string; name?: string; status: string }[] {
    const list = this.lists.get(listId)
    if (!list) {
      return []
    }

    return Array.from(this.subscribers.values())
      .filter((s) => s.listIds.includes(listId))
      .map((s) => ({
        email: s.email,
        name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : undefined,
        status: s.status,
      }))
  }

  /**
   * Obtener estadísticas de lista
   */
  getListStats(listId: string): {
    name: string
    total: number
    active: number
    unsubscribed: number
    bounced: number
    avgEngagement: number
  } | null {
    const list = this.lists.get(listId)
    if (!list) return null

    const subscribers = Array.from(this.subscribers.values()).filter((s) =>
      s.listIds.includes(listId),
    )

    const unsubscribed = subscribers.filter((s) => s.status === 'unsubscribed').length
    const bounced = subscribers.filter((s) => s.status === 'bounced').length
    const avgEngagement =
      subscribers.length > 0
        ? subscribers.reduce((sum, s) => sum + s.engagementScore, 0) / subscribers.length
        : 0

    return {
      name: list.name,
      total: subscribers.length,
      active: list.activeCount,
      unsubscribed,
      bounced,
      avgEngagement: avgEngagement.toFixed(2) as any,
    }
  }
}

/**
 * Instancia global
 */
let globalManager: SubscriberManager | null = null

/**
 * Inicializar globalmente
 */
export function initializeSubscriberManager(): SubscriberManager {
  if (!globalManager) {
    globalManager = new SubscriberManager()
  }
  return globalManager
}

/**
 * Obtener manager global
 */
export function getSubscriberManager(): SubscriberManager {
  if (!globalManager) {
    return initializeSubscriberManager()
  }
  return globalManager
}
