/**
 * Campaign Performance Analytics
 * Semana 33, Tarea 33.2: Dashboard de performance de campañas
 */

import { logger } from '@/lib/monitoring'

export interface CampaignMetrics {
  campaignId: string
  campaignName: string
  period: { from: Date; to: Date }
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    unsubscribed: number
    bounced: number
    revenue: number
  }
  rates: {
    deliveryRate: number
    openRate: number
    clickRate: number
    unsubscribeRate: number
    bounceRate: number
    conversionRate: number
  }
  comparison?: {
    vs: 'previous_period' | 'same_period_last_year'
    change: Record<string, number>
  }
}

export class CampaignAnalytics {
  private metrics: Map<string, CampaignMetrics> = new Map()

  constructor() {
    logger.debug({ type: 'campaign_analytics_init' }, 'Campaign Analytics inicializado')
  }

  recordCampaignMetrics(metrics: CampaignMetrics): void {
    this.metrics.set(metrics.campaignId, metrics)

    logger.debug(
      { type: 'campaign_metrics_recorded', campaignId: metrics.campaignId },
      `Métricas de campaña registradas`,
    )
  }

  getCampaignMetrics(campaignId: string): CampaignMetrics | null {
    return this.metrics.get(campaignId) || null
  }

  comparePerformance(
    campaignId1: string,
    campaignId2: string,
  ): { comparison: string; winner: string; metrics: Record<string, number> } | null {
    const metrics1 = this.metrics.get(campaignId1)
    const metrics2 = this.metrics.get(campaignId2)

    if (!metrics1 || !metrics2) return null

    const comparison: Record<string, number> = {
      openRateDiff: metrics1.rates.openRate - metrics2.rates.openRate,
      clickRateDiff: metrics1.rates.clickRate - metrics2.rates.clickRate,
      conversionDiff: metrics1.rates.conversionRate - metrics2.rates.conversionRate,
    }

    let winner = 'tie'
    let winCount = 0

    for (const diff of Object.values(comparison)) {
      if (diff > 0) winCount++
      else if (diff < 0) winCount--
    }

    if (winCount > 0) winner = campaignId1
    else if (winCount < 0) winner = campaignId2

    return { comparison: 'Campaign Comparison', winner, metrics: comparison }
  }

  generateTopCampaigns(metric: 'openRate' | 'clickRate' | 'revenue', limit: number = 10): Array<{
    campaignName: string
    value: number
  }> {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.rates[metric] - a.rates[metric])
      .slice(0, limit)
      .map((m) => ({
        campaignName: m.campaignName,
        value: m.rates[metric],
      }))
  }

  getTrends(campaignId: string): {
    openTrend: number[]
    clickTrend: number[]
    revenueTrend: number[]
  } | null {
    const metrics = this.metrics.get(campaignId)
    if (!metrics) return null

    return {
      openTrend: [metrics.rates.openRate],
      clickTrend: [metrics.rates.clickRate],
      revenueTrend: [metrics.metrics.revenue],
    }
  }
}

let globalCampaignAnalytics: CampaignAnalytics | null = null

export function initializeCampaignAnalytics(): CampaignAnalytics {
  if (!globalCampaignAnalytics) {
    globalCampaignAnalytics = new CampaignAnalytics()
  }
  return globalCampaignAnalytics
}

export function getCampaignAnalytics(): CampaignAnalytics {
  if (!globalCampaignAnalytics) {
    return initializeCampaignAnalytics()
  }
  return globalCampaignAnalytics
}
