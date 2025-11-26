/**
 * Partner Portal & Developer Hub
 * Semana 38, Tarea 38.11: Partner Portal & Developer Hub
 */

import { logger } from '@/lib/monitoring'

export interface DeveloperProfile {
  id: string
  userId: string
  companyName: string
  website?: string
  description?: string
  avatar?: string
  verified: boolean
  tier: 'free' | 'professional' | 'enterprise'
  createdAt: Date
  updatedAt: Date
}

export interface APIApplication {
  id: string
  developerId: string
  name: string
  description?: string
  icon?: string
  category: string
  status: 'draft' | 'published' | 'suspended' | 'deprecated'
  version: string
  documentation?: string
  supportEmail?: string
  webhookUrl?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface DeveloperDocumentation {
  id: string
  title: string
  content: string
  category: string
  order: number
  tags?: string[]
  updatedAt: Date
}

export interface PartnerAnalytics {
  developerId: string
  applicationId: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  errorRate: number
  period: 'day' | 'week' | 'month'
  date: Date
}

export interface APIUsageQuota {
  developerId: string
  tier: string
  requestsPerMonth: number
  requestsUsed: number
  resetDate: Date
}

export class DeveloperPortal {
  private developers: Map<string, DeveloperProfile> = new Map()
  private applications: Map<string, APIApplication> = new Map()
  private documentation: Map<string, DeveloperDocumentation> = new Map()
  private analytics: Map<string, PartnerAnalytics> = new Map()
  private quotas: Map<string, APIUsageQuota> = new Map()

  constructor() {
    logger.debug({ type: 'developer_portal_init' }, 'Developer Portal inicializado')
  }

  /**
   * Registrar desarrollador
   */
  registerDeveloper(userId: string, companyName: string): DeveloperProfile {
    try {
      const profile: DeveloperProfile = {
        id: `dev_${Date.now()}_${Math.random()}`,
        userId,
        companyName,
        verified: false,
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.developers.set(profile.id, profile)

      // Crear cuota inicial
      const quota: APIUsageQuota = {
        developerId: profile.id,
        tier: 'free',
        requestsPerMonth: 10000,
        requestsUsed: 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      this.quotas.set(profile.id, quota)

      logger.info(
        { type: 'developer_registered', developerId: profile.id, companyName },
        `Desarrollador registrado: ${profile.id}`,
      )

      return profile
    } catch (error) {
      logger.error({ type: 'developer_registration_error', error: String(error) }, 'Error al registrar desarrollador')
      throw error
    }
  }

  /**
   * Obtener perfil del desarrollador
   */
  getDeveloperProfile(developerId: string): DeveloperProfile | null {
    return this.developers.get(developerId) || null
  }

  /**
   * Actualizar perfil del desarrollador
   */
  updateDeveloperProfile(developerId: string, updates: Partial<DeveloperProfile>): DeveloperProfile | null {
    const profile = this.getDeveloperProfile(developerId)
    if (!profile) return null

    const updated = { ...profile, ...updates, updatedAt: new Date() }
    this.developers.set(developerId, updated)

    logger.info({ type: 'developer_profile_updated', developerId }, `Perfil actualizado: ${developerId}`)

    return updated
  }

  /**
   * Crear aplicación API
   */
  createApplication(developerId: string, name: string, category: string): APIApplication {
    try {
      const application: APIApplication = {
        id: `app_${Date.now()}_${Math.random()}`,
        developerId,
        name,
        category,
        status: 'draft',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.applications.set(application.id, application)

      logger.info(
        { type: 'api_application_created', applicationId: application.id, developerId, name },
        `Aplicación creada: ${name}`,
      )

      return application
    } catch (error) {
      logger.error({ type: 'application_creation_error', developerId, error: String(error) }, 'Error al crear aplicación')
      throw error
    }
  }

  /**
   * Obtener aplicación
   */
  getApplication(applicationId: string): APIApplication | null {
    return this.applications.get(applicationId) || null
  }

  /**
   * Obtener aplicaciones del desarrollador
   */
  getDeveloperApplications(developerId: string): APIApplication[] {
    return Array.from(this.applications.values()).filter((app) => app.developerId === developerId)
  }

  /**
   * Publicar aplicación
   */
  publishApplication(applicationId: string): boolean {
    try {
      const app = this.getApplication(applicationId)
      if (!app) return false

      app.status = 'published'
      app.publishedAt = new Date()
      app.updatedAt = new Date()

      logger.info({ type: 'application_published', applicationId }, `Aplicación publicada: ${applicationId}`)

      return true
    } catch (error) {
      logger.error({ type: 'application_publish_error', applicationId, error: String(error) }, 'Error al publicar aplicación')
      return false
    }
  }

  /**
   * Suspender aplicación
   */
  suspendApplication(applicationId: string, reason?: string): boolean {
    try {
      const app = this.getApplication(applicationId)
      if (!app) return false

      app.status = 'suspended'
      app.updatedAt = new Date()

      logger.warn(
        { type: 'application_suspended', applicationId, reason },
        `Aplicación suspendida: ${applicationId}`,
      )

      return true
    } catch (error) {
      logger.error({ type: 'application_suspension_error', applicationId, error: String(error) }, 'Error al suspender aplicación')
      return false
    }
  }

  /**
   * Crear documentación
   */
  createDocumentation(title: string, content: string, category: string): DeveloperDocumentation {
    try {
      const doc: DeveloperDocumentation = {
        id: `doc_${Date.now()}_${Math.random()}`,
        title,
        content,
        category,
        order: 0,
        updatedAt: new Date(),
      }

      this.documentation.set(doc.id, doc)

      logger.info({ type: 'documentation_created', docId: doc.id, title, category }, `Documentación creada: ${title}`)

      return doc
    } catch (error) {
      logger.error({ type: 'documentation_error', error: String(error) }, 'Error al crear documentación')
      throw error
    }
  }

  /**
   * Obtener documentación
   */
  getDocumentation(docId: string): DeveloperDocumentation | null {
    return this.documentation.get(docId) || null
  }

  /**
   * Obtener documentación por categoría
   */
  getDocumentationByCategory(category: string): DeveloperDocumentation[] {
    return Array.from(this.documentation.values())
      .filter((doc) => doc.category === category)
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Registrar analytics
   */
  recordAnalytics(developerId: string, applicationId: string, metrics: Partial<PartnerAnalytics>): void {
    try {
      const key = `${developerId}:${applicationId}`
      const analytics: PartnerAnalytics = {
        developerId,
        applicationId,
        totalRequests: metrics.totalRequests || 0,
        successfulRequests: metrics.successfulRequests || 0,
        failedRequests: metrics.failedRequests || 0,
        averageResponseTime: metrics.averageResponseTime || 0,
        errorRate: metrics.errorRate || 0,
        period: 'day',
        date: new Date(),
      }

      this.analytics.set(key, analytics)

      logger.debug({ type: 'analytics_recorded', developerId, applicationId }, `Analytics registrados`)
    } catch (error) {
      logger.error({ type: 'analytics_error', error: String(error) }, 'Error al registrar analytics')
    }
  }

  /**
   * Obtener analytics del desarrollador
   */
  getDeveloperAnalytics(developerId: string): PartnerAnalytics[] {
    return Array.from(this.analytics.values()).filter((a) => a.developerId === developerId)
  }

  /**
   * Verificar cuota de uso
   */
  checkQuota(developerId: string): APIUsageQuota | null {
    return this.quotas.get(developerId) || null
  }

  /**
   * Incrementar uso de API
   */
  incrementUsage(developerId: string, requests: number = 1): boolean {
    const quota = this.checkQuota(developerId)
    if (!quota) return false

    // Resetear si la fecha ha pasado
    if (new Date() > quota.resetDate) {
      quota.requestsUsed = 0
      quota.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    quota.requestsUsed += requests

    return quota.requestsUsed <= quota.requestsPerMonth
  }

  /**
   * Obtener estadísticas del portal
   */
  getStats(): {
    totalDevelopers: number
    verifiedDevelopers: number
    totalApplications: number
    publishedApplications: number
    totalDocumentation: number
  } {
    const developers = Array.from(this.developers.values())
    const applications = Array.from(this.applications.values())

    return {
      totalDevelopers: developers.length,
      verifiedDevelopers: developers.filter((d) => d.verified).length,
      totalApplications: applications.length,
      publishedApplications: applications.filter((a) => a.status === 'published').length,
      totalDocumentation: this.documentation.size,
    }
  }

  /**
   * Generar reporte para desarrollador
   */
  generateDeveloperReport(developerId: string): string {
    const profile = this.getDeveloperProfile(developerId)
    const applications = this.getDeveloperApplications(developerId)
    const analytics = this.getDeveloperAnalytics(developerId)
    const quota = this.checkQuota(developerId)

    let report = `
╔════════════════════════════════════════════════════════════╗
║             DEVELOPER PORTAL REPORT
╚════════════════════════════════════════════════════════════╝

Developer: ${profile?.companyName}
Tier: ${profile?.tier}
Verified: ${profile?.verified ? 'Yes' : 'No'}

Applications:
  Total: ${applications.length}
  Published: ${applications.filter((a) => a.status === 'published').length}

${applications.map((app) => `  • ${app.name} (${app.status})`).join('\n')}

Usage:
  Requests This Month: ${quota?.requestsUsed}/${quota?.requestsPerMonth}
  Usage Rate: ${quota ? ((quota.requestsUsed / quota.requestsPerMonth) * 100).toFixed(2) : 0}%

Recent Analytics:
${analytics
  .slice(-5)
  .map(
    (a) => `
  Application: ${a.applicationId}
  Total Requests: ${a.totalRequests}
  Success Rate: ${((a.successfulRequests / a.totalRequests) * 100).toFixed(2)}%
  Error Rate: ${a.errorRate.toFixed(2)}%
  `,
  )
  .join('')}

════════════════════════════════════════════════════════════
    `

    return report
  }
}

let globalDeveloperPortal: DeveloperPortal | null = null

export function initializeDeveloperPortal(): DeveloperPortal {
  if (!globalDeveloperPortal) {
    globalDeveloperPortal = new DeveloperPortal()
  }
  return globalDeveloperPortal
}

export function getDeveloperPortal(): DeveloperPortal {
  if (!globalDeveloperPortal) {
    return initializeDeveloperPortal()
  }
  return globalDeveloperPortal
}
