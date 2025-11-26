/**
 * User Experience Monitoring Manager
 * Semana 45, Tarea 45.11: User Experience Monitoring
 */

import { logger } from "@/lib/monitoring";

export interface UserExperienceMetric {
  id: string;
  metricType: "page_load" | "interaction_latency" | "error_rate" | "conversion";
  value: number;
  timestamp: Date;
  userId?: string;
  page?: string;
}

export interface SessionMetrics {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  pageViews: number;
  interactions: number;
  errors: number;
  satisfactionScore?: number;
}

export class UserExperienceMonitoringManager {
  private metrics: Map<string, UserExperienceMetric> = new Map();
  private sessions: Map<string, SessionMetrics> = new Map();

  constructor() {
    logger.debug({ type: "ux_init" }, "User Experience Monitoring Manager inicializado");
  }

  recordMetric(
    metricType: string,
    value: number,
    userId?: string,
    page?: string,
  ): UserExperienceMetric {
    const metric: UserExperienceMetric = {
      id: `ux_${Date.now()}`,
      metricType: metricType as any,
      value,
      timestamp: new Date(),
      userId,
      page,
    };
    this.metrics.set(metric.id, metric);
    logger.debug({ type: "ux_metric_recorded" }, `UX Métrica: ${metricType} = ${value}`);
    return metric;
  }

  startSession(userId: string): SessionMetrics {
    const session: SessionMetrics = {
      sessionId: `session_${Date.now()}`,
      userId,
      startTime: new Date(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
    };
    this.sessions.set(session.sessionId, session);
    logger.debug({ type: "session_started" }, `Sesión iniciada: ${userId}`);
    return session;
  }

  recordInteraction(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.interactions++;
    return true;
  }

  endSession(sessionId: string, satisfactionScore?: number): SessionMetrics | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.endTime = new Date();
    session.satisfactionScore = satisfactionScore;
    logger.debug({ type: "session_ended" }, `Sesión finalizada`);
    return session;
  }

  getAveragePageLoadTime(): number {
    const metrics = Array.from(this.metrics.values()).filter((m) => m.metricType === "page_load");
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  getStatistics() {
    return {
      totalMetrics: this.metrics.size,
      activeSessions: Array.from(this.sessions.values()).filter((s) => !s.endTime).length,
      completedSessions: Array.from(this.sessions.values()).filter((s) => s.endTime).length,
    };
  }
}

let globalUxMonitor: UserExperienceMonitoringManager | null = null;

export function getUserExperienceMonitoringManager(): UserExperienceMonitoringManager {
  if (!globalUxMonitor) {
    globalUxMonitor = new UserExperienceMonitoringManager();
  }
  return globalUxMonitor;
}
