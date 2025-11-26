/**
 * Feature Flags Manager
 * Semana 47, Tarea 47.5: Feature Flags & Canary Deployments
 */

import { logger } from "@/lib/monitoring";

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetEnvironments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CanaryDeployment {
  id: string;
  featureName: string;
  currentPercentage: number;
  targetPercentage: number;
  status: "running" | "paused" | "completed" | "rolled_back";
}

export class FeatureFlagsManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private canaries: Map<string, CanaryDeployment> = new Map();

  constructor() {
    logger.debug({ type: "flags_init" }, "Feature Flags Manager inicializado");
  }

  createFeatureFlag(name: string, enabled: boolean, environments: string[]): FeatureFlag {
    const flag: FeatureFlag = {
      id: `flag_${Date.now()}`,
      name,
      enabled,
      rolloutPercentage: 0,
      targetEnvironments: environments,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.flags.set(flag.id, flag);
    logger.info({ type: "flag_created" }, `Flag: ${name}`);
    return flag;
  }

  startCanaryDeployment(featureName: string, startPercentage: number = 10): CanaryDeployment {
    const canary: CanaryDeployment = {
      id: `canary_${Date.now()}`,
      featureName,
      currentPercentage: startPercentage,
      targetPercentage: 100,
      status: "running",
    };
    this.canaries.set(canary.id, canary);
    logger.info({ type: "canary_started" }, `Canary: ${featureName}@${startPercentage}%`);
    return canary;
  }

  increaseCanaryRollout(canaryId: string, percentage: number): CanaryDeployment | null {
    const canary = this.canaries.get(canaryId);
    if (!canary) return null;
    canary.currentPercentage = Math.min(canary.currentPercentage + percentage, 100);
    if (canary.currentPercentage >= 100) {
      canary.status = "completed";
    }
    logger.info({ type: "canary_increased" }, `Rollout: ${canary.currentPercentage}%`);
    return canary;
  }

  getStatistics() {
    return {
      totalFlags: this.flags.size,
      enabledFlags: Array.from(this.flags.values()).filter((f) => f.enabled).length,
      activeCanaries: Array.from(this.canaries.values()).filter((c) => c.status === "running")
        .length,
    };
  }
}

let globalFeatureFlagsManager: FeatureFlagsManager | null = null;

export function getFeatureFlagsManager(): FeatureFlagsManager {
  if (!globalFeatureFlagsManager) {
    globalFeatureFlagsManager = new FeatureFlagsManager();
  }
  return globalFeatureFlagsManager;
}
