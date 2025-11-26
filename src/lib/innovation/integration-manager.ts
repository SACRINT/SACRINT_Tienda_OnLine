/**
 * Integration Manager
 * Semana 54, Tarea 54.4: External Integrations & API Management
 */

import { logger } from "@/lib/monitoring"

export interface Integration {
  id: string
  integrationName: string
  provider: string
  type: "webhook" | "api" | "polling" | "direct"
  status: "active" | "inactive" | "deprecated"
  apiKey?: string
  lastSyncDate: Date
  errorCount: number
  description: string
}

export class IntegrationManager {
  private integrations: Map<string, Integration> = new Map()

  constructor() {
    logger.debug({ type: "integration_manager_init" }, "Manager inicializado")
  }

  setupIntegration(
    integrationName: string,
    provider: string,
    integrationType: "webhook" | "api" | "polling" | "direct",
    description: string,
    apiKey?: string
  ): Integration {
    const id = "int_" + Date.now()
    const integration: Integration = {
      id,
      integrationName,
      provider,
      type: integrationType,
      status: "active",
      apiKey,
      lastSyncDate: new Date(),
      errorCount: 0,
      description,
    }

    this.integrations.set(id, integration)
    logger.info(
      { type: "integration_setup", integrationId: id },
      `Integración configurada: ${integrationName}`
    )
    return integration
  }

  recordSyncError(integrationId: string): Integration | null {
    const integration = this.integrations.get(integrationId)
    if (!integration) return null

    integration.errorCount++
    logger.warn({ type: "sync_error_recorded", integrationId }, `Error de sincronización`)
    return integration
  }

  getStatistics(): Record<string, unknown> {
    const integrations = Array.from(this.integrations.values())

    return {
      totalIntegrations: integrations.length,
      byStatus: {
        active: integrations.filter((i) => i.status === "active").length,
        inactive: integrations.filter((i) => i.status === "inactive").length,
        deprecated: integrations.filter((i) => i.status === "deprecated").length,
      },
      byType: {
        webhook: integrations.filter((i) => i.type === "webhook").length,
        api: integrations.filter((i) => i.type === "api").length,
        polling: integrations.filter((i) => i.type === "polling").length,
        direct: integrations.filter((i) => i.type === "direct").length,
      },
    }
  }

  generateIntegrationReport(): string {
    const stats = this.getStatistics()
    return `Integration Report\nTotal: ${stats.totalIntegrations}\nActive: ${stats.byStatus.active}`
  }
}

let globalIntegrationManager: IntegrationManager | null = null

export function getIntegrationManager(): IntegrationManager {
  if (!globalIntegrationManager) {
    globalIntegrationManager = new IntegrationManager()
  }
  return globalIntegrationManager
}
