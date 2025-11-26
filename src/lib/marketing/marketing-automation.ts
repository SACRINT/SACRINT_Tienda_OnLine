/**
 * Advanced Marketing Automation & Campaigns
 * Semana 37, Tarea 37.1: Advanced Marketing Automation & Campaigns
 */

import { logger } from '@/lib/monitoring'

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived'
export type CampaignType = 'email' | 'sms' | 'push' | 'social' | 'retargeting' | 'content'
export type AudienceCondition = 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'exists'

export interface CampaignSegment {
  name: string
  conditions: Array<{
    field: string
    operator: AudienceCondition
    value: any
    logic?: 'AND' | 'OR'
  }>
  estimatedSize: number
}

export interface Campaign {
  id: string
  name: string
  description?: string
  type: CampaignType
  status: CampaignStatus
  segment: CampaignSegment
  content: {
    subject?: string
    body: string
    cta?: { text: string; url: string }
    image?: string
  }
  schedule: {
    startDate: Date
    endDate?: Date
    sendTime?: string
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
  }
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
  }
  budget?: {
    maxSpend: number
    costPerSend: number
  }
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export class MarketingAutomationManager {
  private campaigns: Map<string, Campaign> = new Map()
  private campaignHistory: Map<string, Campaign[]> = new Map()

  constructor() {
    logger.debug({ type: 'marketing_automation_init' }, 'Marketing Automation Manager inicializado')
  }

  /**
   * Crear campaña
   */
  createCampaign(
    name: string,
    type: CampaignType,
    segment: CampaignSegment,
    content: Campaign['content'],
  ): Campaign {
    const campaign: Campaign = {
      id: `camp_${Date.now()}_${Math.random()}`,
      name,
      type,
      status: 'draft',
      segment,
      content,
      schedule: {
        startDate: new Date(),
      },
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.campaigns.set(campaign.id, campaign)
    logger.info({ type: 'campaign_created', campaignId: campaign.id, name }, `Campaña creada: ${name}`)

    return campaign
  }

  /**
   * Programar campaña
   */
  scheduleCampaign(
    campaignId: string,
    startDate: Date,
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly',
  ): Campaign | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    campaign.status = 'scheduled'
    campaign.schedule.startDate = startDate
    campaign.schedule.frequency = frequency
    campaign.updatedAt = new Date()

    logger.info(
      { type: 'campaign_scheduled', campaignId, startDate, frequency },
      `Campaña programada: ${campaign.name}`,
    )

    return campaign
  }

  /**
   * Ejecutar campaña
   */
  executeCampaign(campaignId: string): Campaign | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    // Simular envío a audiencia
    const recipientCount = campaign.segment.estimatedSize
    const deliveryRate = 0.95 // 95% de entrega esperado

    campaign.status = 'active'
    campaign.metrics.sent = recipientCount
    campaign.metrics.delivered = Math.floor(recipientCount * deliveryRate)
    campaign.updatedAt = new Date()

    logger.info(
      { type: 'campaign_executed', campaignId, sent: campaign.metrics.sent },
      `Campaña ejecutada: ${campaign.name} (${campaign.metrics.sent} enviados)`,
    )

    return campaign
  }

  /**
   * Pausar campaña
   */
  pauseCampaign(campaignId: string): Campaign | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    campaign.status = 'paused'
    campaign.updatedAt = new Date()

    logger.info({ type: 'campaign_paused', campaignId }, `Campaña pausada: ${campaign.name}`)

    return campaign
  }

  /**
   * Reanudar campaña
   */
  resumeCampaign(campaignId: string): Campaign | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    campaign.status = 'active'
    campaign.updatedAt = new Date()

    logger.info({ type: 'campaign_resumed', campaignId }, `Campaña reanudada: ${campaign.name}`)

    return campaign
  }

  /**
   * Completar campaña
   */
  completeCampaign(campaignId: string): Campaign | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    campaign.status = 'completed'
    campaign.updatedAt = new Date()

    // Guardar en historial
    const history = this.campaignHistory.get(campaign.name) || []
    history.push({ ...campaign })
    this.campaignHistory.set(campaign.name, history)

    logger.info(
      { type: 'campaign_completed', campaignId, metrics: campaign.metrics },
      `Campaña completada: ${campaign.name}`,
    )

    return campaign
  }

  /**
   * Obtener performance de campaña
   */
  getCampaignPerformance(campaignId: string): {
    deliveryRate: number
    openRate: number
    clickRate: number
    conversionRate: number
    roi?: number
  } | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    const deliveryRate = campaign.metrics.sent > 0 ? (campaign.metrics.delivered / campaign.metrics.sent) * 100 : 0
    const openRate = campaign.metrics.delivered > 0 ? (campaign.metrics.opened / campaign.metrics.delivered) * 100 : 0
    const clickRate = campaign.metrics.opened > 0 ? (campaign.metrics.clicked / campaign.metrics.opened) * 100 : 0
    const conversionRate = campaign.metrics.clicked > 0 ? (campaign.metrics.converted / campaign.metrics.clicked) * 100 : 0

    let roi = undefined
    if (campaign.budget) {
      const estimatedRevenue = campaign.metrics.converted * 100 // Asumir $100 promedio por conversión
      roi = ((estimatedRevenue - campaign.budget.maxSpend) / campaign.budget.maxSpend) * 100
    }

    return { deliveryRate, openRate, clickRate, conversionRate, roi }
  }

  /**
   * A/B test campaigns
   */
  createABTestCampaign(
    name: string,
    type: CampaignType,
    segment: CampaignSegment,
    variantA: Campaign['content'],
    variantB: Campaign['content'],
  ): { campaignA: Campaign; campaignB: Campaign } {
    const campaignA = this.createCampaign(`${name} (Variant A)`, type, segment, variantA)
    const campaignB = this.createCampaign(`${name} (Variant B)`, type, segment, variantB)

    campaignA.metadata.abTest = true
    campaignA.metadata.variant = 'A'
    campaignB.metadata.abTest = true
    campaignB.metadata.variant = 'B'

    logger.info(
      { type: 'ab_test_created', campaignAId: campaignA.id, campaignBId: campaignB.id },
      `A/B test creado: ${name}`,
    )

    return { campaignA, campaignB }
  }

  /**
   * Obtener campañas activas
   */
  getActiveCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values()).filter((c) => c.status === 'active')
  }

  /**
   * Obtener campañas programadas
   */
  getScheduledCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values()).filter((c) => c.status === 'scheduled')
  }

  /**
   * Analytics de campañas
   */
  getCampaignAnalytics(): {
    totalCampaigns: number
    activeCampaigns: number
    totalSent: number
    averageOpenRate: number
    averageClickRate: number
  } {
    const campaigns = Array.from(this.campaigns.values())
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
    const totalSent = campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)

    const openRates = campaigns
      .filter((c) => c.metrics.delivered > 0)
      .map((c) => (c.metrics.opened / c.metrics.delivered) * 100)
    const avgOpenRate = openRates.length > 0 ? openRates.reduce((a, b) => a + b, 0) / openRates.length : 0

    const clickRates = campaigns
      .filter((c) => c.metrics.opened > 0)
      .map((c) => (c.metrics.clicked / c.metrics.opened) * 100)
    const avgClickRate = clickRates.length > 0 ? clickRates.reduce((a, b) => a + b, 0) / clickRates.length : 0

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalSent,
      averageOpenRate: Math.round(avgOpenRate * 100) / 100,
      averageClickRate: Math.round(avgClickRate * 100) / 100,
    }
  }
}

let globalMarketingAutomation: MarketingAutomationManager | null = null

export function initializeMarketingAutomation(): MarketingAutomationManager {
  if (!globalMarketingAutomation) {
    globalMarketingAutomation = new MarketingAutomationManager()
  }
  return globalMarketingAutomation
}

export function getMarketingAutomation(): MarketingAutomationManager {
  if (!globalMarketingAutomation) {
    return initializeMarketingAutomation()
  }
  return globalMarketingAutomation
}
