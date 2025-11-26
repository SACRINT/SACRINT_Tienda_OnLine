/**
 * Subscriber Insights & Behavior Analytics
 * Semana 33, Tarea 33.3: Analytics de comportamiento de suscriptores
 */

import { logger } from '@/lib/monitoring'

export interface SubscriberBehavior {
  subscriberId: string
  email: string
  engagementScore: number
  lastActivity: Date
  totalEmails: number
  opens: number
  clicks: number
  conversions: number
  revenue: number
  status: 'highly_engaged' | 'engaged' | 'at_risk' | 'inactive'
  segments: string[]
  predictedChurn: boolean
  churnProbability: number
}

export class SubscriberAnalytics {
  private behaviors: Map<string, SubscriberBehavior> = new Map()

  constructor() {
    logger.debug({ type: 'subscriber_analytics_init' }, 'Subscriber Analytics inicializado')
  }

  recordBehavior(behavior: SubscriberBehavior): void {
    this.behaviors.set(behavior.subscriberId, behavior)
  }

  getAtRiskSubscribers(threshold: number = 70): SubscriberBehavior[] {
    return Array.from(this.behaviors.values())
      .filter((b) => b.churnProbability >= threshold && b.status === 'at_risk')
      .sort((a, b) => b.churnProbability - a.churnProbability)
  }

  getEngagementDistribution(): Record<string, number> {
    const dist: Record<string, number> = {
      highly_engaged: 0,
      engaged: 0,
      at_risk: 0,
      inactive: 0,
    }

    for (const behavior of this.behaviors.values()) {
      dist[behavior.status]++
    }

    return dist
  }

  generateSegmentInsights(segment: string): {
    subscriberCount: number
    avgEngagement: number
    totalRevenue: number
    churnRisk: number
  } {
    const segmentBehaviors = Array.from(this.behaviors.values()).filter((b) => b.segments.includes(segment))

    const avgEngagement = segmentBehaviors.length > 0
      ? segmentBehaviors.reduce((sum, b) => sum + b.engagementScore, 0) / segmentBehaviors.length
      : 0

    const totalRevenue = segmentBehaviors.reduce((sum, b) => sum + b.revenue, 0)
    const churnRisk = segmentBehaviors.filter((b) => b.predictedChurn).length

    return {
      subscriberCount: segmentBehaviors.length,
      avgEngagement,
      totalRevenue,
      churnRisk,
    }
  }

  predictChurn(subscriberId: string): boolean {
    const behavior = this.behaviors.get(subscriberId)
    if (!behavior) return false

    return (
      behavior.engagementScore < 40 &&
      (!behavior.lastActivity || Date.now() - behavior.lastActivity.getTime() > 30 * 24 * 60 * 60 * 1000)
    )
  }
}

let globalSubscriberAnalytics: SubscriberAnalytics | null = null

export function initializeSubscriberAnalytics(): SubscriberAnalytics {
  if (!globalSubscriberAnalytics) {
    globalSubscriberAnalytics = new SubscriberAnalytics()
  }
  return globalSubscriberAnalytics
}

export function getSubscriberAnalytics(): SubscriberAnalytics {
  if (!globalSubscriberAnalytics) {
    return initializeSubscriberAnalytics()
  }
  return globalSubscriberAnalytics
}
