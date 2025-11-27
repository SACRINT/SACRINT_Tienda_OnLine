/**
 * Continuous Improvement Manager
 * Semana 55, Tarea 55.1: Continuous Improvement & Optimization Culture
 */

import { logger } from "@/lib/monitoring";

export interface ImprovementInitiative {
  id: string;
  title: string;
  description: string;
  category: "process" | "product" | "performance" | "culture";
  status: "proposed" | "approved" | "implementing" | "completed";
  owner: string;
  expectedBenefit: string;
  implementationDate: Date;
  completionDate?: Date;
}

export class ContinuousImprovementManager {
  private initiatives: Map<string, ImprovementInitiative> = new Map();

  constructor() {
    logger.debug({ type: "continuous_improvement_init" }, "Manager inicializado");
  }

  proposeImprovement(
    title: string,
    description: string,
    category: "process" | "product" | "performance" | "culture",
    owner: string,
    expectedBenefit: string,
  ): ImprovementInitiative {
    const id = "improvement_" + Date.now();
    const initiative: ImprovementInitiative = {
      id,
      title,
      description,
      category,
      status: "proposed",
      owner,
      expectedBenefit,
      implementationDate: new Date(),
    };

    this.initiatives.set(id, initiative);
    logger.info({ type: "improvement_proposed", initiativeId: id }, `Mejora propuesta: ${title}`);
    return initiative;
  }

  completeImprovement(initiativeId: string): ImprovementInitiative | null {
    const initiative = this.initiatives.get(initiativeId);
    if (!initiative) return null;

    initiative.status = "completed";
    initiative.completionDate = new Date();
    this.initiatives.set(initiativeId, initiative);
    logger.info({ type: "improvement_completed", initiativeId }, `Mejora completada`);
    return initiative;
  }

  getStatistics(): Record<string, any> {
    const initiatives = Array.from(this.initiatives.values());

    return {
      totalInitiatives: initiatives.length,
      byStatus: {
        proposed: initiatives.filter((i) => i.status === "proposed").length,
        approved: initiatives.filter((i) => i.status === "approved").length,
        implementing: initiatives.filter((i) => i.status === "implementing").length,
        completed: initiatives.filter((i) => i.status === "completed").length,
      },
      byCategory: {
        process: initiatives.filter((i) => i.category === "process").length,
        product: initiatives.filter((i) => i.category === "product").length,
        performance: initiatives.filter((i) => i.category === "performance").length,
        culture: initiatives.filter((i) => i.category === "culture").length,
      },
    };
  }

  generateImprovementReport(): string {
    const stats = this.getStatistics();
    return `Continuous Improvement Report\nInitiatives: ${stats.totalInitiatives}\nCompleted: ${stats.byStatus.completed}`;
  }
}

let globalContinuousImprovementManager: ContinuousImprovementManager | null = null;

export function getContinuousImprovementManager(): ContinuousImprovementManager {
  if (!globalContinuousImprovementManager) {
    globalContinuousImprovementManager = new ContinuousImprovementManager();
  }
  return globalContinuousImprovementManager;
}
