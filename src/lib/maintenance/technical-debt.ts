/**
 * Technical Debt Manager
 * Semana 53, Tarea 53.7: Technical Debt Management & Refactoring
 */

import { logger } from "@/lib/monitoring";

export interface TechnicalDebtItem {
  id: string;
  title: string;
  description: string;
  category: "code-quality" | "performance" | "security" | "architecture" | "testing";
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  roi: number;
  priority: number;
  status: "identified" | "backlog" | "in-progress" | "resolved";
  createdDate: Date;
  targetResolutionDate?: Date;
  owner?: string;
  relatedIssues: string[];
}

export interface RefactoringPlan {
  id: string;
  debtItemId: string;
  refactoringStrategy: string;
  phases: RefactoringPhase[];
  estimatedCompletionDate: Date;
  status: "planned" | "in-progress" | "completed";
}

export interface RefactoringPhase {
  id: string;
  phaseName: string;
  startDate: Date;
  targetDate: Date;
  scope: string[];
  status: "pending" | "active" | "completed";
}

export class TechnicalDebtManager {
  private debtItems: Map<string, TechnicalDebtItem> = new Map();
  private refactoringPlans: Map<string, RefactoringPlan> = new Map();
  private totalDebtScore: number = 0;

  constructor() {
    logger.debug({ type: "technical_debt_init" }, "Manager inicializado");
  }

  identifyDebtItem(
    title: string,
    description: string,
    category: "code-quality" | "performance" | "security" | "architecture" | "testing",
    impact: "high" | "medium" | "low",
    effort: "high" | "medium" | "low",
    relatedIssues: string[] = [],
  ): TechnicalDebtItem {
    const id = "debt_" + Date.now();

    const impactScore = { high: 3, medium: 2, low: 1 }[impact];
    const effortScore = { high: 3, medium: 2, low: 1 }[effort];
    const roi = impactScore / effortScore;

    const debtItem: TechnicalDebtItem = {
      id,
      title,
      description,
      category,
      impact,
      effort,
      roi,
      priority: impactScore * 10 - effortScore * 5,
      status: "identified",
      createdDate: new Date(),
      relatedIssues,
    };

    this.debtItems.set(id, debtItem);
    this.totalDebtScore += debtItem.priority;
    logger.info(
      { type: "debt_item_identified", itemId: id },
      `Deuda técnica identificada: ${title}`,
    );
    return debtItem;
  }

  assignDebtItem(debtItemId: string, owner: string, targetDate: Date): TechnicalDebtItem | null {
    const item = this.debtItems.get(debtItemId);
    if (!item) return null;

    item.owner = owner;
    item.targetResolutionDate = targetDate;
    item.status = "backlog";
    this.debtItems.set(debtItemId, item);
    logger.info({ type: "debt_item_assigned", itemId: debtItemId }, `Deuda asignada a ${owner}`);
    return item;
  }

  createRefactoringPlan(
    debtItemId: string,
    refactoringStrategy: string,
    phases: Array<{ phaseName: string; scope: string[] }>,
    estimatedCompletionDate: Date,
  ): RefactoringPlan | null {
    const item = this.debtItems.get(debtItemId);
    if (!item) return null;

    const id = "plan_" + Date.now();
    const refactoringPhases: RefactoringPhase[] = phases.map((p, index) => ({
      id: "phase_" + Date.now() + index,
      phaseName: p.phaseName,
      startDate: new Date(Date.now() + index * 30 * 24 * 60 * 60 * 1000),
      targetDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000),
      scope: p.scope,
      status: "pending",
    }));

    const plan: RefactoringPlan = {
      id,
      debtItemId,
      refactoringStrategy,
      phases: refactoringPhases,
      estimatedCompletionDate,
      status: "planned",
    };

    this.refactoringPlans.set(id, plan);
    logger.info({ type: "refactoring_plan_created", planId: id }, `Plan de refactorización creado`);
    return plan;
  }

  startRefactoring(debtItemId: string): TechnicalDebtItem | null {
    const item = this.debtItems.get(debtItemId);
    if (!item) return null;

    item.status = "in-progress";
    this.debtItems.set(debtItemId, item);
    logger.info({ type: "refactoring_started", itemId: debtItemId }, `Refactorización iniciada`);
    return item;
  }

  completeDebtResolution(debtItemId: string): TechnicalDebtItem | null {
    const item = this.debtItems.get(debtItemId);
    if (!item) return null;

    item.status = "resolved";
    this.debtItems.set(debtItemId, item);
    this.totalDebtScore -= item.priority;
    logger.info({ type: "debt_resolved", itemId: debtItemId }, `Deuda técnica resuelta`);
    return item;
  }

  getDebtByCategory(
    category: "code-quality" | "performance" | "security" | "architecture" | "testing",
  ): TechnicalDebtItem[] {
    return Array.from(this.debtItems.values()).filter((d) => d.category === category);
  }

  getStatistics(): Record<string, any> {
    const items = Array.from(this.debtItems.values());
    const plans = Array.from(this.refactoringPlans.values());

    return {
      totalDebtItems: items.length,
      debtByStatus: {
        identified: items.filter((d) => d.status === "identified").length,
        backlog: items.filter((d) => d.status === "backlog").length,
        inProgress: items.filter((d) => d.status === "in-progress").length,
        resolved: items.filter((d) => d.status === "resolved").length,
      },
      debtByCategory: {
        codeQuality: items.filter((d) => d.category === "code-quality").length,
        performance: items.filter((d) => d.category === "performance").length,
        security: items.filter((d) => d.category === "security").length,
        architecture: items.filter((d) => d.category === "architecture").length,
        testing: items.filter((d) => d.category === "testing").length,
      },
      totalDebtScore: this.totalDebtScore,
      averageROI: items.length > 0 ? items.reduce((sum, d) => sum + d.roi, 0) / items.length : 0,
      totalRefactoringPlans: plans.length,
    };
  }

  generateTechnicalDebtReport(): string {
    const stats = this.getStatistics();
    return `Technical Debt Report\nTotal Items: ${stats.totalDebtItems}\nResolved: ${stats.debtByStatus.resolved}\nDebt Score: ${stats.totalDebtScore}\nAvg ROI: ${stats.averageROI.toFixed(2)}`;
  }
}

let globalTechnicalDebtManager: TechnicalDebtManager | null = null;

export function getTechnicalDebtManager(): TechnicalDebtManager {
  if (!globalTechnicalDebtManager) {
    globalTechnicalDebtManager = new TechnicalDebtManager();
  }
  return globalTechnicalDebtManager;
}
