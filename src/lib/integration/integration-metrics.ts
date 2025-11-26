/**
 * Integration Metrics Manager
 * Semana 47, Tarea 47.12: Integration Metrics & Dashboards
 */

import { logger } from "@/lib/monitoring"

export interface IntegrationMetric {
  id: string
  name: string
  value: number
  timestamp: Date
  service: string
  status: "healthy" | "warning" | "critical"
}

export interface IntegrationDashboard {
  id: string
  name: string
  metrics: IntegrationMetric[]
  lastUpdated: Date
  systemHealth: number
}

export class IntegrationMetricsManager {
  private metrics: Map<string, IntegrationMetric> = new Map()
  private dashboards: Map<string, IntegrationDashboard> = new Map()

  constructor() {
    logger.debug({ type: "integration_metrics_init" }, "Integration Metrics Manager inicializado")
  }

  recordMetric(name: string, value: number, service: string): IntegrationMetric {
    const metric: IntegrationMetric = {
      id: `metric_${Date.now()}`,
      name,
      value,
      timestamp: new Date(),
      service,
      status: value < 80 ? "healthy" : value < 95 ? "warning" : "critical",
    }
    this.metrics.set(metric.id, metric)
    logger.debug({ type: "metric_recorded" }, `${name}: ${value}`)
    return metric
  }

  createDashboard(name: string): IntegrationDashboard {
    const dashboard: IntegrationDashboard = {
      id: `dash_${Date.now()}`,
      name,
      metrics: Array.from(this.metrics.values()),
      lastUpdated: new Date(),
      systemHealth: 95,
    }
    this.dashboards.set(dashboard.id, dashboard)
    logger.info({ type: "dashboard_created" }, `Dashboard: ${name}`)
    return dashboard
  }

  updateDashboard(dashboardId: string): IntegrationDashboard | null {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) return null
    dashboard.metrics = Array.from(this.metrics.values())
    dashboard.lastUpdated = new Date()
    const criticalCount = dashboard.metrics.filter(m => m.status === "critical").length
    dashboard.systemHealth = 100 - (criticalCount * 5)
    logger.info({ type: "dashboard_updated" }, `Salud del sistema: ${dashboard.systemHealth}%`)
    return dashboard
  }

  getStatistics() {
    const allMetrics = Array.from(this.metrics.values())
    return {
      totalMetrics: allMetrics.length,
      healthyMetrics: allMetrics.filter(m => m.status === "healthy").length,
      criticalMetrics: allMetrics.filter(m => m.status === "critical").length,
      dashboards: this.dashboards.size,
    }
  }
}

let globalIntegrationMetricsManager: IntegrationMetricsManager | null = null

export function getIntegrationMetricsManager(): IntegrationMetricsManager {
  if (!globalIntegrationMetricsManager) {
    globalIntegrationMetricsManager = new IntegrationMetricsManager()
  }
  return globalIntegrationMetricsManager
}
