/**
 * System Reliability Manager
 * Semana 55, Tarea 55.4: System Reliability & Fault Tolerance
 */

import { logger } from "@/lib/monitoring";

export interface ReliabilityMetric {
  id: string;
  componentName: string;
  availabilityPercent: number;
  mtbf: number;
  mttr: number;
  status: "excellent" | "good" | "fair" | "poor";
}

export class SystemReliabilityManager {
  private metrics: Map<string, ReliabilityMetric> = new Map();

  constructor() {
    logger.debug({ type: "system_reliability_init" }, "Manager inicializado");
  }

  recordReliabilityMetric(
    componentName: string,
    availabilityPercent: number,
    mtbf: number,
    mttr: number,
  ): ReliabilityMetric {
    const id = "reliability_" + Date.now();
    let status: "excellent" | "good" | "fair" | "poor";
    if (availabilityPercent >= 99.99) {
      status = "excellent";
    } else if (availabilityPercent >= 99.9) {
      status = "good";
    } else if (availabilityPercent >= 99) {
      status = "fair";
    } else {
      status = "poor";
    }

    const metric: ReliabilityMetric = {
      id,
      componentName,
      availabilityPercent,
      mtbf,
      mttr,
      status,
    };

    this.metrics.set(id, metric);
    logger.info(
      { type: "reliability_metric_recorded", metricId: id },
      `Métrica de confiabilidad registrada`,
    );
    return metric;
  }

  getStatistics(): Record<string, any> {
    const metrics = Array.from(this.metrics.values());

    return {
      totalComponents: metrics.length,
      averageAvailability:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.availabilityPercent, 0) / metrics.length
          : 0,
      byStatus: {
        excellent: metrics.filter((m) => m.status === "excellent").length,
        good: metrics.filter((m) => m.status === "good").length,
      },
    };
  }

  generateReliabilityReport(): string {
    const stats = this.getStatistics();
    return `System Reliability Report\nComponents: ${stats.totalComponents}\nAvg Availability: ${stats.averageAvailability.toFixed(4)}%`;
  }
}

let globalSystemReliabilityManager: SystemReliabilityManager | null = null;

export function getSystemReliabilityManager(): SystemReliabilityManager {
  if (!globalSystemReliabilityManager) {
    globalSystemReliabilityManager = new SystemReliabilityManager();
  }
  return globalSystemReliabilityManager;
}
