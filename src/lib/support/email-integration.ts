/**
 * Email Integration for Support
 * Semana 41, Tarea 41.5: Email Integration for Support
 */

import { logger } from '@/lib/monitoring'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  createdAt: Date
}

export interface EmailLog {
  id: string
  to: string
  from: string
  subject: string
  ticketId?: string
  status: 'sent' | 'pending' | 'failed'
  sentAt?: Date
  error?: string
}

export class EmailIntegrationManager {
  private templates: Map<string, EmailTemplate> = new Map()
  private emailLogs: EmailLog[] = []

  constructor() {
    logger.debug({ type: 'email_integration_init' }, 'Email Integration Manager inicializado')
    this.initializeDefaultTemplates()
  }

  /**
   * Inicializar templates por defecto
   */
  private initializeDefaultTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        id: 'ticket_created',
        name: 'Ticket Creado',
        subject: 'Tu ticket #{{ticketId}} ha sido creado',
        body: 'Gracias por contactar. Tu ticket ha sido creado exitosamente.',
        variables: ['ticketId', 'customerName'],
        createdAt: new Date(),
      },
      {
        id: 'ticket_responded',
        name: 'Respuesta al Ticket',
        subject: 'Nueva respuesta en ticket #{{ticketId}}',
        body: 'Tu ticket ha recibido una nueva respuesta: {{message}}',
        variables: ['ticketId', 'message', 'agentName'],
        createdAt: new Date(),
      },
      {
        id: 'ticket_resolved',
        name: 'Ticket Resuelto',
        subject: 'Tu ticket #{{ticketId}} ha sido resuelto',
        body: 'Tu solicitud ha sido resuelta. Si necesitas más ayuda, contáctanos.',
        variables: ['ticketId'],
        createdAt: new Date(),
      },
    ]

    for (const template of templates) {
      this.templates.set(template.id, template)
    }
  }

  /**
   * Crear template personalizado
   */
  createTemplate(name: string, subject: string, body: string, variables: string[]): EmailTemplate {
    const template: EmailTemplate = {
      id: `template_${Date.now()}`,
      name,
      subject,
      body,
      variables,
      createdAt: new Date(),
    }

    this.templates.set(template.id, template)
    return template
  }

  /**
   * Renderizar template
   */
  renderTemplate(templateId: string, variables: Record<string, string>): { subject: string; body: string } | null {
    const template = this.templates.get(templateId)
    if (!template) return null

    let subject = template.subject
    let body = template.body

    for (const [key, value] of Object.entries(variables)) {
      subject = subject.replace(`{{${key}}}`, value)
      body = body.replace(`{{${key}}}`, value)
    }

    return { subject, body }
  }

  /**
   * Enviar email
   */
  async sendEmail(to: string, templateId: string, variables: Record<string, string>, ticketId?: string): Promise<EmailLog> {
    const rendered = this.renderTemplate(templateId, variables)
    if (!rendered) {
      throw new Error('Template no encontrado')
    }

    const emailLog: EmailLog = {
      id: `email_${Date.now()}`,
      to,
      from: 'support@example.com',
      subject: rendered.subject,
      ticketId,
      status: 'pending',
    }

    this.emailLogs.push(emailLog)

    // Simular envío
    setTimeout(() => {
      const log = this.emailLogs.find((e) => e.id === emailLog.id)
      if (log) {
        log.status = 'sent'
        log.sentAt = new Date()
      }
    }, 2000)

    logger.info({ type: 'email_scheduled', to, templateId }, `Email programado para enviar a ${to}`)

    return emailLog
  }

  /**
   * Obtener logs de email
   */
  getEmailLogs(ticketId?: string, limit: number = 50): EmailLog[] {
    let logs = [...this.emailLogs].slice(-limit)
    return ticketId ? logs.filter((l) => l.ticketId === ticketId) : logs
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalEmails: number; sentEmails: number; failedEmails: number; successRate: number } {
    const sent = this.emailLogs.filter((e) => e.status === 'sent').length
    const failed = this.emailLogs.filter((e) => e.status === 'failed').length

    return {
      totalEmails: this.emailLogs.length,
      sentEmails: sent,
      failedEmails: failed,
      successRate: this.emailLogs.length > 0 ? sent / this.emailLogs.length : 0,
    }
  }
}

let globalEmailIntegrationManager: EmailIntegrationManager | null = null

export function initializeEmailIntegrationManager(): EmailIntegrationManager {
  if (!globalEmailIntegrationManager) {
    globalEmailIntegrationManager = new EmailIntegrationManager()
  }
  return globalEmailIntegrationManager
}

export function getEmailIntegrationManager(): EmailIntegrationManager {
  if (!globalEmailIntegrationManager) {
    return initializeEmailIntegrationManager()
  }
  return globalEmailIntegrationManager
}
