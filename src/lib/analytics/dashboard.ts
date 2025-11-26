/**
 * Dashboard Analytics - Layout & Core Components
 * Semana 33, Tarea 33.1: Layout principal y componentes base para dashboards
 */

import { logger } from '@/lib/monitoring'

/**
 * Configuración de widget
 */
export interface DashboardWidget {
  id: string
  name: string
  type: 'card' | 'chart' | 'table' | 'metric' | 'gauge' | 'timeline'
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  refreshInterval?: number // segundos
  dataSource: string
  config?: Record<string, any>
  isEditable: boolean
}

/**
 * Layout de dashboard
 */
export interface DashboardLayout {
  id: string
  tenantId: string
  name: string
  description?: string
  type: 'email' | 'analytics' | 'admin' | 'business' | 'operations'
  widgets: DashboardWidget[]
  defaultMetrics: string[]
  theme?: 'light' | 'dark'
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Card de métrica
 */
export interface MetricCard {
  title: string
  value: number | string
  unit?: string
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  icon?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  onClick?: () => void
}

/**
 * Datos de gráfico
 */
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    tension?: number
  }>
}

/**
 * Manager de dashboards
 */
export class DashboardManager {
  private dashboards: Map<string, DashboardLayout> = new Map()
  private widgets: Map<string, DashboardWidget> = new Map()
  private userPreferences: Map<string, { dashboardId: string; widgets: DashboardWidget[] }> = new Map()

  constructor() {
    logger.debug({ type: 'dashboard_manager_init' }, 'Dashboard Manager inicializado')
  }

  /**
   * Crear dashboard
   */
  createDashboard(
    tenantId: string,
    data: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>,
  ): DashboardLayout {
    const dashboard: DashboardLayout = {
      ...data,
      id: `dash-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.dashboards.set(dashboard.id, dashboard)

    logger.debug(
      { type: 'dashboard_created', dashboardId: dashboard.id, tenantId },
      `Dashboard creado: ${dashboard.name}`,
    )

    return dashboard
  }

  /**
   * Obtener dashboard
   */
  getDashboard(dashboardId: string): DashboardLayout | null {
    return this.dashboards.get(dashboardId) || null
  }

  /**
   * Actualizar dashboard
   */
  updateDashboard(dashboardId: string, updates: Partial<DashboardLayout>): DashboardLayout {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) {
      throw new Error(`Dashboard no encontrado: ${dashboardId}`)
    }

    Object.assign(dashboard, updates, { updatedAt: new Date() })

    logger.debug({ type: 'dashboard_updated', dashboardId }, 'Dashboard actualizado')

    return dashboard
  }

  /**
   * Agregar widget
   */
  addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): DashboardWidget {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) {
      throw new Error(`Dashboard no encontrado: ${dashboardId}`)
    }

    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }

    dashboard.widgets.push(newWidget)
    this.widgets.set(newWidget.id, newWidget)

    logger.debug(
      { type: 'widget_added', dashboardId, widgetType: widget.type },
      `Widget agregado: ${widget.title}`,
    )

    return newWidget
  }

  /**
   * Actualizar widget
   */
  updateWidget(widgetId: string, updates: Partial<DashboardWidget>): DashboardWidget {
    const widget = this.widgets.get(widgetId)
    if (!widget) {
      throw new Error(`Widget no encontrado: ${widgetId}`)
    }

    Object.assign(widget, updates)

    logger.debug({ type: 'widget_updated', widgetId }, 'Widget actualizado')

    return widget
  }

  /**
   * Eliminar widget
   */
  deleteWidget(dashboardId: string, widgetId: string): void {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) {
      throw new Error(`Dashboard no encontrado: ${dashboardId}`)
    }

    dashboard.widgets = dashboard.widgets.filter((w) => w.id !== widgetId)
    this.widgets.delete(widgetId)

    logger.debug({ type: 'widget_deleted', widgetId }, 'Widget eliminado')
  }

  /**
   * Reordenar widgets
   */
  reorderWidgets(dashboardId: string, widgetIds: string[]): void {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) {
      throw new Error(`Dashboard no encontrado: ${dashboardId}`)
    }

    const widgetMap = new Map(dashboard.widgets.map((w) => [w.id, w]))
    dashboard.widgets = widgetIds.map((id) => widgetMap.get(id)!).filter(Boolean)
    dashboard.updatedAt = new Date()

    logger.debug({ type: 'widgets_reordered', dashboardId }, 'Widgets reordenados')
  }

  /**
   * Listar dashboards por tenant
   */
  listDashboards(tenantId: string, type?: string): DashboardLayout[] {
    return Array.from(this.dashboards.values()).filter(
      (d) => d.tenantId === tenantId && (!type || d.type === type),
    )
  }

  /**
   * Obtener dashboard por defecto
   */
  getDefaultDashboard(tenantId: string, type: string): DashboardLayout | null {
    const dashboards = this.listDashboards(tenantId, type)
    return dashboards.find((d) => d.isDefault) || null
  }

  /**
   * Guardar preferencias de usuario
   */
  saveUserPreference(userId: string, dashboardId: string, widgets: DashboardWidget[]): void {
    this.userPreferences.set(userId, { dashboardId, widgets })

    logger.debug(
      { type: 'user_preference_saved', userId, dashboardId },
      'Preferencias de usuario guardadas',
    )
  }

  /**
   * Obtener preferencias de usuario
   */
  getUserPreference(userId: string): { dashboardId: string; widgets: DashboardWidget[] } | null {
    return this.userPreferences.get(userId) || null
  }

  /**
   * Crear métrica card
   */
  createMetricCard(data: MetricCard): string {
    const html = `
      <div class="metric-card ${data.color || 'blue'}">
        <div class="metric-card-header">
          <h3>${data.title}</h3>
          ${data.icon ? `<span class="icon">${data.icon}</span>` : ''}
        </div>
        <div class="metric-card-value">
          <span class="value">${data.value}</span>
          ${data.unit ? `<span class="unit">${data.unit}</span>` : ''}
        </div>
        ${
          data.trend
            ? `
          <div class="metric-card-trend ${data.trend.direction}">
            <span class="trend-arrow">${data.trend.direction === 'up' ? '↑' : data.trend.direction === 'down' ? '↓' : '→'}</span>
            <span class="trend-value">${data.trend.value}%</span>
          </div>
        `
            : ''
        }
      </div>
    `

    return html
  }

  /**
   * Generar layout HTML
   */
  generateLayoutHTML(dashboardId: string): string {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) return ''

    let html = `<div class="dashboard-layout ${dashboard.theme || 'light'}">`
    html += `<h1>${dashboard.name}</h1>`

    if (dashboard.description) {
      html += `<p class="description">${dashboard.description}</p>`
    }

    html += `<div class="widgets-grid">`

    for (const widget of dashboard.widgets) {
      const style = `grid-column: span ${widget.size.width}; grid-row: span ${widget.size.height};`
      html += `<div class="widget ${widget.type}" style="${style}" data-widget-id="${widget.id}">`
      html += `<h2>${widget.title}</h2>`
      html += `<div class="widget-content"></div>`
      html += `</div>`
    }

    html += `</div></div>`

    return html
  }

  /**
   * Exportar dashboard como JSON
   */
  exportDashboard(dashboardId: string): string {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) return ''

    return JSON.stringify(dashboard, null, 2)
  }

  /**
   * Importar dashboard desde JSON
   */
  importDashboard(tenantId: string, jsonData: string): DashboardLayout {
    try {
      const data = JSON.parse(jsonData)
      const dashboard = this.createDashboard(tenantId, {
        ...data,
        id: undefined, // Generar nuevo ID
      })

      logger.info(
        { type: 'dashboard_imported', dashboardId: dashboard.id },
        'Dashboard importado',
      )

      return dashboard
    } catch (error) {
      logger.error({ type: 'import_error', error }, 'Error importando dashboard')
      throw error
    }
  }

  /**
   * Duplicar dashboard
   */
  duplicateDashboard(dashboardId: string, newName: string): DashboardLayout {
    const original = this.dashboards.get(dashboardId)
    if (!original) {
      throw new Error(`Dashboard no encontrado: ${dashboardId}`)
    }

    const duplicate = this.createDashboard(original.tenantId, {
      ...original,
      name: newName,
      isDefault: false,
    })

    // Duplicar widgets
    for (const widget of original.widgets) {
      const newWidget = { ...widget, id: undefined } as any
      this.addWidget(duplicate.id, newWidget)
    }

    logger.debug(
      { type: 'dashboard_duplicated', original: dashboardId, duplicate: duplicate.id },
      `Dashboard duplicado: ${newName}`,
    )

    return duplicate
  }
}

/**
 * Instancia global
 */
let globalManager: DashboardManager | null = null

/**
 * Inicializar globalmente
 */
export function initializeDashboardManager(): DashboardManager {
  if (!globalManager) {
    globalManager = new DashboardManager()
  }
  return globalManager
}

/**
 * Obtener manager global
 */
export function getDashboardManager(): DashboardManager {
  if (!globalManager) {
    return initializeDashboardManager()
  }
  return globalManager
}
