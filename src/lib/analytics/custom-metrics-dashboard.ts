/**
 * Custom Business Metrics Dashboard
 * Semana 33, Tarea 33.8: Dashboard de métricas personalizadas
 */

import { logger } from '@/lib/monitoring'

export interface CustomMetricsDashboard {
  tenantId: string
  metrics: Array<{
    name: string
    value: number
    unit: string
    target?: number
    trend?: number
    lastUpdated: Date
  }>
  kpis: Array<{
    name: string
    current: number
    target: number
    percentComplete: number
    status: 'on-track' | 'at-risk' | 'off-track'
  }>
}

export class CustomMetricsDashboardManager {
  private dashboards: Map<string, CustomMetricsDashboard> = new Map()

  constructor() {
    logger.debug({ type: 'custom_metrics_dashboard_init' }, 'Custom Metrics Dashboard inicializado')
  }

  createDashboard(tenantId: string): CustomMetricsDashboard {
    const dashboard: CustomMetricsDashboard = {
      tenantId,
      metrics: [],
      kpis: [],
    }

    this.dashboards.set(tenantId, dashboard)
    return dashboard
  }

  addMetric(
    tenantId: string,
    metric: (typeof CustomMetricsDashboard)['metrics'][number],
  ): void {
    const dashboard = this.dashboards.get(tenantId)
    if (!dashboard) throw new Error('Dashboard not found')

    dashboard.metrics.push(metric)
  }

  updateKPI(
    tenantId: string,
    kpiName: string,
    current: number,
    target: number,
  ): void {
    const dashboard = this.dashboards.get(tenantId)
    if (!dashboard) return

    const kpi = dashboard.kpis.find((k) => k.name === kpiName)
    if (!kpi) {
      dashboard.kpis.push({
        name: kpiName,
        current,
        target,
        percentComplete: (current / target) * 100,
        status: current >= target ? 'on-track' : 'at-risk',
      })
    } else {
      kpi.current = current
      kpi.percentComplete = (current / target) * 100
      kpi.status = current >= target ? 'on-track' : 'at-risk'
    }
  }

  getSummary(tenantId: string): { totalMetrics: number; kpiProgress: number } | null {
    const dashboard = this.dashboards.get(tenantId)
    if (!dashboard) return null

    const totalMetrics = dashboard.metrics.length
    const kpiProgress =
      dashboard.kpis.length > 0
        ? dashboard.kpis.reduce((sum, k) => sum + k.percentComplete, 0) / dashboard.kpis.length
        : 0

    return { totalMetrics, kpiProgress }
  }
}

let globalManager: CustomMetricsDashboardManager | null = null

export function initializeCustomMetricsDashboard(): CustomMetricsDashboardManager {
  if (!globalManager) {
    globalManager = new CustomMetricsDashboardManager()
  }
  return globalManager
}

export function getCustomMetricsDashboard(): CustomMetricsDashboardManager {
  if (!globalManager) {
    return initializeCustomMetricsDashboard()
  }
  return globalManager
}
