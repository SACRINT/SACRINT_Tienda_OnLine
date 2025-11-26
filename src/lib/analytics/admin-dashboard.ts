/**
 * Admin Analytics Dashboard & Controls
 * Semana 33, Tarea 33.11: Dashboard administrativo con controles
 */

import { logger } from '@/lib/monitoring'

export interface AdminMetrics {
  totalRevenue: number
  totalOrders: number
  totalSubscribers: number
  avgOrderValue: number
  conversionRate: number
  churnRate: number
  activeUsers: number
  systemHealth: number
}

export interface AdminControls {
  featureFlags: Record<string, boolean>
  maintenanceMode: boolean
  rateLimits: Record<string, number>
  settings: Record<string, any>
}

export class AdminDashboard {
  private metrics: AdminMetrics = {
    totalRevenue: 0,
    totalOrders: 0,
    totalSubscribers: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    churnRate: 0,
    activeUsers: 0,
    systemHealth: 100,
  }

  private controls: AdminControls = {
    featureFlags: {},
    maintenanceMode: false,
    rateLimits: {},
    settings: {},
  }

  constructor() {
    logger.debug({ type: 'admin_dashboard_init' }, 'Admin Dashboard inicializado')
  }

  updateMetrics(updates: Partial<AdminMetrics>): void {
    Object.assign(this.metrics, updates)
    logger.debug({ type: 'admin_metrics_updated' }, 'Métricas administrativas actualizadas')
  }

  getMetrics(): AdminMetrics {
    return { ...this.metrics }
  }

  setFeatureFlag(flag: string, enabled: boolean): void {
    this.controls.featureFlags[flag] = enabled
    logger.info(
      { type: 'feature_flag_toggled', flag, enabled },
      `Feature flag ${flag} ${enabled ? 'habilitado' : 'deshabilitado'}`,
    )
  }

  enableMaintenanceMode(duration?: number): void {
    this.controls.maintenanceMode = true
    logger.warn(
      { type: 'maintenance_mode_enabled', duration },
      'Modo mantenimiento habilitado',
    )

    if (duration) {
      setTimeout(() => {
        this.disableMaintenanceMode()
      }, duration)
    }
  }

  disableMaintenanceMode(): void {
    this.controls.maintenanceMode = false
    logger.info({ type: 'maintenance_mode_disabled' }, 'Modo mantenimiento deshabilitado')
  }

  setRateLimit(endpoint: string, limit: number): void {
    this.controls.rateLimits[endpoint] = limit
  }

  updateSetting(key: string, value: any): void {
    this.controls.settings[key] = value
  }

  getSystemStatus(): {
    status: 'healthy' | 'degraded' | 'down'
    metrics: AdminMetrics
    controls: AdminControls
  } {
    const health = this.metrics.systemHealth
    const status = health >= 80 ? 'healthy' : health >= 50 ? 'degraded' : 'down'

    return {
      status,
      metrics: { ...this.metrics },
      controls: { ...this.controls },
    }
  }

  generateAdminReport(): string {
    let report = 'Admin Dashboard Report\n'
    report += '======================\n\n'

    report += 'Key Metrics:\n'
    report += `  Total Revenue: $${this.metrics.totalRevenue}\n`
    report += `  Total Orders: ${this.metrics.totalOrders}\n`
    report += `  Total Subscribers: ${this.metrics.totalSubscribers}\n`
    report += `  Conversion Rate: ${this.metrics.conversionRate}%\n`
    report += `  Churn Rate: ${this.metrics.churnRate}%\n\n`

    report += `System Health: ${this.metrics.systemHealth}%\n`
    report += `Maintenance Mode: ${this.controls.maintenanceMode ? 'ON' : 'OFF'}\n`
    report += `Active Users: ${this.metrics.activeUsers}\n`

    return report
  }
}

let globalAdminDashboard: AdminDashboard | null = null

export function initializeAdminDashboard(): AdminDashboard {
  if (!globalAdminDashboard) {
    globalAdminDashboard = new AdminDashboard()
  }
  return globalAdminDashboard
}

export function getAdminDashboard(): AdminDashboard {
  if (!globalAdminDashboard) {
    return initializeAdminDashboard()
  }
  return globalAdminDashboard
}
