/**
 * Strategic Summary Manager
 * Semana 51, Tarea 51.12: Strategic Planning Summary & Insights
 */

import { logger } from "@/lib/monitoring";

export interface StrategicSummary {
  id: string;
  title: string;
  generatedDate: Date;
  planningHorizon: string;
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
  riskAssessment: string;
  resourceRequirements: string;
}

export interface StrategicInsight {
  id: string;
  category: string;
  insight: string;
  impact: "high" | "medium" | "low";
  actionItems: string[];
  owner: string;
  dueDate: Date;
}

export class StrategicSummaryManager {
  private summaries: Map<string, StrategicSummary> = new Map();
  private insights: Map<string, StrategicInsight> = new Map();
  private executiveReports: StrategicSummary[] = [];

  constructor() {
    logger.debug({ type: "strategic_summary_init" }, "Manager inicializado");
  }

  createStrategicSummary(
    title: string,
    planningHorizon: string,
    executiveSummary: string,
    keyFindings: string[],
    recommendations: string[],
    riskAssessment: string,
    resourceRequirements: string,
  ): StrategicSummary {
    const id = "summary_" + Date.now();
    const summary: StrategicSummary = {
      id,
      title,
      generatedDate: new Date(),
      planningHorizon,
      executiveSummary,
      keyFindings,
      recommendations,
      riskAssessment,
      resourceRequirements,
    };

    this.summaries.set(id, summary);
    this.executiveReports.push(summary);

    logger.info(
      { type: "strategic_summary_created", summaryId: id },
      `Resumen estratégico creado: ${title}`,
    );
    return summary;
  }

  recordInsight(
    category: string,
    insight: string,
    impact: "high" | "medium" | "low",
    actionItems: string[],
    owner: string,
  ): StrategicInsight {
    const id = "insight_" + Date.now();
    const strategicInsight: StrategicInsight = {
      id,
      category,
      insight,
      impact,
      actionItems,
      owner,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    this.insights.set(id, strategicInsight);

    logger.info(
      { type: "strategic_insight_recorded", insightId: id },
      `Insight estratégico registrado: ${category}`,
    );
    return strategicInsight;
  }

  getHighImpactInsights(): StrategicInsight[] {
    return Array.from(this.insights.values())
      .filter((i) => i.impact === "high")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  getInsightsByOwner(owner: string): StrategicInsight[] {
    return Array.from(this.insights.values()).filter((i) => i.owner === owner);
  }

  getInsightsByCategory(category: string): StrategicInsight[] {
    return Array.from(this.insights.values()).filter((i) => i.category === category);
  }

  generateExecutiveReport(): string {
    const summaries = Array.from(this.summaries.values());
    const insights = Array.from(this.insights.values());
    const highImpactCount = insights.filter((i) => i.impact === "high").length;

    let report = "EXECUTIVE STRATEGIC SUMMARY REPORT\n";
    report += "=".repeat(50) + "\n\n";
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Summaries: ${summaries.length}\n`;
    report += `Total Insights: ${insights.length}\n`;
    report += `High Impact Actions: ${highImpactCount}\n\n`;

    if (summaries.length > 0) {
      const latestSummary = summaries[summaries.length - 1];
      report += "Latest Summary:\n";
      report += `Title: ${latestSummary.title}\n`;
      report += `Horizon: ${latestSummary.planningHorizon}\n`;
      report += `Key Findings: ${latestSummary.keyFindings.length}\n`;
    }

    return report;
  }

  getStatistics(): Record<string, any> {
    const summaries = Array.from(this.summaries.values());
    const insights = Array.from(this.insights.values());

    return {
      totalSummaries: summaries.length,
      totalInsights: insights.length,
      insightsByImpact: {
        high: insights.filter((i) => i.impact === "high").length,
        medium: insights.filter((i) => i.impact === "medium").length,
        low: insights.filter((i) => i.impact === "low").length,
      },
      uniqueCategories: new Set(insights.map((i) => i.category)).size,
      uniqueOwners: new Set(insights.map((i) => i.owner)).size,
      averageActionItemsPerInsight:
        insights.length > 0
          ? insights.reduce((sum, i) => sum + i.actionItems.length, 0) / insights.length
          : 0,
    };
  }

  getRecentSummaries(count: number): StrategicSummary[] {
    return this.executiveReports.slice(-count);
  }

  generateStrategicReport(): string {
    const stats = this.getStatistics();
    return `Strategic Summary Report\nTotal Summaries: ${stats.totalSummaries}\nTotal Insights: ${stats.totalInsights}\nHigh Impact Actions: ${stats.insightsByImpact.high}`;
  }
}

let globalStrategicSummaryManager: StrategicSummaryManager | null = null;

export function getStrategicSummaryManager(): StrategicSummaryManager {
  if (!globalStrategicSummaryManager) {
    globalStrategicSummaryManager = new StrategicSummaryManager();
  }
  return globalStrategicSummaryManager;
}
