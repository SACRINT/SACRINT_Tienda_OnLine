/**
 * Organizational Planning Manager
 * Semana 51, Tarea 51.11: Organizational Structure & Development Planning
 */

import { logger } from "@/lib/monitoring";

export interface OrganizationalUnit {
  id: string;
  name: string;
  type: "department" | "team" | "division" | "group";
  parentUnitId?: string;
  childUnitIds: string[];
  headCount: number;
  budget: number;
  responsibilities: string[];
  manager: string;
  createdAt: Date;
}

export interface DevelopmentPlan {
  id: string;
  employeeId: string;
  goals: string[];
  trainingPrograms: string[];
  mentorId?: string;
  timeframe: string;
  status: "draft" | "active" | "completed";
  evaluationDate: Date;
}

export class OrganizationalPlanningManager {
  private units: Map<string, OrganizationalUnit> = new Map();
  private developmentPlans: Map<string, DevelopmentPlan> = new Map();
  private organizationChart: string = "";

  constructor() {
    logger.debug({ type: "organizational_planning_init" }, "Manager inicializado");
  }

  createOrganizationalUnit(
    name: string,
    type: "department" | "team" | "division" | "group",
    headCount: number,
    budget: number,
    responsibilities: string[],
    manager: string,
    parentUnitId?: string,
  ): OrganizationalUnit {
    const id = "unit_" + Date.now();
    const unit: OrganizationalUnit = {
      id,
      name,
      type,
      parentUnitId,
      childUnitIds: [],
      headCount,
      budget,
      responsibilities,
      manager,
      createdAt: new Date(),
    };

    this.units.set(id, unit);

    if (parentUnitId) {
      const parentUnit = this.units.get(parentUnitId);
      if (parentUnit) {
        parentUnit.childUnitIds.push(id);
        this.units.set(parentUnitId, parentUnit);
      }
    }

    logger.info(
      { type: "organizational_unit_created", unitId: id },
      `Unidad organizacional creada: ${name}`,
    );
    return unit;
  }

  createDevelopmentPlan(
    employeeId: string,
    goals: string[],
    trainingPrograms: string[],
    timeframe: string,
    mentorId?: string,
  ): DevelopmentPlan {
    const id = "devplan_" + Date.now();
    const plan: DevelopmentPlan = {
      id,
      employeeId,
      goals,
      trainingPrograms,
      mentorId,
      timeframe,
      status: "draft",
      evaluationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    };

    this.developmentPlans.set(id, plan);
    logger.info(
      { type: "development_plan_created", planId: id },
      `Plan de desarrollo creado para empleado`,
    );
    return plan;
  }

  activateDevelopmentPlan(planId: string): DevelopmentPlan | null {
    const plan = this.developmentPlans.get(planId);
    if (!plan) return null;
    plan.status = "active";
    this.developmentPlans.set(planId, plan);
    return plan;
  }

  completeDevelopmentPlan(planId: string): DevelopmentPlan | null {
    const plan = this.developmentPlans.get(planId);
    if (!plan) return null;
    plan.status = "completed";
    this.developmentPlans.set(planId, plan);
    return plan;
  }

  getUnitsHierarchy(): OrganizationalUnit[] {
    return Array.from(this.units.values()).filter((u) => !u.parentUnitId);
  }

  getUnitByManager(manager: string): OrganizationalUnit | null {
    return Array.from(this.units.values()).find((u) => u.manager === manager) || null;
  }

  getEmployeeDevelopmentPlans(employeeId: string): DevelopmentPlan[] {
    return Array.from(this.developmentPlans.values()).filter((p) => p.employeeId === employeeId);
  }

  calculateTotalHeadCount(): number {
    return Array.from(this.units.values()).reduce((sum, u) => sum + u.headCount, 0);
  }

  calculateTotalBudget(): number {
    return Array.from(this.units.values()).reduce((sum, u) => sum + u.budget, 0);
  }

  getStatistics(): Record<string, any> {
    const units = Array.from(this.units.values());
    const plans = Array.from(this.developmentPlans.values());

    return {
      totalUnits: units.length,
      totalHeadCount: this.calculateTotalHeadCount(),
      totalBudget: this.calculateTotalBudget(),
      unitsByType: {
        department: units.filter((u) => u.type === "department").length,
        team: units.filter((u) => u.type === "team").length,
        division: units.filter((u) => u.type === "division").length,
        group: units.filter((u) => u.type === "group").length,
      },
      totalDevelopmentPlans: plans.length,
      plansByStatus: {
        draft: plans.filter((p) => p.status === "draft").length,
        active: plans.filter((p) => p.status === "active").length,
        completed: plans.filter((p) => p.status === "completed").length,
      },
    };
  }

  generateOrganizationalReport(): string {
    const stats = this.getStatistics();
    return `Organizational Planning Report\nTotal Units: ${stats.totalUnits}\nTotal Head Count: ${stats.totalHeadCount}\nTotal Budget: ${stats.totalBudget}\nDevelopment Plans: ${stats.totalDevelopmentPlans}`;
  }
}

let globalOrganizationalPlanningManager: OrganizationalPlanningManager | null = null;

export function getOrganizationalPlanningManager(): OrganizationalPlanningManager {
  if (!globalOrganizationalPlanningManager) {
    globalOrganizationalPlanningManager = new OrganizationalPlanningManager();
  }
  return globalOrganizationalPlanningManager;
}
