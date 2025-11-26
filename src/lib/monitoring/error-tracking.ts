/**
 * Error Tracking Manager
 * Semana 45, Tarea 45.6: Error Tracking
 */

import { logger } from "@/lib/monitoring";

export interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  severity: "warning" | "error" | "fatal";
  service: string;
  timestamp: Date;
  userId?: string;
  url?: string;
  context?: Record<string, any>;
}

export interface ErrorGroup {
  id: string;
  fingerprint: string;
  message: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affected: string[];
  isResolved: boolean;
}

export class ErrorTrackingManager {
  private errors: Map<string, ErrorEvent> = new Map();
  private groups: Map<string, ErrorGroup> = new Map();

  constructor() {
    logger.debug({ type: "error_tracking_init" }, "Error Tracking Manager inicializado");
  }

  trackError(
    message: string,
    severity: string,
    service: string,
    context?: Record<string, any>,
  ): ErrorEvent {
    const error: ErrorEvent = {
      id: `err_${Date.now()}`,
      message,
      severity: severity as any,
      service,
      timestamp: new Date(),
      context,
    };
    this.errors.set(error.id, error);

    const fingerprint = Buffer.from(message + service)
      .toString("base64")
      .substring(0, 32);
    let group = Array.from(this.groups.values()).find((g) => g.fingerprint === fingerprint);

    if (group) {
      group.count++;
      group.lastOccurrence = new Date();
    } else {
      group = {
        id: `grp_${Date.now()}`,
        fingerprint,
        message,
        count: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        affected: [service],
        isResolved: false,
      };
      this.groups.set(group.id, group);
    }

    logger.error({ type: "error_tracked", severity }, `Error: ${message}`);
    return error;
  }

  getErrorGroups(): ErrorGroup[] {
    return Array.from(this.groups.values()).sort((a, b) => b.count - a.count);
  }

  resolveErrorGroup(groupId: string): ErrorGroup | null {
    const group = this.groups.get(groupId);
    if (!group) return null;
    group.isResolved = true;
    logger.info({ type: "error_group_resolved" }, "Grupo de errores resuelto");
    return group;
  }

  getErrorsByService(service: string): ErrorEvent[] {
    return Array.from(this.errors.values()).filter((e) => e.service === service);
  }

  getStatistics() {
    return {
      totalErrors: this.errors.size,
      errorGroups: this.groups.size,
      unresolvedGroups: Array.from(this.groups.values()).filter((g) => !g.isResolved).length,
    };
  }
}

let globalErrorTrackingManager: ErrorTrackingManager | null = null;

export function getErrorTrackingManager(): ErrorTrackingManager {
  if (!globalErrorTrackingManager) {
    globalErrorTrackingManager = new ErrorTrackingManager();
  }
  return globalErrorTrackingManager;
}
