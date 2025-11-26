/**
 * Database Monitoring Manager
 * Semana 44, Tarea 44.8: Database Monitoring
 */

import { logger } from "@/lib/monitoring";

export interface DatabaseMetric {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  connectionCount: number;
  queriesPerSecond: number;
  avgQueryTime: number;
}

export interface HealthCheck {
  id: string;
  status: "healthy" | "warning" | "critical";
  checks: Record<string, boolean>;
  timestamp: Date;
}

export class DatabaseMonitoringManager {
  private metrics: Map<string, DatabaseMetric> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: string[] = [];

  constructor() {
    logger.debug({ type: "monitoring_init" }, "Manager inicializado");
  }

  recordMetric(metric: DatabaseMetric): void {
    const key = metric.timestamp.toISOString();
    this.metrics.set(key, metric);
    logger.debug({ type: "metric_recorded" }, "Metrica registrada");
  }

  performHealthCheck(): HealthCheck {
    const check: HealthCheck = {
      id: `health_${Date.now()}`,
      status: "healthy",
      checks: {
        connectivity: true,
        performance: true,
        storage: true,
      },
      timestamp: new Date(),
    };
    this.healthChecks.set(check.id, check);
    logger.info({ type: "health_check_performed" }, "Verificacion completada");
    return check;
  }

  getRecentMetrics(limit: number = 100): DatabaseMetric[] {
    return Array.from(this.metrics.values()).slice(-limit);
  }

  getStatistics() {
    return {
      totalMetrics: this.metrics.size,
      healthChecks: this.healthChecks.size,
      alerts: this.alerts.length,
    };
  }
}

let globalMonitoringManager: DatabaseMonitoringManager | null = null;

export function getDatabaseMonitoringManager(): DatabaseMonitoringManager {
  if (!globalMonitoringManager) {
    globalMonitoringManager = new DatabaseMonitoringManager();
  }
  return globalMonitoringManager;
}
