/**
 * Thought Leadership Manager
 * Semana 56, Tarea 56.9: Thought Leadership & Industry Influence
 */

import { logger } from "@/lib/monitoring";

export interface ThoughtLeadershipInitiative {
  id: string;
  initiativeName: string;
  topic: string;
  format: "article" | "speaking" | "research" | "publication";
  targetAudience: string;
  channel: string;
  publishDate: Date;
  reachMetrics: Record<string, number>;
  influenceScore: number;
}

export interface PublishedInsight {
  id: string;
  insightTitle: string;
  insightArea: string;
  authorName: string;
  publishDate: Date;
  viewCount: number;
  shareCount: number;
  citationCount: number;
  credibility: number;
}

export class ThoughtLeadershipManager {
  private initiatives: Map<string, ThoughtLeadershipInitiative> = new Map();
  private publishedInsights: Map<string, PublishedInsight> = new Map();

  constructor() {
    logger.debug({ type: "thought_leadership_init" }, "Manager inicializado");
  }

  launchThoughtLeadershipInitiative(
    initiativeName: string,
    topic: string,
    format: "article" | "speaking" | "research" | "publication",
    targetAudience: string,
    channel: string,
    reachMetrics: Record<string, number>,
    influenceScore: number,
  ): ThoughtLeadershipInitiative {
    const id = "initiative_" + Date.now();
    const initiative: ThoughtLeadershipInitiative = {
      id,
      initiativeName,
      topic,
      format,
      targetAudience,
      channel,
      publishDate: new Date(),
      reachMetrics,
      influenceScore,
    };

    this.initiatives.set(id, initiative);
    logger.info(
      { type: "thought_leadership_initiative_launched", initiativeId: id },
      `Iniciativa de liderazgo de pensamiento lanzada: ${initiativeName}`,
    );
    return initiative;
  }

  publishInsight(
    insightTitle: string,
    insightArea: string,
    authorName: string,
    credibility: number,
  ): PublishedInsight {
    const id = "insight_" + Date.now();
    const insight: PublishedInsight = {
      id,
      insightTitle,
      insightArea,
      authorName,
      publishDate: new Date(),
      viewCount: 0,
      shareCount: 0,
      citationCount: 0,
      credibility,
    };

    this.publishedInsights.set(id, insight);
    logger.info({ type: "insight_published", insightId: id }, `Insight publicado: ${insightTitle}`);
    return insight;
  }

  recordInsightMetrics(
    insightId: string,
    viewCount: number,
    shareCount: number,
    citationCount: number,
  ): PublishedInsight | null {
    const insight = this.publishedInsights.get(insightId);
    if (!insight) return null;

    insight.viewCount += viewCount;
    insight.shareCount += shareCount;
    insight.citationCount += citationCount;

    return insight;
  }

  getStatistics(): Record<string, any> {
    const initiatives = Array.from(this.initiatives.values());
    const insights = Array.from(this.publishedInsights.values());

    const totalReach = initiatives.reduce((sum, init) => {
      return sum + Object.values(init.reachMetrics).reduce((a, b) => a + (b as number), 0);
    }, 0);

    return {
      totalThoughtLeadershipInitiatives: initiatives.length,
      initiativesByFormat: {
        article: initiatives.filter((i) => i.format === "article").length,
        speaking: initiatives.filter((i) => i.format === "speaking").length,
        research: initiatives.filter((i) => i.format === "research").length,
        publication: initiatives.filter((i) => i.format === "publication").length,
      },
      totalReach,
      averageInfluenceScore:
        initiatives.length > 0
          ? initiatives.reduce((sum, i) => sum + i.influenceScore, 0) / initiatives.length
          : 0,
      totalPublishedInsights: insights.length,
      totalViews: insights.reduce((sum, i) => sum + i.viewCount, 0),
      totalShares: insights.reduce((sum, i) => sum + i.shareCount, 0),
      totalCitations: insights.reduce((sum, i) => sum + i.citationCount, 0),
      averageCredibility:
        insights.length > 0
          ? insights.reduce((sum, i) => sum + i.credibility, 0) / insights.length
          : 0,
    };
  }

  generateThoughtLeadershipReport(): string {
    const stats = this.getStatistics();
    return `Thought Leadership Report\nInitiatives: ${stats.totalThoughtLeadershipInitiatives}\nInsights: ${stats.totalPublishedInsights}\nTotal Reach: ${stats.totalReach.toLocaleString()}`;
  }
}

let globalThoughtLeadershipManager: ThoughtLeadershipManager | null = null;

export function getThoughtLeadershipManager(): ThoughtLeadershipManager {
  if (!globalThoughtLeadershipManager) {
    globalThoughtLeadershipManager = new ThoughtLeadershipManager();
  }
  return globalThoughtLeadershipManager;
}
