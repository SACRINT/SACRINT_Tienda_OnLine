/**
 * Bug Tracking & Resolution Manager
 * Semana 53, Tarea 53.3: Bug Tracking & Issue Resolution
 */

import { logger } from "@/lib/monitoring";

export interface Bug {
  id: string;
  bugId: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  priority: "p0" | "p1" | "p2" | "p3";
  status: "open" | "in-progress" | "under-review" | "resolved" | "closed";
  reportedBy: string;
  reportedDate: Date;
  assignedTo?: string;
  resolvedDate?: Date;
  component: string;
  reproductionSteps: string[];
  attachments: string[];
}

export interface BugFix {
  id: string;
  bugId: string;
  fixDescription: string;
  pullRequestUrl: string;
  deployedVersion: string;
  status: "pending-review" | "approved" | "deployed" | "verified";
  verificationDate?: Date;
  verifiedBy?: string;
}

export class BugTrackingManager {
  private bugs: Map<string, Bug> = new Map();
  private bugFixes: Map<string, BugFix> = new Map();
  private bugStats: Map<string, number> = new Map();

  constructor() {
    logger.debug({ type: "bug_tracking_init" }, "Manager inicializado");
  }

  reportBug(
    title: string,
    description: string,
    severity: "critical" | "high" | "medium" | "low",
    priority: "p0" | "p1" | "p2" | "p3",
    reportedBy: string,
    component: string,
    reproductionSteps: string[],
    attachments: string[] = [],
  ): Bug {
    const id = "bug_" + Date.now();
    const bugId = `BUG-${Date.now()}`;

    const bug: Bug = {
      id,
      bugId,
      title,
      description,
      severity,
      priority,
      status: "open",
      reportedBy,
      reportedDate: new Date(),
      component,
      reproductionSteps,
      attachments,
    };

    this.bugs.set(id, bug);
    logger.info({ type: "bug_reported", bugId: id }, `Bug reportado: ${bugId}`);
    return bug;
  }

  assignBug(bugId: string, assignedTo: string): Bug | null {
    const bug = this.bugs.get(bugId);
    if (!bug) return null;

    bug.assignedTo = assignedTo;
    bug.status = "in-progress";
    this.bugs.set(bugId, bug);
    logger.info({ type: "bug_assigned", bugId }, `Bug asignado a ${assignedTo}`);
    return bug;
  }

  submitBugFix(
    bugId: string,
    fixDescription: string,
    pullRequestUrl: string,
    deployedVersion: string,
  ): BugFix | null {
    const bug = this.bugs.get(bugId);
    if (!bug) return null;

    const fixId = "fix_" + Date.now();
    const fix: BugFix = {
      id: fixId,
      bugId,
      fixDescription,
      pullRequestUrl,
      deployedVersion,
      status: "pending-review",
    };

    this.bugFixes.set(fixId, fix);
    logger.info({ type: "bug_fix_submitted", fixId }, `Fix para bug enviado para revisión`);
    return fix;
  }

  approveBugFix(fixId: string): BugFix | null {
    const fix = this.bugFixes.get(fixId);
    if (!fix) return null;

    fix.status = "approved";
    this.bugFixes.set(fixId, fix);
    logger.info({ type: "bug_fix_approved", fixId }, `Fix aprobado`);
    return fix;
  }

  verifyBugFix(fixId: string, verifiedBy: string): BugFix | null {
    const fix = this.bugFixes.get(fixId);
    if (!fix) return null;

    fix.status = "verified";
    fix.verificationDate = new Date();
    fix.verifiedBy = verifiedBy;

    const bug = Array.from(this.bugs.values()).find((b) => b.id === fix.bugId);
    if (bug) {
      bug.status = "closed";
      bug.resolvedDate = new Date();
    }

    logger.info({ type: "bug_fix_verified", fixId }, `Fix verificado`);
    return fix;
  }

  getBugsBySeverity(severity: "critical" | "high" | "medium" | "low"): Bug[] {
    return Array.from(this.bugs.values()).filter((b) => b.severity === severity);
  }

  getOpenBugs(): Bug[] {
    return Array.from(this.bugs.values()).filter((b) => b.status === "open");
  }

  getStatistics(): Record<string, any> {
    const bugs = Array.from(this.bugs.values());
    const fixes = Array.from(this.bugFixes.values());

    return {
      totalBugs: bugs.length,
      bugsBySeverity: {
        critical: bugs.filter((b) => b.severity === "critical").length,
        high: bugs.filter((b) => b.severity === "high").length,
        medium: bugs.filter((b) => b.severity === "medium").length,
        low: bugs.filter((b) => b.severity === "low").length,
      },
      bugsByStatus: {
        open: bugs.filter((b) => b.status === "open").length,
        inProgress: bugs.filter((b) => b.status === "in-progress").length,
        underReview: bugs.filter((b) => b.status === "under-review").length,
        resolved: bugs.filter((b) => b.status === "resolved").length,
        closed: bugs.filter((b) => b.status === "closed").length,
      },
      totalFixes: fixes.length,
      fixesByStatus: {
        pendingReview: fixes.filter((f) => f.status === "pending-review").length,
        approved: fixes.filter((f) => f.status === "approved").length,
        deployed: fixes.filter((f) => f.status === "deployed").length,
        verified: fixes.filter((f) => f.status === "verified").length,
      },
      averageResolutionTime:
        bugs.filter((b) => b.resolvedDate).length > 0
          ? bugs.reduce((sum, b) => {
              if (!b.resolvedDate) return sum;
              return (
                sum + (b.resolvedDate.getTime() - b.reportedDate.getTime()) / (1000 * 60 * 60 * 24)
              );
            }, 0) / bugs.filter((b) => b.resolvedDate).length
          : 0,
    };
  }

  generateBugReport(): string {
    const stats = this.getStatistics();
    return `Bug Tracking Report\nTotal Bugs: ${stats.totalBugs}\nOpen: ${stats.bugsByStatus.open}\nClosed: ${stats.bugsByStatus.closed}\nAvg Resolution: ${stats.averageResolutionTime.toFixed(2)} days`;
  }
}

let globalBugTrackingManager: BugTrackingManager | null = null;

export function getBugTrackingManager(): BugTrackingManager {
  if (!globalBugTrackingManager) {
    globalBugTrackingManager = new BugTrackingManager();
  }
  return globalBugTrackingManager;
}
