/**
 * Strategic Vision Manager
 * Semana 56, Tarea 56.1: Strategic Vision & Long-term Direction
 */

import { logger } from "@/lib/monitoring";

export interface StrategicGoal {
  id: string;
  goalName: string;
  horizon: "short" | "medium" | "long";
  targetYear: number;
  description: string;
  keyResults: string[];
  status: "defined" | "in-progress" | "achieved";
  progressPercent: number;
}

export interface VisionStatement {
  id: string;
  visionText: string;
  createdDate: Date;
  missionStatement: string;
  coreValues: string[];
  visionHorizon: number;
}

export class StrategicVisionManager {
  private strategicGoals: Map<string, StrategicGoal> = new Map();
  private visionStatements: Map<string, VisionStatement> = new Map();

  constructor() {
    logger.debug({ type: "strategic_vision_init" }, "Manager inicializado");
  }

  defineStrategicGoal(
    goalName: string,
    horizon: "short" | "medium" | "long",
    targetYear: number,
    description: string,
    keyResults: string[],
  ): StrategicGoal {
    const id = "goal_" + Date.now();
    const goal: StrategicGoal = {
      id,
      goalName,
      horizon,
      targetYear,
      description,
      keyResults,
      status: "defined",
      progressPercent: 0,
    };

    this.strategicGoals.set(id, goal);
    logger.info(
      { type: "strategic_goal_defined", goalId: id },
      `Objetivo estratégico definido: ${goalName}`,
    );
    return goal;
  }

  createVisionStatement(
    visionText: string,
    missionStatement: string,
    coreValues: string[],
    visionHorizon: number,
  ): VisionStatement {
    const id = "vision_" + Date.now();
    const vision: VisionStatement = {
      id,
      visionText,
      createdDate: new Date(),
      missionStatement,
      coreValues,
      visionHorizon,
    };

    this.visionStatements.set(id, vision);
    logger.info({ type: "vision_statement_created", visionId: id }, `Declaración de visión creada`);
    return vision;
  }

  getStatistics(): Record<string, any> {
    const goals = Array.from(this.strategicGoals.values());

    return {
      totalStrategicGoals: goals.length,
      goalsByHorizon: {
        short: goals.filter((g) => g.horizon === "short").length,
        medium: goals.filter((g) => g.horizon === "medium").length,
        long: goals.filter((g) => g.horizon === "long").length,
      },
      goalsByStatus: {
        defined: goals.filter((g) => g.status === "defined").length,
        inProgress: goals.filter((g) => g.status === "in-progress").length,
        achieved: goals.filter((g) => g.status === "achieved").length,
      },
      totalVisionStatements: this.visionStatements.size,
      averageGoalProgress:
        goals.length > 0 ? goals.reduce((sum, g) => sum + g.progressPercent, 0) / goals.length : 0,
    };
  }

  generateStrategicReport(): string {
    const stats = this.getStatistics();
    return `Strategic Vision Report\nGoals: ${stats.totalStrategicGoals}\nVision Statements: ${stats.totalVisionStatements}\nAverage Progress: ${stats.averageGoalProgress.toFixed(2)}%`;
  }
}

let globalStrategicVisionManager: StrategicVisionManager | null = null;

export function getStrategicVisionManager(): StrategicVisionManager {
  if (!globalStrategicVisionManager) {
    globalStrategicVisionManager = new StrategicVisionManager();
  }
  return globalStrategicVisionManager;
}
