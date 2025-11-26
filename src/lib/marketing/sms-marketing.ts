/**
 * SMS Marketing Integration
 * Semana 37, Tarea 37.3: SMS Marketing Integration
 */

import { logger } from '@/lib/monitoring'

export type SMSTemplate = 'promotional' | 'transactional' | 'verification' | 'reminder' | 'survey'

export interface SMSMessage {
  id: string
  recipientPhone: string
  content: string
  template: SMSTemplate
  status: 'draft' | 'queued' | 'sent' | 'delivered' | 'failed'
  sentAt?: Date
  deliveredAt?: Date
  errorCode?: string
  metadata: Record<string, any>
}

export interface SMSCampaign {
  id: string
  name: string
  messages: SMSMessage[]
  status: 'draft' | 'active' | 'completed' | 'paused'
  metrics: {
    totalSent: number
    totalDelivered: number
    failureRate: number
  }
  createdAt: Date
}

export class SMSMarketingManager {
  private messages: Map<string, SMSMessage> = new Map()
  private campaigns: Map<string, SMSCampaign> = new Map()
  private templates: Map<string, string> = new Map()

  constructor() {
    this.initializeTemplates()
    logger.debug({ type: 'sms_marketing_init' }, 'SMS Marketing Manager inicializado')
  }

  private initializeTemplates(): void {
    this.templates.set('promotional', 'Special offer: {{offer}}. Use code {{code}} to get {{discount}}% off')
    this.templates.set('transactional', 'Order {{orderId}} confirmed. Total: {{amount}}. Track: {{trackingUrl}}')
    this.templates.set('verification', 'Your verification code is: {{code}}. Valid for 10 minutes.')
    this.templates.set('reminder', 'Don\'t forget your items! Complete your purchase: {{cartUrl}}')
    this.templates.set('survey', 'How was your experience? {{surveyUrl}}')
  }

  /**
   * Crear mensaje SMS
   */
  createSMSMessage(
    recipientPhone: string,
    content: string,
    template: SMSTemplate,
    metadata?: Record<string, any>,
  ): SMSMessage {
    const message: SMSMessage = {
      id: `sms_${Date.now()}_${Math.random()}`,
      recipientPhone,
      content,
      template,
      status: 'draft',
      metadata: metadata || {},
    }

    this.messages.set(message.id, message)
    logger.debug({ type: 'sms_created', messageId: message.id }, 'SMS creado')

    return message
  }

  /**
   * Enviar SMS inmediato
   */
  async sendSMSMessage(messageId: string): Promise<boolean> {
    const message = this.messages.get(messageId)
    if (!message) return false

    try {
      // Simular envío de SMS
      message.status = 'sent'
      message.sentAt = new Date()

      // Simular entrega
      setTimeout(() => {
        const msg = this.messages.get(messageId)
        if (msg) {
          msg.status = 'delivered'
          msg.deliveredAt = new Date()
        }
      }, 2000)

      logger.info(
        { type: 'sms_sent', messageId, phone: message.recipientPhone },
        'SMS enviado exitosamente',
      )

      return true
    } catch (error) {
      message.status = 'failed'
      message.errorCode = 'SEND_FAILED'
      logger.error({ type: 'sms_send_error', messageId, error: String(error) }, 'Error al enviar SMS')
      return false
    }
  }

  /**
   * Crear campaña de SMS
   */
  createSMSCampaign(
    name: string,
    phoneNumbers: string[],
    template: SMSTemplate,
    variables?: Record<string, any>,
  ): SMSCampaign {
    const templateContent = this.templates.get(template) || ''
    const content = this.interpolateTemplate(templateContent, variables)

    const messages = phoneNumbers.map((phone) =>
      this.createSMSMessage(phone, content, template, { campaignVariable: variables }),
    )

    const campaign: SMSCampaign = {
      id: `sms_camp_${Date.now()}_${Math.random()}`,
      name,
      messages,
      status: 'draft',
      metrics: {
        totalSent: 0,
        totalDelivered: 0,
        failureRate: 0,
      },
      createdAt: new Date(),
    }

    this.campaigns.set(campaign.id, campaign)
    logger.info(
      { type: 'sms_campaign_created', campaignId: campaign.id, name, count: messages.length },
      `Campaña de SMS creada: ${name}`,
    )

    return campaign
  }

  /**
   * Ejecutar campaña de SMS
   */
  async executeSMSCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return false

    campaign.status = 'active'
    let sentCount = 0
    let deliveredCount = 0

    for (const message of campaign.messages) {
      const sent = await this.sendSMSMessage(message.id)
      if (sent) sentCount++

      // Simular entrega
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (message.status === 'delivered') deliveredCount++
    }

    campaign.metrics.totalSent = sentCount
    campaign.metrics.totalDelivered = deliveredCount
    campaign.metrics.failureRate = sentCount > 0 ? ((sentCount - deliveredCount) / sentCount) * 100 : 0
    campaign.status = 'completed'

    logger.info(
      { type: 'sms_campaign_executed', campaignId, sent: sentCount, delivered: deliveredCount },
      `Campaña de SMS ejecutada`,
    )

    return true
  }

  /**
   * Obtener estadísticas
   */
  getCampaignStats(campaignId: string): {
    totalSent: number
    totalDelivered: number
    deliveryRate: number
    failureRate: number
  } | null {
    const campaign = this.campaigns.get(campaignId)
    if (!campaign) return null

    const deliveryRate = campaign.metrics.totalSent > 0 ? (campaign.metrics.totalDelivered / campaign.metrics.totalSent) * 100 : 0

    return {
      totalSent: campaign.metrics.totalSent,
      totalDelivered: campaign.metrics.totalDelivered,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      failureRate: Math.round(campaign.metrics.failureRate * 100) / 100,
    }
  }

  private interpolateTemplate(template: string, variables?: Record<string, any>): string {
    if (!variables) return template

    let content = template
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(`{{${key}}}`, String(value))
    }

    return content
  }
}

let globalSMSManager: SMSMarketingManager | null = null

export function initializeSMSMarketing(): SMSMarketingManager {
  if (!globalSMSManager) {
    globalSMSManager = new SMSMarketingManager()
  }
  return globalSMSManager
}

export function getSMSMarketing(): SMSMarketingManager {
  if (!globalSMSManager) {
    return initializeSMSMarketing()
  }
  return globalSMSManager
}
