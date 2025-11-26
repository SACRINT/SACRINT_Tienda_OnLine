/**
 * Code Metrics Analyzer Manager
 * Semana 49, Tarea 49.6: Code Metrics Analysis
 */

import { logger } from "@/lib/monitoring"

export interface CodeMetrics {
  id: string
  file: string
  linesOfCode: number
  cyclomaticComplexity: number
  maintainabilityIndex: number
  avgFunctionLength: number
}

export interface MetricsReport {
  id: string
  timestamp: Date
  metrics: CodeMetrics[]
  averageComplexity: number
  averageMaintainability: number
}

export class CodeMetricsAnalyzerManager {
  private metrics: Map<string, CodeMetrics> = new Map()
  private reports: Map<string, MetricsReport> = new Map()

  constructor() {
    logger.debug({ type: "metrics_analyzer_init" }, "Code Metrics Analyzer Manager inicializado")
  }

  analyzeFile(file: string, linesOfCode: number, cyclomaticComplexity: number, avgFunctionLength: number): CodeMetrics {
    const metrics: CodeMetrics = {
      id: `metric_${Date.now()}`,
      file,
      linesOfCode,
      cyclomaticComplexity,
      maintainabilityIndex: Math.max(0, 171 - (5.2 * Math.log(Math.abs(cyclomaticComplexity)))),
      avgFunctionLength,
    }
    this.metrics.set(metrics.id, metrics)
    logger.info({ type: "file_analyzed" }, `${file}: CC=${cyclomaticComplexity}`)
    return metrics
  }

  generateMetricsReport(): MetricsReport {
    const allMetrics = Array.from(this.metrics.values())
    const avgComplexity = allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / allMetrics.length : 0
    const avgMaintainability = allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.maintainabilityIndex, 0) / allMetrics.length : 0

    const report: MetricsReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      metrics: allMetrics,
      averageComplexity: avgComplexity,
      averageMaintainability: avgMaintainability,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Avg Complexity: ${avgComplexity.toFixed(1)}`)
    return report
  }

  getStatistics() {
    const allMetrics = Array.from(this.metrics.values())
    return {
      filesAnalyzed: allMetrics.length,
      totalLinesOfCode: allMetrics.reduce((sum, m) => sum + m.linesOfCode, 0),
      avgComplexity: allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / allMetrics.length : 0,
    }
  }
}

let globalCodeMetricsAnalyzer: CodeMetricsAnalyzerManager | null = null

export function getCodeMetricsAnalyzerManager(): CodeMetricsAnalyzerManager {
  if (!globalCodeMetricsAnalyzer) {
    globalCodeMetricsAnalyzer = new CodeMetricsAnalyzerManager()
  }
  return globalCodeMetricsAnalyzer
}
