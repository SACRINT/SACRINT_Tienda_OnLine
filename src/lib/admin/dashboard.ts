/**
 * Advanced Admin Dashboard
 * Semana 40, Tarea 40.1: Advanced Admin Dashboard
 */

import { logger } from '@/lib/monitoring'

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'card' | 'timeline' | 'map'
  title: string
  position: { x: number; y: number; width: number; height: number }
  data?: any
  refreshInterval?: number
}

export interface AdminDashboard {
  id: string
  userId: string
  name: string
  widgets: DashboardWidget[]
  theme: 'light' | 'dark' | 'auto'
  layout: 'grid' | 'flex'
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DashboardMetric {
  label: string
  value: number | string
  change: number
  trend: 'up' | 'down' | 'stable'
  target?: number
  icon?: string
}

export interface DashboardData {
  metrics: Record<string, DashboardMetric>
  charts: Record<string, any>
  recentActivity: any[]
  alerts: any[]
  kpis: Record<string, number>
}

export class AdminDashboardManager {
  private dashboards: Map<string, AdminDashboard> = new Map()
  private dashboardData: Map<string, DashboardData> = new Map()
  private widgetTemplates: Map<string, DashboardWidget> = new Map()

  constructor() {
    logger.debug({ type: 'admin_dashboard_init' }, 'Admin Dashboard Manager inicializado')
    this.initializeDefaultTemplates()
  }

  /**
   * Inicializar templates por defecto
   */
  private initializeDefaultTemplates(): void {
    const templates: DashboardWidget[] = [
      {
        id: 'revenue_metric',
        type: 'metric',
        title: 'Total Revenue',
        position: { x: 0, y: 0, width: 3, height: 2 },
        refreshInterval: 300000,
      },
      {
        id: 'orders_metric',
        type: 'metric',
        title: 'Total Orders',
        position: { x: 3, y: 0, width: 3, height: 2 },
        refreshInterval: 300000,
      },
      {
        id: 'customers_metric',
        type: 'metric',
        title: 'Active Customers',
        position: { x: 6, y: 0, width: 3, height: 2 },
        refreshInterval: 300000,
      },
      {
        id: 'revenue_chart',
        type: 'chart',
        title: 'Revenue Trend',
        position: { x: 0, y: 2, width: 6, height: 4 },
        refreshInterval: 600000,
      },
      {
        id: 'recent_orders',
        type: 'table',
        title: 'Recent Orders',
        position: { x: 6, y: 2, width: 3, height: 4 },
        refreshInterval: 180000,
      },
    ]

    for (const template of templates) {
      this.widgetTemplates.set(template.id, template)
    }
  }

  /**
   * Crear dashboard
   */
  createDashboard(userId: string, name: string, isDefault: boolean = false): AdminDashboard {
    try {
      const dashboard: AdminDashboard = {
        id: `dash_${Date.now()}_${Math.random()}`,
        userId,
        name,
        widgets: Array.from(this.widgetTemplates.values()),
        theme: 'auto',
        layout: 'grid',
        isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.dashboards.set(dashboard.id, dashboard)
      this.dashboardData.set(dashboard.id, this.generateDashboardData())

      logger.info(
        { type: 'dashboard_created', dashboardId: dashboard.id, userId, name },
        `Dashboard creado: ${name}`,
      )

      return dashboard
    } catch (error) {
      logger.error({ type: 'dashboard_creation_error', userId, error: String(error) }, 'Error al crear dashboard')
      throw error
    }
  }

  /**
   * Generar datos de dashboard
   */
  private generateDashboardData(): DashboardData {
    return {
      metrics: {
        revenue: { label: 'Ingresos', value: `$${(Math.random() * 100000).toFixed(2)}`, change: 15.3, trend: 'up', target: 100000 },
        orders: { label: 'Órdenes', value: Math.floor(Math.random() * 1000), change: 8.2, trend: 'up' },
        customers: { label: 'Clientes', value: Math.floor(Math.random() * 5000), change: 12.5, trend: 'up' },
        conversion: {
          label: 'Conversión',
          value: `${(Math.random() * 5 + 1).toFixed(2)}%`,
          change: 2.1,
          trend: 'stable',
        },
      },
      charts: {
        revenueChart: { type: 'line', data: [] },
        ordersChart: { type: 'bar', data: [] },
      },
      recentActivity: [],
      alerts: [],
      kpis: {
        dailyRevenue: Math.random() * 50000,
        orderCount: Math.floor(Math.random() * 500),
        customerChurn: Math.random() * 5,
      },
    }
  }

  /**
   * Obtener dashboard
   */
  getDashboard(dashboardId: string): AdminDashboard | null {
    return this.dashboards.get(dashboardId) || null
  }

  /**
   * Obtener datos de dashboard
   */
  getDashboardData(dashboardId: string): DashboardData | null {
    return this.dashboardData.get(dashboardId) || null
  }

  /**
   * Actualizar widget
   */
  updateWidget(dashboardId: string, widget: DashboardWidget): boolean {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) return false

    const index = dashboard.widgets.findIndex((w) => w.id === widget.id)
    if (index >= 0) {
      dashboard.widgets[index] = widget
      dashboard.updatedAt = new Date()

      logger.debug({ type: 'widget_updated', dashboardId, widgetId: widget.id }, 'Widget actualizado')
      return true
    }

    return false
  }

  /**
   * Agregar widget
   */
  addWidget(dashboardId: string, widget: DashboardWidget): boolean {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) return false

    dashboard.widgets.push(widget)
    dashboard.updatedAt = new Date()

    logger.debug({ type: 'widget_added', dashboardId, widgetId: widget.id }, 'Widget agregado')
    return true
  }

  /**
   * Remover widget
   */
  removeWidget(dashboardId: string, widgetId: string): boolean {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) return false

    const index = dashboard.widgets.findIndex((w) => w.id === widgetId)
    if (index >= 0) {
      dashboard.widgets.splice(index, 1)
      dashboard.updatedAt = new Date()

      logger.debug({ type: 'widget_removed', dashboardId, widgetId }, 'Widget removido')
      return true
    }

    return false
  }

  /**
   * Obtener dashboards de usuario
   */
  getUserDashboards(userId: string): AdminDashboard[] {
    return Array.from(this.dashboards.values()).filter((d) => d.userId === userId)
  }

  /**
   * Obtener dashboard por defecto
   */
  getDefaultDashboard(userId: string): AdminDashboard | null {
    const dashboards = this.getUserDashboards(userId)
    return dashboards.find((d) => d.isDefault) || null
  }

  /**
   * Exportar dashboard
   */
  exportDashboard(dashboardId: string): string {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) return ''

    return JSON.stringify(dashboard, null, 2)
  }

  /**
   * Importar dashboard
   */
  importDashboard(userId: string, json: string): AdminDashboard | null {
    try {
      const data = JSON.parse(json)
      const dashboard: AdminDashboard = {
        id: `dash_${Date.now()}`,
        userId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.dashboards.set(dashboard.id, dashboard)
      this.dashboardData.set(dashboard.id, this.generateDashboardData())

      return dashboard
    } catch (error) {
      logger.error({ type: 'dashboard_import_error', userId, error: String(error) }, 'Error al importar dashboard')
      return null
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalDashboards: number; totalWidgets: number; activeUsers: number } {
    const dashboards = Array.from(this.dashboards.values())
    const totalWidgets = dashboards.reduce((sum, d) => sum + d.widgets.length, 0)
    const activeUsers = new Set(dashboards.map((d) => d.userId)).size

    return {
      totalDashboards: dashboards.length,
      totalWidgets,
      activeUsers,
    }
  }
}

let globalAdminDashboardManager: AdminDashboardManager | null = null

export function initializeAdminDashboardManager(): AdminDashboardManager {
  if (!globalAdminDashboardManager) {
    globalAdminDashboardManager = new AdminDashboardManager()
  }
  return globalAdminDashboardManager
}

export function getAdminDashboardManager(): AdminDashboardManager {
  if (!globalAdminDashboardManager) {
    return initializeAdminDashboardManager()
  }
  return globalAdminDashboardManager
}
