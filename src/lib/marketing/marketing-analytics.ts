/**
 * Marketing Analytics & Attribution
 * Semana 37, Tarea 37.12: Marketing Analytics & Attribution
 */

import { logger } from '@/lib/monitoring'

export type AttributionModel = 'first-touch' | 'last-touch' | 'linear' | 'time-decay' | 'multi-touch'

export interface MarketingMetrics {
  channel: string
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  conversionRate: number
  roi: number
}

export interface CustomerJourney {
  customerId: string
  touchpoints: Array<{
    channel: string
    timestamp: Date
    value?: number
  }>
  firstTouchChannel: string
  lastTouchChannel: string
  conversionValue: number
}

export interface AttributionReport {
  period: { from: Date; to: Date }
  model: AttributionModel
  channelAttribution: Record<string, number>
  totalRevenue: number
  topChannel: string
}

export class MarketingAnalyticsManager {
  private metrics: Map<string, MarketingMetrics> = new Map()
  private journeys: Map<string, CustomerJourney> = new Map()
  private attributionReports: Map<string, AttributionReport> = new Map()

  constructor() {
    logger.debug({ type: 'marketing_analytics_init' }, 'Marketing Analytics Manager inicializado')
  }

  /**
   * Registrar métrica de canal
   */
  recordChannelMetrics(
    channel: string,
    impressions: number,
    clicks: number,
    conversions: number,
    revenue: number,
  ): MarketingMetrics {
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
    const costPerConversion = conversions > 0 ? 50 : 0 // Estimado
    const roi = costPerConversion > 0 ? ((revenue - costPerConversion * conversions) / (costPerConversion * conversions)) * 100 : 0

    const metrics: MarketingMetrics = {
      channel,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr: Math.round(ctr * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      roi: Math.round(roi * 100) / 100,
    }

    this.metrics.set(channel, metrics)

    logger.debug(
      { type: 'channel_metrics', channel, conversions, revenue },
      `Métricas registradas para ${channel}`,
    )

    return metrics
  }

  /**
   * Registrar journy del cliente
   */
  recordCustomerJourney(customerId: string, touchpoints: CustomerJourney['touchpoints'], conversionValue: number): CustomerJourney {
    const journey: CustomerJourney = {
      customerId,
      touchpoints: touchpoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      firstTouchChannel: touchpoints.length > 0 ? touchpoints[0].channel : '',
      lastTouchChannel: touchpoints.length > 0 ? touchpoints[touchpoints.length - 1].channel : '',
      conversionValue,
    }

    this.journeys.set(customerId, journey)

    logger.debug(
      { type: 'customer_journey_recorded', customerId, touchpointCount: touchpoints.length },
      `Journey del cliente registrado`,
    )

    return journey
  }

  /**
   * Generar reporte de atribución
   */
  generateAttributionReport(model: AttributionModel, from: Date, to: Date): AttributionReport {
    const relevantJourneys = Array.from(this.journeys.values()).filter(
      (j) => j.touchpoints.some((t) => t.timestamp >= from && t.timestamp <= to),
    )

    const channelAttribution: Record<string, number> = {}
    let totalRevenue = 0

    for (const journey of relevantJourneys) {
      totalRevenue += journey.conversionValue

      switch (model) {
        case 'first-touch':
          if (journey.firstTouchChannel) {
            channelAttribution[journey.firstTouchChannel] = (channelAttribution[journey.firstTouchChannel] || 0) + journey.conversionValue
          }
          break

        case 'last-touch':
          if (journey.lastTouchChannel) {
            channelAttribution[journey.lastTouchChannel] = (channelAttribution[journey.lastTouchChannel] || 0) + journey.conversionValue
          }
          break

        case 'linear':
          const linearShare = journey.conversionValue / journey.touchpoints.length
          for (const tp of journey.touchpoints) {
            channelAttribution[tp.channel] = (channelAttribution[tp.channel] || 0) + linearShare
          }
          break

        case 'time-decay':
          const decayShare = journey.conversionValue / (journey.touchpoints.length * (journey.touchpoints.length + 1) / 2)
          for (let i = 0; i < journey.touchpoints.length; i++) {
            const weight = (i + 1) / journey.touchpoints.length
            channelAttribution[journey.touchpoints[i].channel] = (channelAttribution[journey.touchpoints[i].channel] || 0) + decayShare * weight
          }
          break

        case 'multi-touch':
          // 40% first, 40% last, 20% middle
          if (journey.touchpoints.length === 1) {
            channelAttribution[journey.firstTouchChannel] = (channelAttribution[journey.firstTouchChannel] || 0) + journey.conversionValue
          } else if (journey.touchpoints.length === 2) {
            channelAttribution[journey.firstTouchChannel] = (channelAttribution[journey.firstTouchChannel] || 0) + journey.conversionValue * 0.5
            channelAttribution[journey.lastTouchChannel] = (channelAttribution[journey.lastTouchChannel] || 0) + journey.conversionValue * 0.5
          } else {
            channelAttribution[journey.firstTouchChannel] = (channelAttribution[journey.firstTouchChannel] || 0) + journey.conversionValue * 0.4
            channelAttribution[journey.lastTouchChannel] = (channelAttribution[journey.lastTouchChannel] || 0) + journey.conversionValue * 0.4
            const middleShare = journey.conversionValue * 0.2 / (journey.touchpoints.length - 2)
            for (let i = 1; i < journey.touchpoints.length - 1; i++) {
              channelAttribution[journey.touchpoints[i].channel] = (channelAttribution[journey.touchpoints[i].channel] || 0) + middleShare
            }
          }
          break
      }
    }

    const topChannel = Object.entries(channelAttribution).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    const report: AttributionReport = {
      period: { from, to },
      model,
      channelAttribution,
      totalRevenue,
      topChannel,
    }

    this.attributionReports.set(`${model}_${from.toISOString()}`, report)

    logger.info(
      { type: 'attribution_report_generated', model, totalRevenue, topChannel },
      `Reporte de atribución generado`,
    )

    return report
  }

  /**
   * Obtener métricas de canal
   */
  getChannelMetrics(channel: string): MarketingMetrics | null {
    return this.metrics.get(channel) || null
  }

  /**
   * Obtener todos los canales
   */
  getAllChannelMetrics(): MarketingMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Análisis de performance
   */
  getPerformanceAnalysis(): {
    bestPerformingChannel: string
    worstPerformingChannel: string
    averageCtr: number
    averageConversionRate: number
    totalRevenue: number
  } {
    const metrics = this.getAllChannelMetrics()

    if (metrics.length === 0) {
      return {
        bestPerformingChannel: '',
        worstPerformingChannel: '',
        averageCtr: 0,
        averageConversionRate: 0,
        totalRevenue: 0,
      }
    }

    const best = metrics.reduce((a, b) => (a.roi > b.roi ? a : b))
    const worst = metrics.reduce((a, b) => (a.roi < b.roi ? a : b))
    const avgCtr = metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length
    const avgConv = metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length
    const totalRev = metrics.reduce((sum, m) => sum + m.revenue, 0)

    return {
      bestPerformingChannel: best.channel,
      worstPerformingChannel: worst.channel,
      averageCtr: Math.round(avgCtr * 100) / 100,
      averageConversionRate: Math.round(avgConv * 100) / 100,
      totalRevenue: totalRev,
    }
  }
}

let globalMarketingAnalytics: MarketingAnalyticsManager | null = null

export function initializeMarketingAnalytics(): MarketingAnalyticsManager {
  if (!globalMarketingAnalytics) {
    globalMarketingAnalytics = new MarketingAnalyticsManager()
  }
  return globalMarketingAnalytics
}

export function getMarketingAnalytics(): MarketingAnalyticsManager {
  if (!globalMarketingAnalytics) {
    return initializeMarketingAnalytics()
  }
  return globalMarketingAnalytics
}
