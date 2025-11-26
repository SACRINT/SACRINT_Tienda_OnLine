/**
 * Email Campaign Management System
 * Semana 32, Tarea 32.2: Gestión completa de campañas de email marketing
 */

import { logger } from '@/lib/monitoring'

/**
 * Estado de campaña
 */
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'

/**
 * Campaña de email
 */
export interface EmailCampaign {
  id: string
  tenantId: string
  name: string
  description?: string
  templateId: string
  subject: string
  previewText?: string
  status: CampaignStatus
  recipients: string[] // segment IDs o email list IDs
  scheduledAt?: Date
  sentAt?: Date
  stats: {
    total: number
    sent: number
    delivered: number
    opened: number
    clicked: number
    unsubscribed: number
    bounced: number
    failed: number
  }
  variables?: Record<string, string>
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

/**
 * Manager de campañas
 */
export class EmailCampaignManager {
  private campaigns: Map<string, EmailCampaign> = new Map()
  private campaignSchedules: Map<string, NodeJS.Timer> = new Map()

  constructor() {
    logger.debug({ type: 'email_campaign_manager_init' }, 'Email Campaign Manager inicializado')
  }

  /**
   * Crear campaña
   */
  createCampaign(
    tenantId: string,
    data: {
      name: string
      description?: string
      templateId: string
      subject: string
      previewText?: string
      recipients: string[]
      variables?: Record<string, string>
      createdBy: string
    },
  ): EmailCampaign {
    const campaign: EmailCampaign = {
      id: `camp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId,
      name: data.name,
      description: data.description,
      templateId: data.templateId,
      subject: data.subject,
      previewText: data.previewText,
      status: 'draft',
      recipients: data.recipients,
      stats: {
        total: data.recipients.length,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
        bounced: 0,
        failed: 0,
      },
      variables: data.variables,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy,
    }

    this.campaigns.set(campaign.id, campaign)

    logger.debug(
      { type: 'campaign_created', campaignId: campaign.id, tenantId },
      `Campaña creada: ${campaign.name}`,
    )

    return campaign
  }

  /**
   * Obtener campaña
   */
  getCampaign(campaignId: string): EmailCampaign | null {
    return this.campaigns.get(campaignId) || null
  }

  /**
   * Actualizar campaña
   */
  updateCampaign(
    campaignId: string,
    updates: Partial<EmailCampaign>,
  ): EmailCampaign {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaña no encontrada: ${campaignId}`)
    }

    const updated = {
      ...campaign,
      ...updates,
      updatedAt: new Date(),
      id: campaign.id, // No permitir cambio de ID
      status: campaign.status, // Cambiar con método específico
      createdAt: campaign.createdAt, // No permitir cambio de fecha creación
    }

    this.campaigns.set(campaignId, updated)

    logger.debug(
      { type: 'campaign_updated', campaignId },
      `Campaña actualizada: ${campaign.name}`,
    )

    return updated
  }

  /**
   * Programar envío de campaña
   */
  scheduleCampaign(campaignId: string, sendAt: Date): EmailCampaign {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaña no encontrada: ${campaignId}`)
    }

    if (campaign.status !== 'draft') {
      throw new Error(`Solo se pueden programar campañas en borrador`)
    }

    campaign.scheduledAt = sendAt
    campaign.status = 'scheduled'
    campaign.updatedAt = new Date()

    // Programar envío automático
    const now = Date.now()
    const delayMs = sendAt.getTime() - now

    if (delayMs > 0) {
      const timer = setTimeout(() => {
        this.sendCampaign(campaignId).catch((error) => {
          logger.error(
            { type: 'campaign_send_error', campaignId, error },
            'Error enviando campaña programada',
          )
        })
      }, delayMs)

      this.campaignSchedules.set(campaignId, timer)
    }

    logger.info(
      { type: 'campaign_scheduled', campaignId, sendAt },
      `Campaña programada para: ${sendAt.toISOString()}`,
    )

    return campaign
  }

  /**
   * Enviar campaña inmediatamente
   */
  async sendCampaign(campaignId: string): Promise<EmailCampaign> {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaña no encontrada: ${campaignId}`)
    }

    if (campaign.status === 'sent') {
      throw new Error('Campaña ya fue enviada')
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error(`Estado inválido para envío: ${campaign.status}`)
    }

    campaign.status = 'sending'
    campaign.updatedAt = new Date()

    logger.info(
      { type: 'campaign_send_started', campaignId },
      `Iniciando envío de campaña: ${campaign.name}`,
    )

    try {
      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 100))

      campaign.status = 'sent'
      campaign.sentAt = new Date()
      campaign.stats.sent = campaign.stats.total

      logger.info(
        { type: 'campaign_sent', campaignId, recipients: campaign.stats.total },
        `Campaña enviada a ${campaign.stats.total} destinatarios`,
      )

      return campaign
    } catch (error) {
      campaign.status = 'paused'
      logger.error(
        { type: 'campaign_send_failed', campaignId, error },
        'Error enviando campaña',
      )
      throw error
    }
  }

  /**
   * Pausar campaña
   */
  pauseCampaign(campaignId: string): EmailCampaign {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaña no encontrada: ${campaignId}`)
    }

    if (campaign.status !== 'sending') {
      throw new Error('Solo se pueden pausar campañas en envío')
    }

    campaign.status = 'paused'
    campaign.updatedAt = new Date()

    // Cancelar programación si existe
    const timer = this.campaignSchedules.get(campaignId)
    if (timer) {
      clearTimeout(timer)
      this.campaignSchedules.delete(campaignId)
    }

    logger.info(
      { type: 'campaign_paused', campaignId },
      `Campaña pausada: ${campaign.name}`,
    )

    return campaign
  }

  /**
   * Cancelar campaña
   */
  cancelCampaign(campaignId: string): EmailCampaign {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaña no encontrada: ${campaignId}`)
    }

    if (campaign.status === 'sent') {
      throw new Error('No se puede cancelar una campaña ya enviada')
    }

    campaign.status = 'cancelled'
    campaign.updatedAt = new Date()

    // Cancelar programación si existe
    const timer = this.campaignSchedules.get(campaignId)
    if (timer) {
      clearTimeout(timer)
      this.campaignSchedules.delete(campaignId)
    }

    logger.info(
      { type: 'campaign_cancelled', campaignId },
      `Campaña cancelada: ${campaign.name}`,
    )

    return campaign
  }

  /**
   * Registrar evento de apertura
   */
  recordOpen(campaignId: string, email: string): void {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return

    campaign.stats.opened++
    campaign.updatedAt = new Date()

    logger.debug(
      { type: 'campaign_opened', campaignId, email },
      'Email abierto',
    )
  }

  /**
   * Registrar evento de click
   */
  recordClick(campaignId: string, email: string, url: string): void {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return

    campaign.stats.clicked++
    campaign.updatedAt = new Date()

    logger.debug(
      { type: 'campaign_clicked', campaignId, email, url },
      'Link clickeado',
    )
  }

  /**
   * Registrar evento de bounce
   */
  recordBounce(campaignId: string, email: string, type: 'hard' | 'soft'): void {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return

    campaign.stats.bounced++
    campaign.updatedAt = new Date()

    logger.debug(
      { type: 'campaign_bounced', campaignId, email, bounceType: type },
      `Bounce ${type}`,
    )
  }

  /**
   * Obtener estadísticas de campaña
   */
  getStats(campaignId: string): {
    campaignName: string
    status: CampaignStatus
    stats: EmailCampaign['stats']
    rates: {
      deliveryRate: number
      openRate: number
      clickRate: number
      bounceRate: number
      unsubscribeRate: number
    }
  } | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    const stats = campaign.stats
    const total = stats.total || 1

    return {
      campaignName: campaign.name,
      status: campaign.status,
      stats,
      rates: {
        deliveryRate: (stats.delivered / total) * 100,
        openRate: (stats.opened / stats.delivered) * 100,
        clickRate: (stats.clicked / stats.delivered) * 100,
        bounceRate: (stats.bounced / total) * 100,
        unsubscribeRate: (stats.unsubscribed / stats.delivered) * 100,
      },
    }
  }

  /**
   * Listar campañas por tenant
   */
  listCampaigns(tenantId: string, status?: CampaignStatus): EmailCampaign[] {
    return Array.from(this.campaigns.values()).filter(
      (c) => c.tenantId === tenantId && (!status || c.status === status),
    )
  }

  /**
   * Duplicar campaña
   */
  duplicateCampaign(campaignId: string, newName: string): EmailCampaign {
    const original = this.campaigns.get(campaignId)
    if (!original) {
      throw new Error(`Campaña no encontrada: ${campaignId}`)
    }

    const duplicate = this.createCampaign(original.tenantId, {
      name: newName,
      description: original.description,
      templateId: original.templateId,
      subject: original.subject,
      previewText: original.previewText,
      recipients: [...original.recipients],
      variables: original.variables ? { ...original.variables } : undefined,
      createdBy: original.createdBy,
    })

    logger.debug(
      { type: 'campaign_duplicated', original: campaignId, duplicate: duplicate.id },
      `Campaña duplicada: ${newName}`,
    )

    return duplicate
  }

  /**
   * Generar reporte de campaña
   */
  generateReport(campaignId: string): string {
    const statsData = this.getStats(campaignId)
    if (!statsData) {
      return 'Campaña no encontrada'
    }

    const campaign = this.campaigns.get(campaignId)!

    let report = `Email Campaign Report\n`
    report += `=====================\n\n`

    report += `Campaign: ${statsData.campaignName}\n`
    report += `Status: ${statsData.status.toUpperCase()}\n`
    report += `Created: ${campaign.createdAt.toLocaleDateString()}\n`
    if (campaign.sentAt) {
      report += `Sent: ${campaign.sentAt.toLocaleDateString()}\n`
    }
    report += '\n'

    report += `Performance Metrics:\n`
    report += `  Total Recipients: ${statsData.stats.total}\n`
    report += `  Delivered: ${statsData.stats.delivered} (${statsData.rates.deliveryRate.toFixed(2)}%)\n`
    report += `  Opened: ${statsData.stats.opened} (${statsData.rates.openRate.toFixed(2)}%)\n`
    report += `  Clicked: ${statsData.stats.clicked} (${statsData.rates.clickRate.toFixed(2)}%)\n`
    report += `  Bounced: ${statsData.stats.bounced} (${statsData.rates.bounceRate.toFixed(2)}%)\n`
    report += `  Unsubscribed: ${statsData.stats.unsubscribed} (${statsData.rates.unsubscribeRate.toFixed(2)}%)\n`

    return report
  }
}

/**
 * Instancia global
 */
let globalManager: EmailCampaignManager | null = null

/**
 * Inicializar globalmente
 */
export function initializeEmailCampaignManager(): EmailCampaignManager {
  if (!globalManager) {
    globalManager = new EmailCampaignManager()
  }
  return globalManager
}

/**
 * Obtener manager global
 */
export function getEmailCampaignManager(): EmailCampaignManager {
  if (!globalManager) {
    return initializeEmailCampaignManager()
  }
  return globalManager
}
