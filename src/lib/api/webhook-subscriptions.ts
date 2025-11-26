/**
 * Webhook Events & Subscriptions - Enhanced Version
 * Semana 38, Tarea 38.8: Webhook Events & Subscriptions
 */

import { logger } from '@/lib/monitoring'

export type WebhookEventType = 'order.*' | 'payment.*' | 'customer.*' | 'product.*' | 'campaign.*' | 'inventory.*' | 'user.*'

export interface WebhookSubscription {
  id: string
  userId: string
  eventTypes: WebhookEventType[]
  url: string
  active: boolean
  filters?: Record<string, any>
  retryPolicy?: RetryPolicy
  createdAt: Date
  updatedAt: Date
}

export interface RetryPolicy {
  maxAttempts: number
  initialDelayMs: number
  backoffMultiplier: number
  maxDelayMs: number
}

export interface WebhookEventData {
  id: string
  type: WebhookEventType
  timestamp: Date
  data: Record<string, any>
  correlationId?: string
  tenantId?: string
}

export interface WebhookDeliveryAttempt {
  id: string
  subscriptionId: string
  eventId: string
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  statusCode?: number
  responseBody?: string
  errorMessage?: string
  nextRetryAt?: Date
  attemptNumber: number
  createdAt: Date
}

export interface SubscriptionMetrics {
  totalSubscriptions: number
  activeSubscriptions: number
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  averageDeliveryTime: number
}

export class WebhookSubscriptionManager {
  private subscriptions: Map<string, WebhookSubscription> = new Map()
  private attempts: Map<string, WebhookDeliveryAttempt[]> = new Map()
  private eventQueue: WebhookEventData[] = []

  constructor() {
    logger.debug({ type: 'webhook_subscription_manager_init' }, 'Webhook Subscription Manager inicializado')
  }

  /**
   * Crear suscripción
   */
  createSubscription(
    userId: string,
    eventTypes: WebhookEventType[],
    url: string,
    retryPolicy?: RetryPolicy,
  ): WebhookSubscription {
    try {
      const subscription: WebhookSubscription = {
        id: `sub_${Date.now()}_${Math.random()}`,
        userId,
        eventTypes,
        url,
        active: true,
        retryPolicy: retryPolicy || {
          maxAttempts: 5,
          initialDelayMs: 1000,
          backoffMultiplier: 2,
          maxDelayMs: 300000, // 5 minutos
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.subscriptions.set(subscription.id, subscription)

      logger.info(
        { type: 'webhook_subscription_created', subscriptionId: subscription.id, userId, eventTypes: eventTypes.join(',') },
        `Suscripción webhook creada: ${subscription.id}`,
      )

      return subscription
    } catch (error) {
      logger.error({ type: 'subscription_creation_error', userId, error: String(error) }, 'Error al crear suscripción')
      throw error
    }
  }

  /**
   * Obtener suscripción
   */
  getSubscription(subscriptionId: string): WebhookSubscription | null {
    return this.subscriptions.get(subscriptionId) || null
  }

  /**
   * Obtener suscripciones del usuario
   */
  getUserSubscriptions(userId: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.userId === userId)
  }

  /**
   * Actualizar suscripción
   */
  updateSubscription(subscriptionId: string, updates: Partial<WebhookSubscription>): WebhookSubscription | null {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return null

    const updated = { ...subscription, ...updates, updatedAt: new Date() }
    this.subscriptions.set(subscriptionId, updated)

    logger.info({ type: 'webhook_subscription_updated', subscriptionId }, `Suscripción actualizada: ${subscriptionId}`)

    return updated
  }

  /**
   * Eliminar suscripción
   */
  deleteSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return false

    this.subscriptions.delete(subscriptionId)
    this.attempts.delete(subscriptionId)

    logger.info({ type: 'webhook_subscription_deleted', subscriptionId }, `Suscripción eliminada: ${subscriptionId}`)

    return true
  }

  /**
   * Publicar evento
   */
  publishEvent(event: WebhookEventData): void {
    try {
      this.eventQueue.push(event)

      // Encontrar suscripciones coincidentes
      const subscriptions = this.getMatchingSubscriptions(event.type)

      logger.info(
        { type: 'webhook_event_published', eventId: event.id, eventType: event.type, subscriptionCount: subscriptions.length },
        `Evento webhook publicado: ${event.type}`,
      )

      // Procesar entregas
      this.processDeliveries(event, subscriptions)
    } catch (error) {
      logger.error({ type: 'event_publish_error', eventType: event.type, error: String(error) }, 'Error al publicar evento')
    }
  }

  /**
   * Obtener suscripciones coincidentes
   */
  private getMatchingSubscriptions(eventType: WebhookEventType): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter((sub) => {
      if (!sub.active) return false

      return sub.eventTypes.some((pattern) => this.matchesPattern(eventType, pattern))
    })
  }

  /**
   * Verificar si el tipo de evento coincide con el patrón
   */
  private matchesPattern(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2)
      return eventType.startsWith(prefix + '.')
    }
    return eventType === pattern
  }

  /**
   * Procesar entregas
   */
  private processDeliveries(event: WebhookEventData, subscriptions: WebhookSubscription[]): void {
    for (const subscription of subscriptions) {
      const attempt: WebhookDeliveryAttempt = {
        id: `attempt_${Date.now()}_${Math.random()}`,
        subscriptionId: subscription.id,
        eventId: event.id,
        status: 'pending',
        attemptNumber: 1,
        createdAt: new Date(),
      }

      let attempts = this.attempts.get(subscription.id) || []
      attempts.push(attempt)
      this.attempts.set(subscription.id, attempts)
    }
  }

  /**
   * Registrar intento de entrega
   */
  recordDeliveryAttempt(subscriptionId: string, eventId: string, statusCode?: number, error?: string): void {
    const attempts = this.attempts.get(subscriptionId) || []
    const attempt = attempts.find((a) => a.eventId === eventId && a.status === 'pending')

    if (attempt) {
      attempt.statusCode = statusCode
      attempt.errorMessage = error

      if (statusCode && statusCode >= 200 && statusCode < 300) {
        attempt.status = 'delivered'
      } else {
        attempt.status = 'failed'

        // Programar reintento
        const subscription = this.getSubscription(subscriptionId)
        if (subscription && subscription.retryPolicy && attempt.attemptNumber < subscription.retryPolicy.maxAttempts) {
          const delay = Math.min(
            subscription.retryPolicy.initialDelayMs * Math.pow(subscription.retryPolicy.backoffMultiplier, attempt.attemptNumber - 1),
            subscription.retryPolicy.maxDelayMs,
          )

          attempt.nextRetryAt = new Date(Date.now() + delay)
          attempt.attemptNumber++
        }
      }

      logger.info(
        { type: 'delivery_attempt_recorded', subscriptionId, eventId, status: attempt.status, statusCode },
        `Intento de entrega registrado: ${attempt.status}`,
      )
    }
  }

  /**
   * Obtener intentos de entrega
   */
  getDeliveryAttempts(subscriptionId: string, eventId?: string): WebhookDeliveryAttempt[] {
    const attempts = this.attempts.get(subscriptionId) || []
    return eventId ? attempts.filter((a) => a.eventId === eventId) : attempts
  }

  /**
   * Obtener eventos pendientes de reintento
   */
  getPendingRetries(): WebhookDeliveryAttempt[] {
    const allAttempts: WebhookDeliveryAttempt[] = []

    for (const attempts of this.attempts.values()) {
      allAttempts.push(...attempts)
    }

    const now = new Date()
    return allAttempts.filter((a) => a.status === 'failed' && a.nextRetryAt && a.nextRetryAt <= now)
  }

  /**
   * Obtener estadísticas de métricas
   */
  getMetrics(): SubscriptionMetrics {
    const subscriptions = Array.from(this.subscriptions.values())
    let totalDeliveries = 0
    let successfulDeliveries = 0
    let failedDeliveries = 0
    let totalDeliveryTime = 0
    let deliveryCount = 0

    for (const attempts of this.attempts.values()) {
      for (const attempt of attempts) {
        totalDeliveries++
        if (attempt.status === 'delivered') {
          successfulDeliveries++
          if (attempt.responseBody) {
            deliveryCount++
          }
        } else if (attempt.status === 'failed') {
          failedDeliveries++
        }
      }
    }

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.active).length,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      averageDeliveryTime: deliveryCount > 0 ? totalDeliveryTime / deliveryCount : 0,
    }
  }

  /**
   * Activar suscripción
   */
  activateSubscription(subscriptionId: string): boolean {
    const subscription = this.getSubscription(subscriptionId)
    if (!subscription) return false

    subscription.active = true
    subscription.updatedAt = new Date()

    logger.info({ type: 'subscription_activated', subscriptionId }, `Suscripción activada: ${subscriptionId}`)
    return true
  }

  /**
   * Desactivar suscripción
   */
  deactivateSubscription(subscriptionId: string): boolean {
    const subscription = this.getSubscription(subscriptionId)
    if (!subscription) return false

    subscription.active = false
    subscription.updatedAt = new Date()

    logger.info({ type: 'subscription_deactivated', subscriptionId }, `Suscripción desactivada: ${subscriptionId}`)
    return true
  }
}

let globalWebhookSubscriptionManager: WebhookSubscriptionManager | null = null

export function initializeWebhookSubscriptionManager(): WebhookSubscriptionManager {
  if (!globalWebhookSubscriptionManager) {
    globalWebhookSubscriptionManager = new WebhookSubscriptionManager()
  }
  return globalWebhookSubscriptionManager
}

export function getWebhookSubscriptionManager(): WebhookSubscriptionManager {
  if (!globalWebhookSubscriptionManager) {
    return initializeWebhookSubscriptionManager()
  }
  return globalWebhookSubscriptionManager
}
