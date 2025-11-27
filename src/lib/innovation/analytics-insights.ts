/**
 * Analytics & Insights Manager
 * Semana 54, Tarea 54.3: Advanced Analytics & Business Intelligence
 */

import { logger } from "@/lib/monitoring";

export interface DataInsight {
  id: string;
  insightType: "trend" | "anomaly" | "correlation" | "forecast";
  title: string;
  description: string;
  dataSource: string;
  confidence: number;
  actionableItems: string[];
  discoveredDate: Date;
  status: "new" | "reviewed" | "acted-upon";
}

export interface CustomDashboard {
  id: string;
  dashboardName: string;
  metrics: string[];
  filters: Record<string, any>;
  refreshInterval: number;
  owner: string;
  status: "active" | "archived";
}

export class AnalyticsInsightsManager {
  private insights: Map<string, DataInsight> = new Map();
  private dashboards: Map<string, CustomDashboard> = new Map();

  constructor() {
    logger.debug({ type: "analytics_insights_init" }, "Manager inicializado");
  }

  generateInsight(
    insightType: "trend" | "anomaly" | "correlation" | "forecast",
    title: string,
    description: string,
    dataSource: string,
    confidence: number,
    actionableItems: string[],
  ): DataInsight {
    const id = "insight_" + Date.now();
    const insight: DataInsight = {
      id,
      insightType,
      title,
      description,
      dataSource,
      confidence,
      actionableItems,
      discoveredDate: new Date(),
      status: "new",
    };

    this.insights.set(id, insight);
    logger.info({ type: "insight_generated", insightId: id }, `Insight generado: ${title}`);
    return insight;
  }

  createCustomDashboard(
    dashboardName: string,
    metrics: string[],
    filters: Record<string, any>,
    refreshInterval: number,
    owner: string,
  ): CustomDashboard {
    const id = "dashboard_" + Date.now();
    const dashboard: CustomDashboard = {
      id,
      dashboardName,
      metrics,
      filters,
      refreshInterval,
      owner,
      status: "active",
    };

    this.dashboards.set(id, dashboard);
    logger.info(
      { type: "custom_dashboard_created", dashboardId: id },
      `Dashboard personalizado creado: ${dashboardName}`,
    );
    return dashboard;
  }

  getStatistics(): Record<string, any> {
    const allInsights = Array.from(this.insights.values());

    return {
      totalInsights: allInsights.length,
      insightsByType: {
        trend: allInsights.filter((i) => i.insightType === "trend").length,
        anomaly: allInsights.filter((i) => i.insightType === "anomaly").length,
        correlation: allInsights.filter((i) => i.insightType === "correlation").length,
        forecast: allInsights.filter((i) => i.insightType === "forecast").length,
      },
      totalDashboards: this.dashboards.size,
      averageConfidence:
        allInsights.length > 0
          ? allInsights.reduce((sum, i) => sum + i.confidence, 0) / allInsights.length
          : 0,
    };
  }

  generateAnalyticsReport(): string {
    const stats = this.getStatistics();
    return `Analytics & Insights Report\nInsights: ${stats.totalInsights}\nDashboards: ${stats.totalDashboards}\nAvg Confidence: ${stats.averageConfidence.toFixed(2)}%`;
  }
}

let globalAnalyticsInsightsManager: AnalyticsInsightsManager | null = null;

export function getAnalyticsInsightsManager(): AnalyticsInsightsManager {
  if (!globalAnalyticsInsightsManager) {
    globalAnalyticsInsightsManager = new AnalyticsInsightsManager();
  }
  return globalAnalyticsInsightsManager;
}
