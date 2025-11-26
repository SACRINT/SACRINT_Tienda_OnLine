/**
 * Security Code Review Manager
 * Semana 49, Tarea 49.2: Security Code Review
 */

import { logger } from "@/lib/monitoring";

export interface SecurityFinding {
  id: string;
  type: "vulnerability" | "weakness" | "best_practice";
  severity: "low" | "medium" | "high" | "critical";
  cweId?: string;
  description: string;
  location: string;
  remediation: string;
}

export interface SecurityAuditReport {
  id: string;
  timestamp: Date;
  findings: SecurityFinding[];
  vulnerabilityCount: number;
  riskScore: number;
  canDeployToProd: boolean;
}

export class SecurityCodeReviewManager {
  private findings: Map<string, SecurityFinding> = new Map();
  private reports: Map<string, SecurityAuditReport> = new Map();

  constructor() {
    logger.debug({ type: "security_review_init" }, "Security Code Review Manager inicializado");
  }

  reportFinding(
    type: string,
    severity: string,
    cweId: string,
    description: string,
    location: string,
    remediation: string,
  ): SecurityFinding {
    const finding: SecurityFinding = {
      id: `finding_${Date.now()}`,
      type: type as any,
      severity: severity as any,
      cweId,
      description,
      location,
      remediation,
    };
    this.findings.set(finding.id, finding);
    logger.warn({ type: "finding_reported", severity }, `Security: ${type}`);
    return finding;
  }

  generateSecurityReport(): SecurityAuditReport {
    const allFindings = Array.from(this.findings.values());
    const vulnCount = allFindings.filter((f) => f.type === "vulnerability").length;
    const criticalCount = allFindings.filter((f) => f.severity === "critical").length;

    const report: SecurityAuditReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      findings: allFindings,
      vulnerabilityCount: vulnCount,
      riskScore: criticalCount * 100 + vulnCount * 25,
      canDeployToProd: criticalCount === 0,
    };
    this.reports.set(report.id, report);
    logger.info({ type: "report_generated" }, `Risk Score: ${report.riskScore}`);
    return report;
  }

  getStatistics() {
    const allFindings = Array.from(this.findings.values());
    return {
      totalFindings: allFindings.length,
      vulnerabilities: allFindings.filter((f) => f.type === "vulnerability").length,
      criticalSeverity: allFindings.filter((f) => f.severity === "critical").length,
    };
  }
}

let globalSecurityReviewManager: SecurityCodeReviewManager | null = null;

export function getSecurityCodeReviewManager(): SecurityCodeReviewManager {
  if (!globalSecurityReviewManager) {
    globalSecurityReviewManager = new SecurityCodeReviewManager();
  }
  return globalSecurityReviewManager;
}
