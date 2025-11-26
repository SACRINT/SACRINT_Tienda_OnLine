/**
 * Email Deliverability & Health Analytics
 * Semana 33, Tarea 33.7: Analytics de entregabilidad
 */

import { logger } from '@/lib/monitoring'

export interface DeliverabilityMetrics {
  period: { from: Date; to: Date }
  sent: number
  delivered: number
  bounced: number
  complained: number
  repBlacklisted: boolean
  domainReputation: number
  authenticatedEmails: number
  spfScore: number
  dkimScore: number
  dmarcScore: number
  inboxPlacement: number
}

export class DeliverabilityAnalytics {
  private metrics: Map<string, DeliverabilityMetrics> = new Map()

  constructor() {
    logger.debug({ type: 'deliverability_analytics_init' }, 'Deliverability Analytics inicializado')
  }

  recordMetrics(domain: string, metrics: DeliverabilityMetrics): void {
    this.metrics.set(domain, metrics)
  }

  getHealthScore(domain: string): { score: number; status: string; recommendations: string[] } {
    const metrics = this.metrics.get(domain)
    if (!metrics) return { score: 0, status: 'unknown', recommendations: [] }

    let score = 0
    const recommendations: string[] = []

    // Deliverability rate
    const deliveryRate = metrics.delivered / Math.max(1, metrics.sent)
    score += deliveryRate * 30

    // Authentication
    if (metrics.spfScore >= 85) score += 10
    else recommendations.push('Improve SPF configuration')

    if (metrics.dkimScore >= 85) score += 10
    else recommendations.push('Improve DKIM configuration')

    if (metrics.dmarcScore >= 85) score += 10
    else recommendations.push('Improve DMARC policy')

    // Reputation
    score += metrics.domainReputation / 100 * 20

    // Inbox placement
    score += metrics.inboxPlacement / 100 * 10

    const status = score >= 80 ? 'Healthy' : score >= 60 ? 'Caution' : 'Poor'

    return { score: Math.round(score), status, recommendations }
  }

  detectTrends(domain: string): {
    deliveryTrend: 'improving' | 'declining' | 'stable'
    reputationTrend: 'improving' | 'declining' | 'stable'
  } {
    return { deliveryTrend: 'stable', reputationTrend: 'stable' }
  }
}

let globalDeliverabilityAnalytics: DeliverabilityAnalytics | null = null

export function initializeDeliverabilityAnalytics(): DeliverabilityAnalytics {
  if (!globalDeliverabilityAnalytics) {
    globalDeliverabilityAnalytics = new DeliverabilityAnalytics()
  }
  return globalDeliverabilityAnalytics
}

export function getDeliverabilityAnalytics(): DeliverabilityAnalytics {
  if (!globalDeliverabilityAnalytics) {
    return initializeDeliverabilityAnalytics()
  }
  return globalDeliverabilityAnalytics
}
