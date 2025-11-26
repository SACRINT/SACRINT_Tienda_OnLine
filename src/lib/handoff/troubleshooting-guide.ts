/**
 * Troubleshooting Guide Manager
 * Semana 48, Tarea 48.5: Troubleshooting Guide
 */

import { logger } from "@/lib/monitoring";

export interface TroubleshootingIssue {
  id: string;
  title: string;
  symptoms: string[];
  rootCauses: string[];
  solutions: string[];
  relatedIssues: string[];
}

export interface TroubleshootingGuide {
  id: string;
  version: string;
  issues: TroubleshootingIssue[];
  createdAt: Date;
  lastUpdated: Date;
}

export class TroubleshootingGuideManager {
  private issues: Map<string, TroubleshootingIssue> = new Map();
  private guides: Map<string, TroubleshootingGuide> = new Map();

  constructor() {
    logger.debug({ type: "troubleshoot_init" }, "Troubleshooting Guide Manager inicializado");
  }

  createIssue(
    title: string,
    symptoms: string[],
    rootCauses: string[],
    solutions: string[],
  ): TroubleshootingIssue {
    const issue: TroubleshootingIssue = {
      id: `issue_${Date.now()}`,
      title,
      symptoms,
      rootCauses,
      solutions,
      relatedIssues: [],
    };
    this.issues.set(issue.id, issue);
    logger.info({ type: "issue_created" }, `Issue: ${title}`);
    return issue;
  }

  createTroubleshootingGuide(version: string): TroubleshootingGuide {
    const guide: TroubleshootingGuide = {
      id: `guide_${Date.now()}`,
      version,
      issues: Array.from(this.issues.values()),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    this.guides.set(guide.id, guide);
    logger.info({ type: "guide_created" }, `Troubleshooting Guide v${version}`);
    return guide;
  }

  findIssueBySymptom(symptom: string): TroubleshootingIssue[] {
    return Array.from(this.issues.values()).filter((i) =>
      i.symptoms.some((s) => s.includes(symptom)),
    );
  }

  getStatistics() {
    return {
      totalIssues: this.issues.size,
      guides: this.guides.size,
    };
  }
}

let globalTroubleshootingManager: TroubleshootingGuideManager | null = null;

export function getTroubleshootingGuideManager(): TroubleshootingGuideManager {
  if (!globalTroubleshootingManager) {
    globalTroubleshootingManager = new TroubleshootingGuideManager();
  }
  return globalTroubleshootingManager;
}
