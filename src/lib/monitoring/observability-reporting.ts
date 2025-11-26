/**
 * Observability Reporting Manager
 * Semana 45, Tarea 45.12: Observability Reporting
 */

import { logger } from "@/lib/monitoring";

export interface ObservabilityReport {
  id: string;
  type: "daily" | "weekly" | "monthly";
  timestamp: Date;
  metrics: Record<string, number>;
  alerts: number;
  errors: number;
  recommendations: string[];
}

export interface ReportSchedule {
  id: string;
  reportType: string;
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];
  enabled: boolean;
}

export class ObservabilityReportingManager {
  private reports: Map<string, ObservabilityReport> = new Map();
  private schedules: Map<string, ReportSchedule> = new Map();

  constructor() {
    logger.debug({ type: "reporting_init" }, "Observability Reporting Manager inicializado");
  }

  generateReport(
    type: string,
    metrics: Record<string, number>,
    alerts: number,
    errors: number,
  ): ObservabilityReport {
    const report: ObservabilityReport = {
      id: `report_${Date.now()}`,
      type: type as any,
      timestamp: new Date(),
      metrics,
      alerts,
      errors,
      recommendations: [],
    };

    if (errors > 100) {
      report.recommendations.push("Alto número de errores detectado");
    }
    if (alerts > 50) {
      report.recommendations.push("Múltiples alertas activas");
    }

    this.reports.set(report.id, report);
    logger.info({ type: "report_generated" }, `Reporte generado: ${type}`);
    return report;
  }

  scheduleReport(reportType: string, frequency: string, recipients: string[]): ReportSchedule {
    const schedule: ReportSchedule = {
      id: `schedule_${Date.now()}`,
      reportType,
      frequency: frequency as any,
      recipients,
      enabled: true,
    };
    this.schedules.set(schedule.id, schedule);
    logger.info({ type: "schedule_created" }, `Reporte programado: ${reportType}`);
    return schedule;
  }

  getReport(reportId: string): ObservabilityReport | null {
    return this.reports.get(reportId) || null;
  }

  getRecentReports(limit: number = 10): ObservabilityReport[] {
    return Array.from(this.reports.values()).slice(-limit);
  }

  disableSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;
    schedule.enabled = false;
    logger.info({ type: "schedule_disabled" }, "Reporte deshabilitado");
    return true;
  }

  getStatistics() {
    return {
      totalReports: this.reports.size,
      activeSchedules: Array.from(this.schedules.values()).filter((s) => s.enabled).length,
      totalSchedules: this.schedules.size,
    };
  }
}

let globalReportingManager: ObservabilityReportingManager | null = null;

export function getObservabilityReportingManager(): ObservabilityReportingManager {
  if (!globalReportingManager) {
    globalReportingManager = new ObservabilityReportingManager();
  }
  return globalReportingManager;
}
