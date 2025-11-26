/**
 * Disaster Recovery Plan Manager
 * Semana 46, Tarea 46.9: Disaster Recovery Plan
 */

import { logger } from "@/lib/monitoring";

export interface DRStep {
  id: string;
  order: number;
  action: string;
  service: string;
  estimatedTime: number;
  completed: boolean;
}

export interface DRPlan {
  id: string;
  name: string;
  steps: DRStep[];
  createdAt: Date;
  lastTestedAt?: Date;
  status: "draft" | "active" | "testing" | "executed";
}

export class DisasterRecoveryPlanManager {
  private plans: Map<string, DRPlan> = new Map();
  private executionHistory: Map<string, DRPlan[]> = new Map();

  constructor() {
    logger.debug({ type: "dr_plan_init" }, "Disaster Recovery Plan Manager inicializado");
  }

  createDRPlan(name: string, steps: DRStep[]): DRPlan {
    const plan: DRPlan = {
      id: `plan_${Date.now()}`,
      name,
      steps,
      createdAt: new Date(),
      status: "draft",
    };
    this.plans.set(plan.id, plan);
    logger.info({ type: "plan_created" }, `Plan DR: ${name}`);
    return plan;
  }

  executeDRPlan(planId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    plan.status = "executed";
    if (!this.executionHistory.has(planId)) {
      this.executionHistory.set(planId, []);
    }
    this.executionHistory.get(planId)?.push(plan);

    logger.warn({ type: "plan_executed" }, `Plan ejecutado: ${plan.name}`);
    return true;
  }

  testDRPlan(planId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    plan.status = "testing";
    plan.lastTestedAt = new Date();
    logger.info({ type: "plan_tested" }, `Plan testeado: ${plan.name}`);
    return true;
  }

  getDRPlan(planId: string): DRPlan | null {
    return this.plans.get(planId) || null;
  }

  getStatistics() {
    return {
      totalPlans: this.plans.size,
      activePlans: Array.from(this.plans.values()).filter((p) => p.status === "active").length,
      testedPlans: Array.from(this.plans.values()).filter((p) => p.lastTestedAt).length,
    };
  }
}

let globalDRPlanManager: DisasterRecoveryPlanManager | null = null;

export function getDisasterRecoveryPlanManager(): DisasterRecoveryPlanManager {
  if (!globalDRPlanManager) {
    globalDRPlanManager = new DisasterRecoveryPlanManager();
  }
  return globalDRPlanManager;
}
