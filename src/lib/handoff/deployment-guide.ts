/**
 * Deployment Guide Manager
 * Semana 48, Tarea 48.4: Deployment Guide
 */

import { logger } from "@/lib/monitoring";

export interface DeploymentStep {
  id: string;
  order: number;
  title: string;
  description: string;
  prerequisites: string[];
  commands: string[];
  estimatedTime: number;
}

export interface DeploymentGuide {
  id: string;
  version: string;
  environment: string;
  steps: DeploymentStep[];
  createdAt: Date;
  lastUpdated: Date;
}

export class DeploymentGuideManager {
  private steps: Map<string, DeploymentStep> = new Map();
  private guides: Map<string, DeploymentGuide> = new Map();

  constructor() {
    logger.debug({ type: "deploy_guide_init" }, "Deployment Guide Manager inicializado");
  }

  createDeploymentStep(
    order: number,
    title: string,
    description: string,
    commands: string[],
  ): DeploymentStep {
    const step: DeploymentStep = {
      id: `step_${Date.now()}`,
      order,
      title,
      description,
      prerequisites: [],
      commands,
      estimatedTime: 5,
    };
    this.steps.set(step.id, step);
    logger.info({ type: "step_created" }, `Step: ${title}`);
    return step;
  }

  createDeploymentGuide(version: string, environment: string): DeploymentGuide {
    const guide: DeploymentGuide = {
      id: `guide_${Date.now()}`,
      version,
      environment,
      steps: Array.from(this.steps.values()).sort((a, b) => a.order - b.order),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    this.guides.set(guide.id, guide);
    logger.info({ type: "guide_created" }, `Guide: v${version} - ${environment}`);
    return guide;
  }

  getStatistics() {
    return {
      totalSteps: this.steps.size,
      guides: this.guides.size,
    };
  }
}

let globalDeployGuideManager: DeploymentGuideManager | null = null;

export function getDeploymentGuideManager(): DeploymentGuideManager {
  if (!globalDeployGuideManager) {
    globalDeployGuideManager = new DeploymentGuideManager();
  }
  return globalDeployGuideManager;
}
