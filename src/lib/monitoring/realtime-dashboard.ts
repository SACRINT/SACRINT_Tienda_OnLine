/**
 * Real-time Dashboard Manager
 * Semana 45, Tarea 45.5: Real-time Dashboard
 */

import { logger } from "@/lib/monitoring";

export interface DashboardWidget {
  id: string;
  type: "metric" | "chart" | "table" | "gauge" | "heatmap";
  title: string;
  data: any;
  refreshInterval: number;
  position: { x: number; y: number };
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

export class RealtimeDashboardManager {
  private dashboards: Map<string, Dashboard> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private subscriptions: Map<string, string[]> = new Map();

  constructor() {
    logger.debug({ type: "dashboard_init" }, "Real-time Dashboard Manager inicializado");
  }

  createDashboard(name: string, isPublic: boolean = false): Dashboard {
    const dashboard: Dashboard = {
      id: `dash_${Date.now()}`,
      name,
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic,
    };
    this.dashboards.set(dashboard.id, dashboard);
    logger.info({ type: "dashboard_created" }, `Dashboard creado: ${name}`);
    return dashboard;
  }

  addWidget(dashboardId: string, widget: DashboardWidget): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;
    dashboard.widgets.push(widget);
    this.widgets.set(widget.id, widget);
    dashboard.updatedAt = new Date();
    logger.debug({ type: "widget_added" }, `Widget agregado: ${widget.title}`);
    return true;
  }

  updateWidgetData(widgetId: string, data: any): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;
    widget.data = data;
    logger.debug({ type: "widget_updated" }, "Widget actualizado");
    return true;
  }

  getDashboard(dashboardId: string): Dashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  subscribeToDashboard(dashboardId: string, userId: string): void {
    if (!this.subscriptions.has(dashboardId)) {
      this.subscriptions.set(dashboardId, []);
    }
    this.subscriptions.get(dashboardId)?.push(userId);
    logger.debug({ type: "subscription_created" }, `Usuario suscrito al dashboard`);
  }

  getStatistics() {
    return {
      totalDashboards: this.dashboards.size,
      totalWidgets: this.widgets.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((a, b) => a + b.length, 0),
    };
  }
}

let globalDashboardManager: RealtimeDashboardManager | null = null;

export function getRealtimeDashboardManager(): RealtimeDashboardManager {
  if (!globalDashboardManager) {
    globalDashboardManager = new RealtimeDashboardManager();
  }
  return globalDashboardManager;
}
