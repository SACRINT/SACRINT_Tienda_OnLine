/**
 * Market Positioning Manager
 * Semana 56, Tarea 56.10: Market Positioning & Competitive Strategy
 */

import { logger } from "@/lib/monitoring";

export interface MarketPosition {
  id: string;
  marketSegment: string;
  positionStatement: string;
  targetDemographic: string;
  uniqueValueProposition: string[];
  competitiveAdvantages: string[];
  pricePositioning: "premium" | "value" | "budget";
  marketShare: number;
  reportDate: Date;
}

export interface CompetitiveAnalysis {
  id: string;
  analysisDate: Date;
  competitors: CompetitorProfile[];
  marketTrends: string[];
  opportunityGaps: string[];
  threatAssessment: string[];
  strategicRecommendations: string[];
}

export interface CompetitorProfile {
  id: string;
  competitorName: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  recentMoves: string[];
  threatLevel: "low" | "medium" | "high";
}

export class MarketPositioningManager {
  private marketPositions: Map<string, MarketPosition> = new Map();
  private competitiveAnalyses: Map<string, CompetitiveAnalysis> = new Map();

  constructor() {
    logger.debug({ type: "market_positioning_init" }, "Manager inicializado");
  }

  defineMarketPosition(
    marketSegment: string,
    positionStatement: string,
    targetDemographic: string,
    uniqueValueProposition: string[],
    competitiveAdvantages: string[],
    pricePositioning: "premium" | "value" | "budget",
    marketShare: number,
  ): MarketPosition {
    const id = "position_" + Date.now();
    const position: MarketPosition = {
      id,
      marketSegment,
      positionStatement,
      targetDemographic,
      uniqueValueProposition,
      competitiveAdvantages,
      pricePositioning,
      marketShare,
      reportDate: new Date(),
    };

    this.marketPositions.set(id, position);
    logger.info(
      { type: "market_position_defined", positionId: id },
      `Posición de mercado definida: ${marketSegment}`,
    );
    return position;
  }

  conductCompetitiveAnalysis(
    competitors: Array<{
      competitorName: string;
      marketShare: number;
      strengths: string[];
      weaknesses: string[];
      recentMoves: string[];
      threatLevel: "low" | "medium" | "high";
    }>,
    marketTrends: string[],
    opportunityGaps: string[],
    threatAssessment: string[],
    strategicRecommendations: string[],
  ): CompetitiveAnalysis {
    const id = "analysis_" + Date.now();
    const competitorProfiles: CompetitorProfile[] = competitors.map((c) => ({
      id: "competitor_" + Date.now(),
      competitorName: c.competitorName,
      marketShare: c.marketShare,
      strengths: c.strengths,
      weaknesses: c.weaknesses,
      recentMoves: c.recentMoves,
      threatLevel: c.threatLevel,
    }));

    const analysis: CompetitiveAnalysis = {
      id,
      analysisDate: new Date(),
      competitors: competitorProfiles,
      marketTrends,
      opportunityGaps,
      threatAssessment,
      strategicRecommendations,
    };

    this.competitiveAnalyses.set(id, analysis);
    logger.info(
      { type: "competitive_analysis_conducted", analysisId: id },
      `Análisis competitivo realizado`,
    );
    return analysis;
  }

  getStatistics(): Record<string, any> {
    const positions = Array.from(this.marketPositions.values());
    const analyses = Array.from(this.competitiveAnalyses.values());

    const allCompetitors = analyses.flatMap((a) => a.competitors);

    return {
      totalMarketPositions: positions.length,
      positionsByPricing: {
        premium: positions.filter((p) => p.pricePositioning === "premium").length,
        value: positions.filter((p) => p.pricePositioning === "value").length,
        budget: positions.filter((p) => p.pricePositioning === "budget").length,
      },
      averageMarketShare:
        positions.length > 0
          ? positions.reduce((sum, p) => sum + p.marketShare, 0) / positions.length
          : 0,
      totalCompetitiveAnalyses: analyses.length,
      totalCompetitorsAnalyzed: allCompetitors.length,
      competitorsByThreatLevel: {
        low: allCompetitors.filter((c) => c.threatLevel === "low").length,
        medium: allCompetitors.filter((c) => c.threatLevel === "medium").length,
        high: allCompetitors.filter((c) => c.threatLevel === "high").length,
      },
      averageCompetitorMarketShare:
        allCompetitors.length > 0
          ? allCompetitors.reduce((sum, c) => sum + c.marketShare, 0) / allCompetitors.length
          : 0,
    };
  }

  generatePositioningReport(): string {
    const stats = this.getStatistics();
    return `Market Positioning Report\nPositions: ${stats.totalMarketPositions}\nAnalyses: ${stats.totalCompetitiveAnalyses}\nCompetitors: ${stats.totalCompetitorsAnalyzed}`;
  }
}

let globalMarketPositioningManager: MarketPositioningManager | null = null;

export function getMarketPositioningManager(): MarketPositioningManager {
  if (!globalMarketPositioningManager) {
    globalMarketPositioningManager = new MarketPositioningManager();
  }
  return globalMarketPositioningManager;
}
