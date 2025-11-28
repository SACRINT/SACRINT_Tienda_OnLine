/**
 * Institutional Knowledge Manager
 * Semana 56, Tarea 56.6: Institutional Knowledge & Organizational Memory
 */

import { logger } from "@/lib/monitoring";

export interface KnowledgeAsset {
  id: string;
  assetName: string;
  assetType: "process" | "expertise" | "tool" | "methodology";
  owner: string;
  createdDate: Date;
  lastUpdated: Date;
  content: string;
  accessLevel: "public" | "internal" | "restricted";
  usageCount: number;
}

export interface ExpertiseProfile {
  id: string;
  personName: string;
  expertise: string[];
  yearsExperience: number;
  mentees: string[];
  knowledgeTransferPlan: string;
  retentionRisk: "low" | "medium" | "high";
}

export class InstitutionalKnowledgeManager {
  private knowledgeAssets: Map<string, KnowledgeAsset> = new Map();
  private expertiseProfiles: Map<string, ExpertiseProfile> = new Map();

  constructor() {
    logger.debug({ type: "institutional_knowledge_init" }, "Manager inicializado");
  }

  createKnowledgeAsset(
    assetName: string,
    assetType: "process" | "expertise" | "tool" | "methodology",
    owner: string,
    content: string,
    accessLevel: "public" | "internal" | "restricted",
  ): KnowledgeAsset {
    const id = "knowledge_" + Date.now();
    const asset: KnowledgeAsset = {
      id,
      assetName,
      assetType,
      owner,
      createdDate: new Date(),
      lastUpdated: new Date(),
      content,
      accessLevel,
      usageCount: 0,
    };

    this.knowledgeAssets.set(id, asset);
    logger.info(
      { type: "knowledge_asset_created", assetId: id },
      `Activo de conocimiento creado: ${assetName}`,
    );
    return asset;
  }

  registerExpertiseProfile(
    personName: string,
    expertise: string[],
    yearsExperience: number,
    knowledgeTransferPlan: string,
    retentionRisk: "low" | "medium" | "high",
  ): ExpertiseProfile {
    const id = "expertise_" + Date.now();
    const profile: ExpertiseProfile = {
      id,
      personName,
      expertise,
      yearsExperience,
      mentees: [],
      knowledgeTransferPlan,
      retentionRisk,
    };

    this.expertiseProfiles.set(id, profile);
    logger.info(
      { type: "expertise_profile_registered", profileId: id },
      `Perfil de experiencia registrado: ${personName}`,
    );
    return profile;
  }

  recordAssetUsage(assetId: string): KnowledgeAsset | null {
    const asset = this.knowledgeAssets.get(assetId);
    if (!asset) return null;

    asset.usageCount++;
    asset.lastUpdated = new Date();
    return asset;
  }

  getStatistics(): Record<string, any> {
    const assets = Array.from(this.knowledgeAssets.values());
    const profiles = Array.from(this.expertiseProfiles.values());

    return {
      totalKnowledgeAssets: assets.length,
      assetsByType: {
        process: assets.filter((a) => a.assetType === "process").length,
        expertise: assets.filter((a) => a.assetType === "expertise").length,
        tool: assets.filter((a) => a.assetType === "tool").length,
        methodology: assets.filter((a) => a.assetType === "methodology").length,
      },
      assetsByAccessLevel: {
        public: assets.filter((a) => a.accessLevel === "public").length,
        internal: assets.filter((a) => a.accessLevel === "internal").length,
        restricted: assets.filter((a) => a.accessLevel === "restricted").length,
      },
      totalAssetUsage: assets.reduce((sum, a) => sum + a.usageCount, 0),
      totalExpertiseProfiles: profiles.length,
      profilesByRisk: {
        low: profiles.filter((p) => p.retentionRisk === "low").length,
        medium: profiles.filter((p) => p.retentionRisk === "medium").length,
        high: profiles.filter((p) => p.retentionRisk === "high").length,
      },
      totalExpertiseYears: profiles.reduce((sum, p) => sum + p.yearsExperience, 0),
    };
  }

  generateKnowledgeReport(): string {
    const stats = this.getStatistics();
    return `Institutional Knowledge Report\nAssets: ${stats.totalKnowledgeAssets}\nProfiles: ${stats.totalExpertiseProfiles}\nTotal Usage: ${stats.totalAssetUsage}`;
  }
}

let globalInstitutionalKnowledgeManager: InstitutionalKnowledgeManager | null = null;

export function getInstitutionalKnowledgeManager(): InstitutionalKnowledgeManager {
  if (!globalInstitutionalKnowledgeManager) {
    globalInstitutionalKnowledgeManager = new InstitutionalKnowledgeManager();
  }
  return globalInstitutionalKnowledgeManager;
}
