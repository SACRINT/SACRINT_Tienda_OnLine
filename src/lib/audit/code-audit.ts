/**
 * Code Audit Manager
 * Semana 49, Tarea 49.1: Code Audit
 */

import { logger } from "@/lib/monitoring";

export interface CodeIssue {
  id: string;
  file: string;
  line: number;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  message: string;
  suggestion: string;
}

export interface AuditResult {
  id: string;
  timestamp: Date;
  totalIssues: number;
  criticalIssues: number;
  issues: CodeIssue[];
  score: number;
}

export class CodeAuditManager {
  private issues: Map<string, CodeIssue> = new Map();
  private auditResults: Map<string, AuditResult> = new Map();

  constructor() {
    logger.debug({ type: "code_audit_init" }, "Code Audit Manager inicializado");
  }

  reportIssue(
    file: string,
    line: number,
    severity: string,
    category: string,
    message: string,
    suggestion: string,
  ): CodeIssue {
    const issue: CodeIssue = {
      id: `issue_${Date.now()}`,
      file,
      line,
      severity: severity as any,
      category,
      message,
      suggestion,
    };
    this.issues.set(issue.id, issue);
    logger.warn({ type: "issue_found", severity }, `Issue: ${category}`);
    return issue;
  }

  performAudit(): AuditResult {
    const allIssues = Array.from(this.issues.values());
    const criticalCount = allIssues.filter((i) => i.severity === "critical").length;
    const highCount = allIssues.filter((i) => i.severity === "high").length;

    const score = Math.max(0, 100 - (criticalCount * 10 + highCount * 5));

    const result: AuditResult = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      totalIssues: allIssues.length,
      criticalIssues: criticalCount,
      issues: allIssues.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      score,
    };
    this.auditResults.set(result.id, result);
    logger.info({ type: "audit_completed" }, `Score: ${score}%`);
    return result;
  }

  getIssuesByFile(file: string): CodeIssue[] {
    return Array.from(this.issues.values()).filter((i) => i.file === file);
  }

  getStatistics() {
    const allIssues = Array.from(this.issues.values());
    return {
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter((i) => i.severity === "critical").length,
      averageScore:
        Array.from(this.auditResults.values()).reduce((sum, r) => sum + r.score, 0) /
        Math.max(1, this.auditResults.size),
    };
  }
}

let globalCodeAuditManager: CodeAuditManager | null = null;

export function getCodeAuditManager(): CodeAuditManager {
  if (!globalCodeAuditManager) {
    globalCodeAuditManager = new CodeAuditManager();
  }
  return globalCodeAuditManager;
}
