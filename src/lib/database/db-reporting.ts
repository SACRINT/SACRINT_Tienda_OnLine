/**
 * Database Reporting Manager
 * Semana 44, Tarea 44.12: Database Reporting
 */

import { logger } from "@/lib/monitoring";

export interface DatabaseReport {
  id: string;
  title: string;
  type: "performance" | "health" | "usage" | "optimization";
  generatedAt: Date;
  content: string;
  metrics: Record<string, any>;
}

export interface ReportSchedule {
  reportType: string;
  frequency: "daily" | "weekly" | "monthly";
  recipientEmails: string[];
}

export class DatabaseReportingManager {
  private reports: Map<string, DatabaseReport> = new Map();
  private schedules: Map<string, ReportSchedule> = new Map();

  constructor() {
    logger.debug({ type: "reporting_init" }, "Manager inicializado");
  }

  generateReport(type: string, metrics: Record<string, any>): DatabaseReport {
    const report: DatabaseReport = {
      id: `report_${Date.now()}`,
      title: `${type} Report`,
      type: type as any,
      generatedAt: new Date(),
      content: `Report for ${type}`,
      metrics,
    };
    this.reports.set(report.id, report);
    logger.info({ type: "report_generated" }, `Reporte: ${type}`);
    return report;
  }

  scheduleReport(reportType: string, frequency: string, recipients: string[]): void {
    const schedule: ReportSchedule = {
      reportType,
      frequency: frequency as any,
      recipientEmails: recipients,
    };
    this.schedules.set(reportType, schedule);
    logger.info({ type: "report_scheduled" }, `Programado: ${reportType}`);
  }

  getReport(reportId: string): DatabaseReport | null {
    return this.reports.get(reportId) || null;
  }

  getRecentReports(limit: number = 5): DatabaseReport[] {
    return Array.from(this.reports.values()).slice(-limit);
  }

  getSchedules(): Map<string, ReportSchedule> {
    return this.schedules;
  }
}

let globalReportingManager: DatabaseReportingManager | null = null;

export function getDatabaseReportingManager(): DatabaseReportingManager {
  if (!globalReportingManager) {
    globalReportingManager = new DatabaseReportingManager();
  }
  return globalReportingManager;
}
