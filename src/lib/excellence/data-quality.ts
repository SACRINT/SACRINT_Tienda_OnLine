/**
 * Data Quality Manager
 * Semana 55, Tarea 55.5: Data Quality & Data Governance
 */

import { logger } from "@/lib/monitoring";

export interface DataQualityMetric {
  id: string;
  datasetName: string;
  completenessPercent: number;
  accuracyPercent: number;
  consistencyPercent: number;
  overallScore: number;
}

export class DataQualityManager {
  private metrics: Map<string, DataQualityMetric> = new Map();

  constructor() {
    logger.debug({ type: "data_quality_init" }, "Manager inicializado");
  }

  assessDataQuality(
    datasetName: string,
    completenessPercent: number,
    accuracyPercent: number,
    consistencyPercent: number,
  ): DataQualityMetric {
    const id = "dq_" + Date.now();
    const overallScore = (completenessPercent + accuracyPercent + consistencyPercent) / 3;

    const metric: DataQualityMetric = {
      id,
      datasetName,
      completenessPercent,
      accuracyPercent,
      consistencyPercent,
      overallScore,
    };

    this.metrics.set(id, metric);
    logger.info({ type: "data_quality_assessed", metricId: id }, `Calidad de datos evaluada`);
    return metric;
  }

  getStatistics(): Record<string, any> {
    const metrics = Array.from(this.metrics.values());

    return {
      totalDatasets: metrics.length,
      averageScore:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length
          : 0,
    };
  }

  generateDataQualityReport(): string {
    const stats = this.getStatistics();
    return `Data Quality Report\nDatasets: ${stats.totalDatasets}\nAvg Score: ${stats.averageScore.toFixed(2)}`;
  }
}

let globalDataQualityManager: DataQualityManager | null = null;

export function getDataQualityManager(): DataQualityManager {
  if (!globalDataQualityManager) {
    globalDataQualityManager = new DataQualityManager();
  }
  return globalDataQualityManager;
}
