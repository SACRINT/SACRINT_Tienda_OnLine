/**
 * Maintenance Schedule Manager
 * Semana 53, Tarea 53.1: Maintenance Schedule & Planning
 */

import { logger } from "@/lib/monitoring";

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  type: "preventive" | "corrective" | "adaptive" | "perfective";
  affectedSystems: string[];
  estimatedImpact: "high" | "medium" | "low";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  owner: string;
  notificationsSent: boolean;
}

export interface MaintenanceCalendar {
  id: string;
  month: string;
  year: number;
  maintenanceWindows: MaintenanceWindow[];
  totalHours: number;
  preventivePercentage: number;
  correctionPercentage: number;
}

export class MaintenanceScheduleManager {
  private maintenanceWindows: Map<string, MaintenanceWindow> = new Map();
  private maintenanceCalendars: Map<string, MaintenanceCalendar> = new Map();

  constructor() {
    logger.debug({ type: "maintenance_schedule_init" }, "Manager inicializado");
  }

  scheduleMaintenanceWindow(
    title: string,
    description: string,
    scheduledStartTime: Date,
    scheduledEndTime: Date,
    type: "preventive" | "corrective" | "adaptive" | "perfective",
    affectedSystems: string[],
    estimatedImpact: "high" | "medium" | "low",
    owner: string,
  ): MaintenanceWindow {
    const id = "maint_" + Date.now();
    const window: MaintenanceWindow = {
      id,
      title,
      description,
      scheduledStartTime,
      scheduledEndTime,
      type,
      affectedSystems,
      estimatedImpact,
      status: "scheduled",
      owner,
      notificationsSent: false,
    };

    this.maintenanceWindows.set(id, window);
    logger.info(
      { type: "maintenance_window_scheduled", windowId: id },
      `Ventana de mantenimiento programada: ${title}`,
    );
    return window;
  }

  startMaintenance(windowId: string): MaintenanceWindow | null {
    const window = this.maintenanceWindows.get(windowId);
    if (!window) return null;

    window.status = "in-progress";
    window.actualStartTime = new Date();
    this.maintenanceWindows.set(windowId, window);
    logger.info({ type: "maintenance_started", windowId }, `Mantenimiento iniciado`);
    return window;
  }

  completeMaintenance(windowId: string): MaintenanceWindow | null {
    const window = this.maintenanceWindows.get(windowId);
    if (!window) return null;

    window.status = "completed";
    window.actualEndTime = new Date();
    this.maintenanceWindows.set(windowId, window);
    logger.info({ type: "maintenance_completed", windowId }, `Mantenimiento completado`);
    return window;
  }

  sendNotifications(windowId: string): MaintenanceWindow | null {
    const window = this.maintenanceWindows.get(windowId);
    if (!window) return null;

    window.notificationsSent = true;
    logger.info(
      { type: "maintenance_notifications_sent", windowId },
      `Notificaciones de mantenimiento enviadas`,
    );
    return window;
  }

  getUpcomingMaintenance(daysAhead: number = 7): MaintenanceWindow[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return Array.from(this.maintenanceWindows.values())
      .filter(
        (w) =>
          w.status === "scheduled" &&
          w.scheduledStartTime >= now &&
          w.scheduledStartTime <= futureDate,
      )
      .sort((a, b) => a.scheduledStartTime.getTime() - b.scheduledStartTime.getTime());
  }

  getStatistics(): Record<string, any> {
    const windows = Array.from(this.maintenanceWindows.values());
    const completed = windows.filter((w) => w.status === "completed");
    const totalHours = completed.reduce(
      (sum, w) =>
        sum +
        (w.actualEndTime && w.actualStartTime
          ? (w.actualEndTime.getTime() - w.actualStartTime.getTime()) / (1000 * 60 * 60)
          : 0),
      0,
    );

    return {
      totalScheduledWindows: windows.length,
      byStatus: {
        scheduled: windows.filter((w) => w.status === "scheduled").length,
        inProgress: windows.filter((w) => w.status === "in-progress").length,
        completed: windows.filter((w) => w.status === "completed").length,
        cancelled: windows.filter((w) => w.status === "cancelled").length,
      },
      byType: {
        preventive: windows.filter((w) => w.type === "preventive").length,
        corrective: windows.filter((w) => w.type === "corrective").length,
        adaptive: windows.filter((w) => w.type === "adaptive").length,
        perfective: windows.filter((w) => w.type === "perfective").length,
      },
      totalCompletedHours: totalHours,
    };
  }

  generateScheduleReport(): string {
    const stats = this.getStatistics();
    return `Maintenance Schedule Report\nTotal Windows: ${stats.totalScheduledWindows}\nCompleted: ${stats.byStatus.completed}\nTotal Hours: ${stats.totalCompletedHours.toFixed(2)}`;
  }
}

let globalMaintenanceScheduleManager: MaintenanceScheduleManager | null = null;

export function getMaintenanceScheduleManager(): MaintenanceScheduleManager {
  if (!globalMaintenanceScheduleManager) {
    globalMaintenanceScheduleManager = new MaintenanceScheduleManager();
  }
  return globalMaintenanceScheduleManager;
}
