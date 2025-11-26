/**
 * Advanced Customer Segmentation & Retargeting
 * Semana 37, Tarea 37.5-37.6: Retargeting, Pixel Tracking & Advanced Segmentation
 */

import { logger } from '@/lib/monitoring'

export type SegmentRule = 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in' | 'exists' | 'changed'

export interface SegmentCondition {
  field: string
  operator: SegmentRule
  value: any
  logic?: 'AND' | 'OR'
}

export interface CustomerSegment {
  id: string
  name: string
  description?: string
  conditions: SegmentCondition[]
  estimatedSize: number
  memberIds: Set<string>
  createdAt: Date
}

export interface RetargetingCampaign {
  id: string
  segmentId: string
  campaignName: string
  pixelId: string
  targetingRules: {
    timeSinceVisit?: number // days
    pageViewed?: string
    actionTaken?: string
  }
  metrics: {
    impressions: number
    clicks: number
    conversions: number
  }
}

export interface PixelEvent {
  id: string
  userId: string
  pixelId: string
  eventType: 'pageview' | 'purchase' | 'cart_add' | 'wishlist' | 'view_product'
  metadata: Record<string, any>
  timestamp: Date
}

export class AdvancedSegmentationManager {
  private segments: Map<string, CustomerSegment> = new Map()
  private retargetingCampaigns: Map<string, RetargetingCampaign> = new Map()
  private pixelEvents: Map<string, PixelEvent[]> = new Map()

  constructor() {
    logger.debug({ type: 'segmentation_init' }, 'Advanced Segmentation Manager inicializado')
  }

  /**
   * Crear segmento
   */
  createSegment(name: string, conditions: SegmentCondition[], description?: string): CustomerSegment {
    const segment: CustomerSegment = {
      id: `seg_${Date.now()}_${Math.random()}`,
      name,
      description,
      conditions,
      estimatedSize: 0,
      memberIds: new Set(),
      createdAt: new Date(),
    }

    this.segments.set(segment.id, segment)
    logger.info({ type: 'segment_created', segmentId: segment.id, name }, `Segmento creado: ${name}`)

    return segment
  }

  /**
   * Agregar usuario al segmento
   */
  addMemberToSegment(segmentId: string, userId: string): boolean {
    const segment = this.segments.get(segmentId)
    if (!segment) return false

    segment.memberIds.add(userId)
    segment.estimatedSize = segment.memberIds.size

    return true
  }

  /**
   * Crear campaña de retargeting
   */
  createRetargetingCampaign(
    segmentId: string,
    campaignName: string,
    targetingRules?: RetargetingCampaign['targetingRules'],
  ): RetargetingCampaign {
    const campaign: RetargetingCampaign = {
      id: `retarget_${Date.now()}_${Math.random()}`,
      segmentId,
      campaignName,
      pixelId: `pixel_${Math.random()}`,
      targetingRules: targetingRules || {},
      metrics: { impressions: 0, clicks: 0, conversions: 0 },
    }

    this.retargetingCampaigns.set(campaign.id, campaign)
    logger.info(
      { type: 'retargeting_created', campaignId: campaign.id, segmentId },
      `Campaña de retargeting creada: ${campaignName}`,
    )

    return campaign
  }

  /**
   * Rastrear evento de pixel
   */
  trackPixelEvent(
    userId: string,
    pixelId: string,
    eventType: PixelEvent['eventType'],
    metadata?: Record<string, any>,
  ): PixelEvent {
    const event: PixelEvent = {
      id: `px_${Date.now()}_${Math.random()}`,
      userId,
      pixelId,
      eventType,
      metadata: metadata || {},
      timestamp: new Date(),
    }

    const events = this.pixelEvents.get(pixelId) || []
    events.push(event)
    this.pixelEvents.set(pixelId, events)

    logger.debug(
      { type: 'pixel_tracked', userId, eventType, pixelId },
      `Evento de pixel rastreado: ${eventType}`,
    )

    return event
  }

  /**
   * Obtener eventos de usuario
   */
  getUserPixelEvents(pixelId: string, userId: string): PixelEvent[] {
    const events = this.pixelEvents.get(pixelId) || []
    return events.filter((e) => e.userId === userId)
  }

  /**
   * Obtener estadísticas de campaña
   */
  getRetargetingStats(campaignId: string): {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
  } | null {
    const campaign = this.retargetingCampaigns.get(campaignId)
    if (!campaign) return null

    const ctr = campaign.metrics.impressions > 0 ? (campaign.metrics.clicks / campaign.metrics.impressions) * 100 : 0
    const conversionRate = campaign.metrics.clicks > 0 ? (campaign.metrics.conversions / campaign.metrics.clicks) * 100 : 0

    return {
      impressions: campaign.metrics.impressions,
      clicks: campaign.metrics.clicks,
      conversions: campaign.metrics.conversions,
      ctr: Math.round(ctr * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    }
  }

  /**
   * Obtener miembros del segmento
   */
  getSegmentMembers(segmentId: string): string[] {
    const segment = this.segments.get(segmentId)
    if (!segment) return []

    return Array.from(segment.memberIds)
  }
}

let globalSegmentationManager: AdvancedSegmentationManager | null = null

export function initializeAdvancedSegmentation(): AdvancedSegmentationManager {
  if (!globalSegmentationManager) {
    globalSegmentationManager = new AdvancedSegmentationManager()
  }
  return globalSegmentationManager
}

export function getAdvancedSegmentation(): AdvancedSegmentationManager {
  if (!globalSegmentationManager) {
    return initializeAdvancedSegmentation()
  }
  return globalSegmentationManager
}
