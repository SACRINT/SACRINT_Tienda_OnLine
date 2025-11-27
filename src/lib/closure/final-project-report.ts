/**
 * Final Project Report Manager
 * Semana 52, Tarea 52.12: Final Project Report & Executive Summary
 */

import { logger } from "@/lib/monitoring";

export interface FinalProjectReport {
  id: string;
  projectId: string;
  projectName: string;
  reportDate: Date;
  reportingPeriod: string;
  executiveSummary: string;
  projectScope: string;
  projectObjectives: string[];
  achievements: Achievement[];
  challenges: Challenge[];
  recommendations: string[];
  preparedBy: string;
  approvedBy?: string;
  reportStatus: "draft" | "submitted" | "approved";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  evidence: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  impact: "critical" | "significant" | "minor";
  resolution: string;
  lessons: string[];
}

export interface ProjectClosure {
  id: string;
  projectId: string;
  projectName: string;
  closureDate: Date;
  closureReason: "successful-completion" | "scope-reduction" | "cancelled" | "merged";
  finalStatus: string;
  signoffBy: string;
  signoffDate?: Date;
  closureNotes: string;
}

export class FinalProjectReportManager {
  private reports: Map<string, FinalProjectReport> = new Map();
  private projectionClosures: Map<string, ProjectClosure> = new Map();
  private reportArchive: FinalProjectReport[] = [];

  constructor() {
    logger.debug({ type: "final_project_report_init" }, "Manager inicializado");
  }

  createFinalProjectReport(
    projectId: string,
    projectName: string,
    reportingPeriod: string,
    executiveSummary: string,
    projectScope: string,
    projectObjectives: string[],
    recommendations: string[],
    preparedBy: string,
  ): FinalProjectReport {
    const id = "report_" + Date.now();
    const report: FinalProjectReport = {
      id,
      projectId,
      projectName,
      reportDate: new Date(),
      reportingPeriod,
      executiveSummary,
      projectScope,
      projectObjectives,
      achievements: [],
      challenges: [],
      recommendations,
      preparedBy,
      reportStatus: "draft",
    };

    this.reports.set(id, report);
    logger.info(
      { type: "final_report_created", reportId: id },
      `Reporte final creado: ${projectName}`,
    );
    return report;
  }

  addAchievement(
    reportId: string,
    title: string,
    description: string,
    impact: "high" | "medium" | "low",
    evidence: string,
  ): Achievement | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const achievement: Achievement = {
      id: "achievement_" + Date.now(),
      title,
      description,
      impact,
      evidence,
    };

    report.achievements.push(achievement);
    logger.info({ type: "achievement_added", reportId }, `Logro agregado: ${title}`);
    return achievement;
  }

  addChallenge(
    reportId: string,
    title: string,
    description: string,
    impact: "critical" | "significant" | "minor",
    resolution: string,
    lessons: string[],
  ): Challenge | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const challenge: Challenge = {
      id: "challenge_" + Date.now(),
      title,
      description,
      impact,
      resolution,
      lessons,
    };

    report.challenges.push(challenge);
    logger.info({ type: "challenge_added", reportId }, `Desafío agregado: ${title}`);
    return challenge;
  }

  submitReport(reportId: string): FinalProjectReport | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.reportStatus = "submitted";
    this.reports.set(reportId, report);
    logger.info({ type: "report_submitted", reportId }, `Reporte presentado`);
    return report;
  }

  approveReport(reportId: string, approvedBy: string): FinalProjectReport | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.reportStatus = "approved";
    report.approvedBy = approvedBy;
    this.reports.set(reportId, report);
    this.reportArchive.push(report);

    logger.info({ type: "report_approved", reportId }, `Reporte aprobado`);
    return report;
  }

  closeProject(
    projectId: string,
    projectName: string,
    closureReason: "successful-completion" | "scope-reduction" | "cancelled" | "merged",
    finalStatus: string,
    signoffBy: string,
    closureNotes: string,
  ): ProjectClosure {
    const id = "closure_" + Date.now();
    const closure: ProjectClosure = {
      id,
      projectId,
      projectName,
      closureDate: new Date(),
      closureReason,
      finalStatus,
      signoffBy,
      closureNotes,
    };

    this.projectionClosures.set(id, closure);
    logger.info({ type: "project_closed", closureId: id }, `Proyecto cerrado: ${projectName}`);
    return closure;
  }

  signoffProjectClosure(closureId: string): ProjectClosure | null {
    const closure = this.projectionClosures.get(closureId);
    if (!closure) return null;

    closure.signoffDate = new Date();
    this.projectionClosures.set(closureId, closure);
    logger.info({ type: "closure_signoff", closureId }, `Cierre autorizado`);
    return closure;
  }

  getReportsByStatus(status: "draft" | "submitted" | "approved"): FinalProjectReport[] {
    return Array.from(this.reports.values()).filter((r) => r.reportStatus === status);
  }

  getArchivedReports(): FinalProjectReport[] {
    return this.reportArchive;
  }

  getStatistics(): Record<string, any> {
    const reports = Array.from(this.reports.values());
    const closures = Array.from(this.projectionClosures.values());

    return {
      totalReports: reports.length,
      reportsByStatus: {
        draft: reports.filter((r) => r.reportStatus === "draft").length,
        submitted: reports.filter((r) => r.reportStatus === "submitted").length,
        approved: reports.filter((r) => r.reportStatus === "approved").length,
      },
      totalAchievements: reports.reduce((sum, r) => sum + r.achievements.length, 0),
      totalChallenges: reports.reduce((sum, r) => sum + r.challenges.length, 0),
      totalProjectClosures: closures.length,
      closuresByReason: {
        successfulCompletion: closures.filter((c) => c.closureReason === "successful-completion")
          .length,
        scopeReduction: closures.filter((c) => c.closureReason === "scope-reduction").length,
        cancelled: closures.filter((c) => c.closureReason === "cancelled").length,
        merged: closures.filter((c) => c.closureReason === "merged").length,
      },
      projectsWithSignoff: closures.filter((c) => c.signoffDate).length,
    };
  }

  generateFinalReport(): string {
    const stats = this.getStatistics();
    const archivedCount = this.reportArchive.length;

    let report = "FINAL PROJECT REPORT SUMMARY\n";
    report += "=".repeat(50) + "\n";
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `Total Reports: ${stats.totalReports}\n`;
    report += `Approved Reports: ${stats.reportsByStatus.approved}\n`;
    report += `Total Achievements: ${stats.totalAchievements}\n`;
    report += `Total Challenges: ${stats.totalChallenges}\n`;
    report += `Project Closures: ${stats.totalProjectClosures}\n`;
    report += `Successful Completions: ${stats.closuresByReason.successfulCompletion}\n`;
    report += `Archived Reports: ${archivedCount}\n`;

    return report;
  }
}

let globalFinalProjectReportManager: FinalProjectReportManager | null = null;

export function getFinalProjectReportManager(): FinalProjectReportManager {
  if (!globalFinalProjectReportManager) {
    globalFinalProjectReportManager = new FinalProjectReportManager();
  }
  return globalFinalProjectReportManager;
}
