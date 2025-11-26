/**
 * Maintenance Reporting Manager
 * Semana 53, Tarea 53.12: Maintenance Reports & Metrics
 */

import { logger } from "@/lib/monitoring"

export interface MaintenanceReport {
  id: string
  reportDate: Date
  reportingPeriod: string
  totalIncidents: number
  resolvedIncidents: number
  averageResolutionTime: number
  systemUptime: number
  maintenanceActivities: MaintenanceActivity[]
  metrics: MaintenanceMetrics
}

export interface MaintenanceActivity {
  id: string
  activityType: string
  description: string
  duration: number
  impact: "none" | "low" | "medium" | "high"
  performedDate: Date
  performedBy: string
}

export interface MaintenanceMetrics {
  mttr: number
  mtbf: number
  availability: number
  sla Compliance: number
  incidentTrend: "improving" | "stable" | "declining"
  effectivenessScore: number
}

export class MaintenanceReportingManager {
  private maintenanceReports: Map<string, MaintenanceReport> = new Map()
  private activities: Map<string, MaintenanceActivity> = new Map()
  private historicalMetrics: MaintenanceMetrics[] = []

  constructor() {
    logger.debug({ type: "maintenance_reporting_init" }, "Manager inicializado")
  }

  recordMaintenanceActivity(
    activityType: string,
    description: string,
    duration: number,
    impact: "none" | "low" | "medium" | "high",
    performedBy: string
  ): MaintenanceActivity {
    const id = "activity_" + Date.now()
    const activity: MaintenanceActivity = {
      id,
      activityType,
      description,
      duration,
      impact,
      performedDate: new Date(),
      performedBy,
    }

    this.activities.set(id, activity)
    logger.info(
      { type: "maintenance_activity_recorded", activityId: id },
      `Actividad de mantenimiento registrada: ${activityType}`
    )
    return activity
  }

  generateMaintenanceReport(
    reportingPeriod: string,
    totalIncidents: number,
    resolvedIncidents: number,
    averageResolutionTime: number,
    systemUptime: number
  ): MaintenanceReport {
    const id = "report_" + Date.now()

    const metrics: MaintenanceMetrics = {
      mttr: averageResolutionTime,
      mtbf: totalIncidents > 0 ? (24 * 30) / totalIncidents : 999,
      availability: systemUptime,
      slaCompliance: (resolvedIncidents / totalIncidents) * 100 || 0,
      incidentTrend: this.historicalMetrics.length > 0
        ? this.historicalMetrics[this.historicalMetrics.length - 1]
            .effectivenessScore < this.calculateCurrentEffectiveness(systemUptime)
          ? "improving"
          : "declining"
        : "stable",
      effectivenessScore: this.calculateCurrentEffectiveness(systemUptime),
    }

    const report: MaintenanceReport = {
      id,
      reportDate: new Date(),
      reportingPeriod,
      totalIncidents,
      resolvedIncidents,
      averageResolutionTime,
      systemUptime,
      maintenanceActivities: Array.from(this.activities.values()),
      metrics,
    }

    this.maintenanceReports.set(id, report)
    this.historicalMetrics.push(metrics)
    logger.info(
      { type: "maintenance_report_generated", reportId: id },
      `Reporte de mantenimiento generado: ${reportingPeriod}`
    )
    return report
  }

  private calculateCurrentEffectiveness(uptime: number): number {
    return uptime / 100 * 100
  }

  getReportByPeriod(period: string): MaintenanceReport | null {
    return (
      Array.from(this.maintenanceReports.values()).find(
        (r) => r.reportingPeriod === period
      ) || null
    )
  }

  getStatistics(): Record<string, unknown> {
    const reports = Array.from(this.maintenanceReports.values())
    const activities = Array.from(this.activities.values())

    const avgMTTR =
      reports.length > 0
        ? reports.reduce((sum, r) => sum + r.averageResolutionTime, 0) / reports.length
        : 0

    const avgUptime =
      reports.length > 0
        ? reports.reduce((sum, r) => sum + r.systemUptime, 0) / reports.length
        : 0

    return {
      totalReports: reports.length,
      totalMaintenanceActivities: activities.length,
      activitiesByImpact: {
        none: activities.filter((a) => a.impact === "none").length,
        low: activities.filter((a) => a.impact === "low").length,
        medium: activities.filter((a) => a.impact === "medium").length,
        high: activities.filter((a) => a.impact === "high").length,
      },
      averageMTTR: avgMTTR,
      averageSystemUptime: avgUptime,
      totalIncidentsAcrossReports: reports.reduce(
        (sum, r) => sum + r.totalIncidents,
        0
      ),
      averageResolutionRate:
        reports.length > 0
          ? reports.reduce((sum, r) => sum + (r.resolvedIncidents / r.totalIncidents) * 100, 0) / reports.length
          : 0,
    }
  }

  generateMaintenanceMetricsReport(): string {
    const stats = this.getStatistics()
    return `Maintenance Metrics Report\nReports: ${stats.totalReports}\nAvg MTTR: ${stats.averageMTTR.toFixed(2)} hours\nAvg Uptime: ${stats.averageSystemUptime.toFixed(2)}%\nResolution Rate: ${stats.averageResolutionRate.toFixed(2)}%`
  }
}

let globalMaintenanceReportingManager: MaintenanceReportingManager | null = null

export function getMaintenanceReportingManager(): MaintenanceReportingManager {
  if (!globalMaintenanceReportingManager) {
    globalMaintenanceReportingManager = new MaintenanceReportingManager()
  }
  return globalMaintenanceReportingManager
}
