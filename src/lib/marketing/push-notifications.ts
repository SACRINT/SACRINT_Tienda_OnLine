/**
 * Push Notifications & Web Push
 * Semana 37, Tarea 37.4: Push Notifications & Web Push
 */

import { logger } from '@/lib/monitoring'

export type PushChannel = 'web' | 'mobile' | 'email' | 'sms'

export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  image?: string
  actionUrl?: string
  channels: PushChannel[]
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  sentAt?: Date
  metrics: {
    sent: number
    delivered: number
    clicked: number
  }
}

export class PushNotificationManager {
  private notifications: Map<string, PushNotification> = new Map()
  private subscriptions: Map<string, Set<PushChannel>> = new Map()

  constructor() {
    logger.debug({ type: 'push_notification_init' }, 'Push Notification Manager inicializado')
  }

  /**
   * Crear notificación
   */
  createNotification(
    title: string,
    body: string,
    channels: PushChannel[],
    actionUrl?: string,
  ): PushNotification {
    const notification: PushNotification = {
      id: `push_${Date.now()}_${Math.random()}`,
      title,
      body,
      actionUrl,
      channels,
      status: 'draft',
      metrics: { sent: 0, delivered: 0, clicked: 0 },
    }

    this.notifications.set(notification.id, notification)
    return notification
  }

  /**
   * Enviar notificación
   */
  async sendNotification(notificationId: string, recipientIds: string[]): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    if (!notification) return false

    notification.status = 'sent'
    notification.sentAt = new Date()

    // Simular envío a múltiples canales
    let deliveredCount = 0
    for (const channel of notification.channels) {
      const channelDelivered = Math.floor(recipientIds.length * 0.95) // 95% delivery rate
      deliveredCount += channelDelivered
    }

    notification.metrics.sent = recipientIds.length
    notification.metrics.delivered = deliveredCount

    logger.info(
      { type: 'push_sent', notificationId, sent: notification.metrics.sent },
      `Push notification enviado: ${notification.title}`,
    )

    return true
  }

  /**
   * Registrar click
   */
  recordClick(notificationId: string): void {
    const notification = this.notifications.get(notificationId)
    if (notification) {
      notification.metrics.clicked++
    }
  }

  /**
   * Suscribir usuario a canal
   */
  subscribeToChannel(userId: string, channel: PushChannel): void {
    let channels = this.subscriptions.get(userId)
    if (!channels) {
      channels = new Set()
      this.subscriptions.set(userId, channels)
    }
    channels.add(channel)
  }

  /**
   * Desuscribir usuario
   */
  unsubscribeFromChannel(userId: string, channel: PushChannel): void {
    const channels = this.subscriptions.get(userId)
    if (channels) {
      channels.delete(channel)
    }
  }

  /**
   * Obtener notificación
   */
  getNotification(notificationId: string): PushNotification | null {
    return this.notifications.get(notificationId) || null
  }
}

let globalPushManager: PushNotificationManager | null = null

export function initializePushNotifications(): PushNotificationManager {
  if (!globalPushManager) {
    globalPushManager = new PushNotificationManager()
  }
  return globalPushManager
}

export function getPushNotifications(): PushNotificationManager {
  if (!globalPushManager) {
    return initializePushNotifications()
  }
  return globalPushManager
}
