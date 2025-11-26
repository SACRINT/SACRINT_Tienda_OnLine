/**
 * Email Sequences & Drip Campaigns
 * Semana 37, Tarea 37.2: Email Sequences & Drip Campaigns
 */

import { logger } from '@/lib/monitoring'

export type TriggerEvent = 'signup' | 'purchase' | 'cart_abandoned' | 'product_view' | 'email_opened' | 'link_clicked' | 'inactivity'

export interface SequenceEmail {
  id: string
  order: number
  subject: string
  body: string
  delayMinutes: number
  condition?: {
    event: string
    value?: any
  }
}

export interface DripCampaign {
  id: string
  name: string
  description?: string
  trigger: TriggerEvent
  emails: SequenceEmail[]
  status: 'draft' | 'active' | 'paused' | 'archived'
  enrolledCount: number
  metrics: {
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalConverted: number
  }
  createdAt: Date
  updatedAt: Date
}

export class EmailSequenceManager {
  private campaigns: Map<string, DripCampaign> = new Map()
  private enrolledUsers: Map<string, Set<string>> = new Map() // campaignId -> Set<userId>
  private userProgress: Map<string, { campaignId: string; emailIndex: number; lastEmailTime: Date }[]> = new Map()

  constructor() {
    logger.debug({ type: 'email_sequence_init' }, 'Email Sequence Manager inicializado')
  }

  /**
   * Crear drip campaign
   */
  createDripCampaign(
    name: string,
    trigger: TriggerEvent,
    emails: SequenceEmail[],
  ): DripCampaign {
    // Validar que emails estén en orden
    const sortedEmails = emails.sort((a, b) => a.order - b.order)

    const campaign: DripCampaign = {
      id: `drip_${Date.now()}_${Math.random()}`,
      name,
      trigger,
      emails: sortedEmails,
      status: 'draft',
      enrolledCount: 0,
      metrics: {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalConverted: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.campaigns.set(campaign.id, campaign)
    logger.info({ type: 'drip_campaign_created', campaignId: campaign.id, name }, `Drip campaign creado: ${name}`)

    return campaign
  }

  /**
   * Activar campaña
   */
  activateCampaign(campaignId: string): DripCampaign | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    campaign.status = 'active'
    campaign.updatedAt = new Date()

    logger.info({ type: 'drip_campaign_activated', campaignId }, `Drip campaign activado: ${campaign.name}`)

    return campaign
  }

  /**
   * Inscribir usuario en campaña
   */
  enrollUser(campaignId: string, userId: string): boolean {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign || campaign.status !== 'active') return false

    let enrolledInCampaign = this.enrolledUsers.get(campaignId)
    if (!enrolledInCampaign) {
      enrolledInCampaign = new Set()
      this.enrolledUsers.set(campaignId, enrolledInCampaign)
    }

    if (enrolledInCampaign.has(userId)) {
      return false // Ya inscrito
    }

    enrolledInCampaign.add(userId)
    campaign.enrolledCount++

    // Inicializar progreso
    const userKey = `${userId}_${campaignId}`
    const progress = this.userProgress.get(userId) || []
    progress.push({ campaignId, emailIndex: 0, lastEmailTime: new Date() })
    this.userProgress.set(userId, progress)

    logger.info(
      { type: 'user_enrolled', campaignId, userId },
      `Usuario inscrito en drip campaign: ${campaign.name}`,
    )

    return true
  }

  /**
   * Obtener próximo email en secuencia
   */
  getNextEmail(campaignId: string, userId: string): SequenceEmail | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    const userProgress = this.userProgress.get(userId)
    if (!userProgress) return null

    const progress = userProgress.find((p) => p.campaignId === campaignId)
    if (!progress) return null

    // Si ya completó la secuencia
    if (progress.emailIndex >= campaign.emails.length) {
      return null
    }

    const nextEmail = campaign.emails[progress.emailIndex]
    const timeSinceLastEmail = (Date.now() - progress.lastEmailTime.getTime()) / (1000 * 60)

    // Verificar si es tiempo de enviar
    if (timeSinceLastEmail >= nextEmail.delayMinutes) {
      return nextEmail
    }

    return null
  }

  /**
   * Registrar email enviado
   */
  recordEmailSent(campaignId: string, userId: string): boolean {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return false

    const userProgress = this.userProgress.get(userId)
    if (!userProgress) return false

    const progress = userProgress.find((p) => p.campaignId === campaignId)
    if (!progress) return false

    progress.emailIndex++
    progress.lastEmailTime = new Date()
    campaign.metrics.totalSent++

    logger.debug(
      { type: 'sequence_email_sent', campaignId, userId, emailIndex: progress.emailIndex },
      `Email de secuencia enviado`,
    )

    return true
  }

  /**
   * Registrar email abierto
   */
  recordEmailOpened(campaignId: string, userId: string): void {
    const campaign = this.campaigns.get(campaignId)
    if (campaign) {
      campaign.metrics.totalOpened++
    }
  }

  /**
   * Registrar click
   */
  recordEmailClicked(campaignId: string, userId: string): void {
    const campaign = this.campaigns.get(campaignId)
    if (campaign) {
      campaign.metrics.totalClicked++
    }
  }

  /**
   * Registrar conversión
   */
  recordConversion(campaignId: string, userId: string): void {
    const campaign = this.campaigns.get(campaignId)
    if (campaign) {
      campaign.metrics.totalConverted++
    }
  }

  /**
   * Obtener estadísticas de campaña
   */
  getCampaignStats(campaignId: string): {
    enrolled: number
    sent: number
    openRate: number
    clickRate: number
    conversionRate: number
  } | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    const openRate = campaign.metrics.totalSent > 0 ? (campaign.metrics.totalOpened / campaign.metrics.totalSent) * 100 : 0
    const clickRate = campaign.metrics.totalOpened > 0 ? (campaign.metrics.totalClicked / campaign.metrics.totalOpened) * 100 : 0
    const conversionRate = campaign.metrics.totalClicked > 0 ? (campaign.metrics.totalConverted / campaign.metrics.totalClicked) * 100 : 0

    return {
      enrolled: campaign.enrolledCount,
      sent: campaign.metrics.totalSent,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    }
  }

  /**
   * Obtener campañas activas
   */
  getActiveCampaigns(): DripCampaign[] {
    return Array.from(this.campaigns.values()).filter((c) => c.status === 'active')
  }

  /**
   * Pausar campaña
   */
  pauseCampaign(campaignId: string): DripCampaign | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    campaign.status = 'paused'
    return campaign
  }
}

let globalEmailSequenceManager: EmailSequenceManager | null = null

export function initializeEmailSequenceManager(): EmailSequenceManager {
  if (!globalEmailSequenceManager) {
    globalEmailSequenceManager = new EmailSequenceManager()
  }
  return globalEmailSequenceManager
}

export function getEmailSequenceManager(): EmailSequenceManager {
  if (!globalEmailSequenceManager) {
    return initializeEmailSequenceManager()
  }
  return globalEmailSequenceManager
}
