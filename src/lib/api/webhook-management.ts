/**
 * Webhook Management & Events System
 * Semana 38, Tareas 38.1, 38.8: Webhook Management & Events
 */

import { logger } from '@/lib/monitoring'
import crypto from 'crypto'

export type WebhookEvent = 'order.created' | 'order.updated' | 'payment.succeeded' | 'payment.failed' | 'customer.created' | 'product.updated' | 'campaign.sent'

export interface Webhook {
  id: string
  url: string
  events: WebhookEvent[]
  active: boolean
  secret: string
  createdAt: Date
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: Record<string, any>
  status: 'pending' | 'delivered' | 'failed'
  attempts: number
  lastAttemptAt?: Date
  deliveredAt?: Date
}

export class WebhookManager {
  private webhooks: Map<string, Webhook> = new Map()
  private deliveries: Map<string, WebhookDelivery[]> = new Map()
  private eventSubscribers: Map<WebhookEvent, Set<string>> = new Map() // event -> Set<webhookId>

  constructor() {
    logger.debug({ type: 'webhook_manager_init' }, 'Webhook Manager inicializado')
  }

  /**
   * Registrar webhook
   */
  registerWebhook(url: string, events: WebhookEvent[], active: boolean = true): Webhook {
    const secret = crypto.randomBytes(32).toString('hex')

    const webhook: Webhook = {
      id: `wh_${Date.now()}_${Math.random()}`,
      url,
      events,
      active,
      secret,
      createdAt: new Date(),
    }

    this.webhooks.set(webhook.id, webhook)

    // Registrar en subscriptores
    for (const event of events) {
      let subscribers = this.eventSubscribers.get(event)
      if (!subscribers) {
        subscribers = new Set()
        this.eventSubscribers.set(event, subscribers)
      }
      subscribers.add(webhook.id)
    }

    logger.info({ type: 'webhook_registered', webhookId: webhook.id, url, eventCount: events.length }, 'Webhook registrado')

    return webhook
  }

  /**
   * Disparar evento
   */
  async triggerEvent(event: WebhookEvent, payload: Record<string, any>): Promise<string[]> {
    const subscribers = this.eventSubscribers.get(event) || new Set()
    const deliveredIds: string[] = []

    for (const webhookId of subscribers) {
      const webhook = this.webhooks.get(webhookId)
      if (!webhook || !webhook.active) continue

      const delivery = await this.deliverWebhook(webhook, event, payload)
      if (delivery.status === 'delivered') {
        deliveredIds.push(delivery.id)
      }
    }

    logger.info({ type: 'event_triggered', event, webhookCount: deliveredIds.length }, `Evento disparado: ${event}`)

    return deliveredIds
  }

  /**
   * Entregar webhook
   */
  private async deliverWebhook(webhook: Webhook, event: WebhookEvent, payload: Record<string, any>): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: `whd_${Date.now()}_${Math.random()}`,
      webhookId: webhook.id,
      event,
      payload,
      status: 'pending',
      attempts: 0,
    }

    let deliveries = this.deliveries.get(webhook.id) || []
    deliveries.push(delivery)
    this.deliveries.set(webhook.id, deliveries)

    try {
      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret)
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
      }

      // Simular HTTP POST
      delivery.attempts++
      delivery.lastAttemptAt = new Date()
      delivery.status = 'delivered'
      delivery.deliveredAt = new Date()

      logger.debug(
        { type: 'webhook_delivered', webhookId: webhook.id, event },
        `Webhook entregado: ${event}`,
      )
    } catch (error) {
      delivery.status = 'failed'
      logger.error({ type: 'webhook_delivery_failed', webhookId: webhook.id, error: String(error) }, 'Error al entregar webhook')
    }

    return delivery
  }

  /**
   * Generar firma HMAC
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  /**
   * Obtener entregas de webhook
   */
  getDeliveryHistory(webhookId: string, limit: number = 50): WebhookDelivery[] {
    const deliveries = this.deliveries.get(webhookId) || []
    return deliveries.slice(-limit)
  }

  /**
   * Reintentar entrega fallida
   */
  async retryDelivery(deliveryId: string): Promise<boolean> {
    for (const deliveries of this.deliveries.values()) {
      const delivery = deliveries.find((d) => d.id === deliveryId)
      if (delivery) {
        const webhook = this.webhooks.get(delivery.webhookId)
        if (webhook) {
          const retried = await this.deliverWebhook(webhook, delivery.event, delivery.payload)
          return retried.status === 'delivered'
        }
      }
    }
    return false
  }

  /**
   * Obtener webhook
   */
  getWebhook(webhookId: string): Webhook | null {
    return this.webhooks.get(webhookId) || null
  }

  /**
   * Actualizar webhook
   */
  updateWebhook(webhookId: string, updates: Partial<Webhook>): Webhook | null {
    const webhook = this.webhooks.get(webhookId)
    if (!webhook) return null

    Object.assign(webhook, updates)
    return webhook
  }

  /**
   * Eliminar webhook
   */
  deleteWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId)
    if (!webhook) return false

    for (const event of webhook.events) {
      const subscribers = this.eventSubscribers.get(event)
      if (subscribers) {
        subscribers.delete(webhookId)
      }
    }

    this.webhooks.delete(webhookId)
    logger.info({ type: 'webhook_deleted', webhookId }, 'Webhook eliminado')

    return true
  }

  /**
   * Obtener estadísticas
   */
  getWebhookStats(webhookId: string): {
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    successRate: number
  } | null {
    const deliveries = this.deliveries.get(webhookId) || []

    const successful = deliveries.filter((d) => d.status === 'delivered').length
    const failed = deliveries.filter((d) => d.status === 'failed').length
    const successRate = deliveries.length > 0 ? (successful / deliveries.length) * 100 : 0

    return {
      totalDeliveries: deliveries.length,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      successRate: Math.round(successRate),
    }
  }
}

let globalWebhookManager: WebhookManager | null = null

export function initializeWebhookManager(): WebhookManager {
  if (!globalWebhookManager) {
    globalWebhookManager = new WebhookManager()
  }
  return globalWebhookManager
}

export function getWebhookManager(): WebhookManager {
  if (!globalWebhookManager) {
    return initializeWebhookManager()
  }
  return globalWebhookManager
}
