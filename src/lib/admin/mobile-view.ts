/**
 * Admin Dashboard Mobile View
 * Semana 40, Tarea 40.11: Admin Dashboard Mobile View
 */

import { logger } from '@/lib/monitoring'

export interface MobileWidgetConfig {
  id: string
  type: 'metric' | 'chart' | 'list'
  title: string
  order: number
  visible: boolean
}

export interface MobileLayout {
  userId: string
  widgets: MobileWidgetConfig[]
  theme: 'light' | 'dark'
  compactMode: boolean
  updatedAt: Date
}

export class MobileViewManager {
  private layouts: Map<string, MobileLayout> = new Map()

  constructor() {
    logger.debug({ type: 'mobile_view_init' }, 'Mobile View Manager inicializado')
  }

  /**
   * Crear layout mobile
   */
  createLayout(userId: string, theme: 'light' | 'dark' = 'light'): MobileLayout {
    const layout: MobileLayout = {
      userId,
      widgets: [
        { id: 'metric_revenue', type: 'metric', title: 'Revenue', order: 1, visible: true },
        { id: 'metric_orders', type: 'metric', title: 'Orders', order: 2, visible: true },
        { id: 'list_recent', type: 'list', title: 'Recent', order: 3, visible: true },
      ],
      theme,
      compactMode: true,
      updatedAt: new Date(),
    }

    this.layouts.set(userId, layout)
    return layout
  }

  /**
   * Obtener layout
   */
  getLayout(userId: string): MobileLayout | null {
    return this.layouts.get(userId) || null
  }

  /**
   * Actualizar widget
   */
  updateWidget(userId: string, widgetId: string, updates: Partial<MobileWidgetConfig>): boolean {
    const layout = this.getLayout(userId)
    if (!layout) return false

    const widget = layout.widgets.find((w) => w.id === widgetId)
    if (!widget) return false

    Object.assign(widget, updates)
    layout.updatedAt = new Date()

    return true
  }
}

let globalMobileViewManager: MobileViewManager | null = null

export function initializeMobileViewManager(): MobileViewManager {
  if (!globalMobileViewManager) {
    globalMobileViewManager = new MobileViewManager()
  }
  return globalMobileViewManager
}

export function getMobileViewManager(): MobileViewManager {
  if (!globalMobileViewManager) {
    return initializeMobileViewManager()
  }
  return globalMobileViewManager
}
