/**
 * Quality Assurance Enhancement Manager
 * Semana 55, Tarea 55.2: Quality Assurance & Zero-Defect Management
 */

import { logger } from "@/lib/monitoring";

export interface QAMetric {
  id: string;
  metricName: string;
  target: number;
  current: number;
  status: "on-track" | "at-risk" | "off-track";
  measuredDate: Date;
}

export class QualityAssuranceEnhancementManager {
  private metrics: Map<string, QAMetric> = new Map();

  constructor() {
    logger.debug({ type: "qa_enhancement_init" }, "Manager inicializado");
  }

  defineQAMetric(metricName: string, target: number): QAMetric {
    const id = "qa_" + Date.now();
    const metric: QAMetric = {
      id,
      metricName,
      target,
      current: 0,
      status: "at-risk",
      measuredDate: new Date(),
    };

    this.metrics.set(id, metric);
    logger.info({ type: "qa_metric_defined", metricId: id }, `Métrica QA definida`);
    return metric;
  }

  updateQAMetric(metricId: string, current: number): QAMetric | null {
    const metric = this.metrics.get(metricId);
    if (!metric) return null;

    metric.current = current;
    metric.status = current >= metric.target ? "on-track" : "off-track";
    this.metrics.set(metricId, metric);
    return metric;
  }

  getStatistics(): Record<string, any> {
    const metrics = Array.from(this.metrics.values());

    return {
      totalMetrics: metrics.length,
      onTrack: metrics.filter((m) => m.status === "on-track").length,
      offTrack: metrics.filter((m) => m.status === "off-track").length,
    };
  }

  generateQAReport(): string {
    const stats = this.getStatistics();
    return `QA Enhancement Report\nMetrics: ${stats.totalMetrics}\nOn Track: ${stats.onTrack}`;
  }
}

let globalQAEnhancementManager: QualityAssuranceEnhancementManager | null = null;

export function getQualityAssuranceEnhancementManager(): QualityAssuranceEnhancementManager {
  if (!globalQAEnhancementManager) {
    globalQAEnhancementManager = new QualityAssuranceEnhancementManager();
  }
  return globalQAEnhancementManager;
}
