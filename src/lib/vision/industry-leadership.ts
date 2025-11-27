/**
 * Industry Leadership Manager
 * Semana 56, Tarea 56.8: Industry Leadership & Market Positioning
 */

import { logger } from "@/lib/monitoring";

export interface LeadershipPosition {
  id: string;
  positionName: string;
  industry: string;
  category: "technology" | "innovation" | "sustainability" | "governance";
  currentRank: number;
  targetRank: number;
  competitiveAdvantage: string[];
  marketShare: number;
  reportDate: Date;
}

export interface IndustryAward {
  id: string;
  awardName: string;
  awardingBody: string;
  category: string;
  awardDate: Date;
  recognitionLevel: "local" | "regional" | "national" | "international";
  impact: string;
  publicityValue: number;
}

export class IndustryLeadershipManager {
  private leadershipPositions: Map<string, LeadershipPosition> = new Map();
  private industryAwards: Map<string, IndustryAward> = new Map();

  constructor() {
    logger.debug({ type: "industry_leadership_init" }, "Manager inicializado");
  }

  defineLeadershipPosition(
    positionName: string,
    industry: string,
    category: "technology" | "innovation" | "sustainability" | "governance",
    currentRank: number,
    targetRank: number,
    competitiveAdvantage: string[],
    marketShare: number,
  ): LeadershipPosition {
    const id = "position_" + Date.now();
    const position: LeadershipPosition = {
      id,
      positionName,
      industry,
      category,
      currentRank,
      targetRank,
      competitiveAdvantage,
      marketShare,
      reportDate: new Date(),
    };

    this.leadershipPositions.set(id, position);
    logger.info(
      { type: "leadership_position_defined", positionId: id },
      `Posición de liderazgo definida: ${positionName}`,
    );
    return position;
  }

  recordIndustryAward(
    awardName: string,
    awardingBody: string,
    category: string,
    recognitionLevel: "local" | "regional" | "national" | "international",
    impact: string,
    publicityValue: number,
  ): IndustryAward {
    const id = "award_" + Date.now();
    const award: IndustryAward = {
      id,
      awardName,
      awardingBody,
      category,
      awardDate: new Date(),
      recognitionLevel,
      impact,
      publicityValue,
    };

    this.industryAwards.set(id, award);
    logger.info(
      { type: "industry_award_recorded", awardId: id },
      `Premio de industria registrado: ${awardName}`,
    );
    return award;
  }

  getStatistics(): Record<string, any> {
    const positions = Array.from(this.leadershipPositions.values());
    const awards = Array.from(this.industryAwards.values());

    const averageCurrentRank =
      positions.length > 0
        ? positions.reduce((sum, p) => sum + p.currentRank, 0) / positions.length
        : 0;

    const averageTargetRank =
      positions.length > 0
        ? positions.reduce((sum, p) => sum + p.targetRank, 0) / positions.length
        : 0;

    return {
      totalLeadershipPositions: positions.length,
      positionsByCategory: {
        technology: positions.filter((p) => p.category === "technology").length,
        innovation: positions.filter((p) => p.category === "innovation").length,
        sustainability: positions.filter((p) => p.category === "sustainability").length,
        governance: positions.filter((p) => p.category === "governance").length,
      },
      averageCurrentRank,
      averageTargetRank,
      averageMarketShare:
        positions.length > 0
          ? positions.reduce((sum, p) => sum + p.marketShare, 0) / positions.length
          : 0,
      totalIndustryAwards: awards.length,
      awardsByRecognitionLevel: {
        local: awards.filter((a) => a.recognitionLevel === "local").length,
        regional: awards.filter((a) => a.recognitionLevel === "regional").length,
        national: awards.filter((a) => a.recognitionLevel === "national").length,
        international: awards.filter((a) => a.recognitionLevel === "international").length,
      },
      totalPublicityValue: awards.reduce((sum, a) => sum + a.publicityValue, 0),
    };
  }

  generateLeadershipReport(): string {
    const stats = this.getStatistics();
    return `Industry Leadership Report\nPositions: ${stats.totalLeadershipPositions}\nAwards: ${stats.totalIndustryAwards}\nAvg Current Rank: ${stats.averageCurrentRank.toFixed(1)}`;
  }
}

let globalIndustryLeadershipManager: IndustryLeadershipManager | null = null;

export function getIndustryLeadershipManager(): IndustryLeadershipManager {
  if (!globalIndustryLeadershipManager) {
    globalIndustryLeadershipManager = new IndustryLeadershipManager();
  }
  return globalIndustryLeadershipManager;
}
