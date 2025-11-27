/**
 * Timeline Planning Manager
 * Semana 51, Tarea 51.6: Project Timeline & Schedule Planning
 */

import { logger } from "@/lib/monitoring";

export interface Timeline {
  id: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  phases: Phase[];
  status: "planning" | "scheduled" | "in-execution" | "completed";
  criticalPath: string[];
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
  actualDate?: Date;
  predecessors: string[];
  successors: string[];
  status: "pending" | "on-track" | "at-risk" | "completed";
}

export interface Phase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  dependencies: string[];
  status: "not-started" | "in-progress" | "completed";
}

export class TimelinePlanningManager {
  private timelines: Map<string, Timeline> = new Map();
  private ganttData: Map<string, Phase[]> = new Map();

  constructor() {
    logger.debug({ type: "timeline_planning_init" }, "Manager inicializado");
  }

  createTimeline(projectName: string, startDate: Date, endDate: Date): Timeline {
    const id = "timeline_" + Date.now();
    const timeline: Timeline = {
      id,
      projectName,
      startDate,
      endDate,
      milestones: [],
      phases: [],
      status: "planning",
      criticalPath: [],
    };
    this.timelines.set(id, timeline);
    this.ganttData.set(id, []);
    logger.info(
      { type: "timeline_created", timelineId: id },
      `Timeline creado para: ${projectName}`,
    );
    return timeline;
  }

  addMilestone(
    timelineId: string,
    name: string,
    targetDate: Date,
    predecessors: string[] = [],
  ): Milestone | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return null;

    const milestone: Milestone = {
      id: "milestone_" + Date.now(),
      name,
      targetDate,
      predecessors,
      successors: [],
      status: "pending",
    };

    timeline.milestones.push(milestone);
    logger.info({ type: "milestone_added", timelineId }, `Hito agregado: ${name}`);
    return milestone;
  }

  addPhase(
    timelineId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    dependencies: string[] = [],
  ): Phase | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return null;

    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const phase: Phase = {
      id: "phase_" + Date.now(),
      name,
      startDate,
      endDate,
      duration,
      dependencies,
      status: "not-started",
    };

    timeline.phases.push(phase);
    const phases = this.ganttData.get(timelineId) || [];
    phases.push(phase);
    this.ganttData.set(timelineId, phases);

    logger.info({ type: "phase_added", timelineId }, `Fase agregada: ${name} (${duration} días)`);
    return phase;
  }

  updateMilestoneStatus(
    timelineId: string,
    milestoneId: string,
    status: "pending" | "on-track" | "at-risk" | "completed",
    actualDate?: Date,
  ): Milestone | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return null;

    const milestone = timeline.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return null;

    milestone.status = status;
    if (actualDate) milestone.actualDate = actualDate;

    return milestone;
  }

  calculateCriticalPath(timelineId: string): string[] {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return [];

    const criticalPath: string[] = [];
    let maxDuration = 0;
    let currentPhase = "";

    for (const phase of timeline.phases) {
      if (phase.duration >= maxDuration) {
        maxDuration = phase.duration;
        currentPhase = phase.id;
      }
    }

    if (currentPhase) criticalPath.push(currentPhase);
    timeline.criticalPath = criticalPath;
    this.timelines.set(timelineId, timeline);

    return criticalPath;
  }

  getStatistics(): Record<string, any> {
    const timelines = Array.from(this.timelines.values());
    const totalMilestones = timelines.reduce((sum, t) => sum + t.milestones.length, 0);
    const totalPhases = timelines.reduce((sum, t) => sum + t.phases.length, 0);

    return {
      totalTimelines: timelines.length,
      totalMilestones,
      totalPhases,
      byStatus: {
        planning: timelines.filter((t) => t.status === "planning").length,
        scheduled: timelines.filter((t) => t.status === "scheduled").length,
        inExecution: timelines.filter((t) => t.status === "in-execution").length,
        completed: timelines.filter((t) => t.status === "completed").length,
      },
    };
  }

  generateTimelineReport(): string {
    const stats = this.getStatistics();
    return `Timeline Planning Report\nTotal Timelines: ${stats.totalTimelines}\nTotal Milestones: ${stats.totalMilestones}\nTotal Phases: ${stats.totalPhases}`;
  }
}

let globalTimelinePlanningManager: TimelinePlanningManager | null = null;

export function getTimelinePlanningManager(): TimelinePlanningManager {
  if (!globalTimelinePlanningManager) {
    globalTimelinePlanningManager = new TimelinePlanningManager();
  }
  return globalTimelinePlanningManager;
}
