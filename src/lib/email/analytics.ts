/**
 * Email Analytics y Event Tracking
 * Semana 32, Tarea 32.4: Analítica completa y rastreo de eventos de email
 */

import { logger } from '@/lib/monitoring'

/**
 * Evento de email
 */
export interface EmailEvent {
  id: string
  campaignId: string
  subscriberId: string
  email: string
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed'
  timestamp: Date
  metadata?: {
    url?: string
    userAgent?: string
    ipAddress?: string
    location?: string
  }
}

/**
 * Estadísticas de email
 */
export interface EmailStats {
  campaignId: string
  period: { from: Date; to: Date }
  events: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    unsubscribed: number
  }
  rates: {
    deliveryRate: number
    openRate: number
    clickRate: number
    bounceRate: number
    complaintRate: number
    unsubscribeRate: number
  }
  engagement: {
    avgOpensPerRecipient: number
    avgClicksPerRecipient: number
    uniqueOpeners: number
    uniqueClickers: number
  }
}

/**
 * Tracker de eventos
 */
export class EmailAnalyticsTracker {
  private events: Map<string, EmailEvent> = new Map()
  private maxEventsHistory = 100000

  constructor() {
    logger.debug({ type: 'email_analytics_init' }, 'Email Analytics Tracker inicializado')
  }

  /**
   * Registrar evento
   */
  recordEvent(data: Omit<EmailEvent, 'id'>): EmailEvent {
    const event: EmailEvent = {
      ...data,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }

    this.events.set(event.id, event)

    // Mantener límite
    if (this.events.size > this.maxEventsHistory) {
      const firstKey = Array.from(this.events.keys())[0]
      this.events.delete(firstKey)
    }

    logger.debug(
      {
        type: 'email_event_recorded',
        eventType: data.eventType,
        campaignId: data.campaignId,
        email: data.email,
      },
      `Evento registrado: ${data.eventType}`,
    )

    return event
  }

  /**
   * Obtener estadísticas de campaña
   */
  getCampaignStats(campaignId: string, from: Date, to: Date): EmailStats {
    const campaignEvents = Array.from(this.events.values()).filter(
      (e) => e.campaignId === campaignId && e.timestamp >= from && e.timestamp <= to,
    )

    const events = {
      sent: campaignEvents.filter((e) => e.eventType === 'sent').length,
      delivered: campaignEvents.filter((e) => e.eventType === 'delivered').length,
      opened: campaignEvents.filter((e) => e.eventType === 'opened').length,
      clicked: campaignEvents.filter((e) => e.eventType === 'clicked').length,
      bounced: campaignEvents.filter((e) => e.eventType === 'bounced').length,
      complained: campaignEvents.filter((e) => e.eventType === 'complained').length,
      unsubscribed: campaignEvents.filter((e) => e.eventType === 'unsubscribed').length,
    }

    const total = events.sent || 1

    const uniqueOpeners = new Set(
      campaignEvents.filter((e) => e.eventType === 'opened').map((e) => e.email),
    ).size

    const uniqueClickers = new Set(
      campaignEvents.filter((e) => e.eventType === 'clicked').map((e) => e.email),
    ).size

    const uniqueDelivered = new Set(
      campaignEvents.filter((e) => e.eventType === 'delivered').map((e) => e.email),
    ).size

    return {
      campaignId,
      period: { from, to },
      events,
      rates: {
        deliveryRate: (events.delivered / total) * 100,
        openRate: (events.opened / Math.max(1, uniqueDelivered)) * 100,
        clickRate: (events.clicked / Math.max(1, uniqueDelivered)) * 100,
        bounceRate: (events.bounced / total) * 100,
        complaintRate: (events.complained / total) * 100,
        unsubscribeRate: (events.unsubscribed / total) * 100,
      },
      engagement: {
        avgOpensPerRecipient: uniqueDelivered > 0 ? events.opened / uniqueDelivered : 0,
        avgClicksPerRecipient: uniqueDelivered > 0 ? events.clicked / uniqueDelivered : 0,
        uniqueOpeners,
        uniqueClickers,
      },
    }
  }

  /**
   * Obtener eventos recientes de suscriptor
   */
  getSubscriberEvents(subscriberId: string, limit: number = 50): EmailEvent[] {
    return Array.from(this.events.values())
      .filter((e) => e.subscriberId === subscriberId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Obtener eventos de campaña
   */
  getCampaignEvents(campaignId: string, eventType?: string): EmailEvent[] {
    return Array.from(this.events.values()).filter(
      (e) => e.campaignId === campaignId && (!eventType || e.eventType === eventType),
    )
  }

  /**
   * Calcular inactividad
   */
  getInactiveSubscribers(campaignId: string, daysThreshold: number = 30): string[] {
    const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000)
    const campaignEvents = Array.from(this.events.values()).filter(
      (e) => e.campaignId === campaignId,
    )

    const subscriberLastActivity = new Map<string, Date>()

    for (const event of campaignEvents) {
      const lastDate = subscriberLastActivity.get(event.subscriberId)
      if (!lastDate || event.timestamp > lastDate) {
        subscriberLastActivity.set(event.subscriberId, event.timestamp)
      }
    }

    return Array.from(subscriberLastActivity.entries())
      .filter(([_, lastActivity]) => lastActivity < cutoffDate)
      .map(([subscriberId, _]) => subscriberId)
  }

  /**
   * Generar reporte de engagement
   */
  generateEngagementReport(campaignId: string): string {
    const stats = this.getCampaignStats(campaignId, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date())

    let report = 'Email Campaign Engagement Report\n'
    report += '=================================\n\n'

    report += `Campaign ID: ${campaignId}\n`
    report += `Period: ${stats.period.from.toLocaleDateString()} - ${stats.period.to.toLocaleDateString()}\n\n`

    report += `Delivery Metrics:\n`
    report += `  Sent: ${stats.events.sent}\n`
    report += `  Delivered: ${stats.events.delivered} (${stats.rates.deliveryRate.toFixed(2)}%)\n`
    report += `  Bounced: ${stats.events.bounced} (${stats.rates.bounceRate.toFixed(2)}%)\n\n`

    report += `Engagement Metrics:\n`
    report += `  Opens: ${stats.events.opened} (${stats.rates.openRate.toFixed(2)}%)\n`
    report += `  Unique Openers: ${stats.engagement.uniqueOpeners}\n`
    report += `  Avg Opens/Recipient: ${stats.engagement.avgOpensPerRecipient.toFixed(2)}\n\n`

    report += `Interaction Metrics:\n`
    report += `  Clicks: ${stats.events.clicked} (${stats.rates.clickRate.toFixed(2)}%)\n`
    report += `  Unique Clickers: ${stats.engagement.uniqueClickers}\n`
    report += `  Avg Clicks/Recipient: ${stats.engagement.avgClicksPerRecipient.toFixed(2)}\n\n`

    report += `Negative Events:\n`
    report += `  Complaints: ${stats.events.complained} (${stats.rates.complaintRate.toFixed(2)}%)\n`
    report += `  Unsubscribes: ${stats.events.unsubscribed} (${stats.rates.unsubscribeRate.toFixed(2)}%)\n`

    return report
  }

  /**
   * Obtener tendencias
   */
  getTrends(campaignId: string, days: number = 30): Array<{ date: string; opens: number; clicks: number }> {
    const now = new Date()
    const trends: Record<string, { opens: number; clicks: number }> = {}

    const campaignEvents = Array.from(this.events.values()).filter(
      (e) => e.campaignId === campaignId && now.getTime() - e.timestamp.getTime() < days * 24 * 60 * 60 * 1000,
    )

    for (const event of campaignEvents) {
      const date = event.timestamp.toLocaleDateString()

      if (!trends[date]) {
        trends[date] = { opens: 0, clicks: 0 }
      }

      if (event.eventType === 'opened') trends[date].opens++
      if (event.eventType === 'clicked') trends[date].clicks++
    }

    return Object.entries(trends)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
  }

  /**
   * Limpiar eventos antiguos
   */
  cleanupOldEvents(olderThanDays: number = 90): number {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    let removed = 0

    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoffDate) {
        this.events.delete(id)
        removed++
      }
    }

    if (removed > 0) {
      logger.debug(
        { type: 'email_events_cleanup', removed },
        `Limpiados ${removed} eventos antiguos`,
      )
    }

    return removed
  }
}

/**
 * Instancia global
 */
let globalTracker: EmailAnalyticsTracker | null = null

/**
 * Inicializar globalmente
 */
export function initializeEmailAnalyticsTracker(): EmailAnalyticsTracker {
  if (!globalTracker) {
    globalTracker = new EmailAnalyticsTracker()
  }
  return globalTracker
}

/**
 * Obtener tracker global
 */
export function getEmailAnalyticsTracker(): EmailAnalyticsTracker {
  if (!globalTracker) {
    return initializeEmailAnalyticsTracker()
  }
  return globalTracker
}
