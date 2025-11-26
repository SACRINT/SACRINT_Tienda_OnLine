/**
 * Test Coverage Analysis Manager
 * Semana 49, Tarea 49.4: Test Coverage Analysis
 */

import { logger } from "@/lib/monitoring"

export interface CoverageMetric {
  id: string
  file: string
  linesCovered: number
  linesTotal: number
  branchCovered: number
  branchTotal: number
  coveragePercentage: number
}

export interface CoverageReport {
  id: string
  timestamp: Date
  metrics: CoverageMetric[]
  overallCoverage: number
  threshold: number
  meetsThreshold: boolean
}

export class TestCoverageAnalysisManager {
  private metrics: Map<string, CoverageMetric> = new Map()
  private reports: Map<string, CoverageReport> = new Map()

  constructor() {
    logger.debug({ type: "coverage_analysis_init" }, "Test Coverage Analysis Manager inicializado")
  }

  recordCoverageMetric(file: string, linesCovered: number, linesTotal: number, branchCovered: number, branchTotal: number): CoverageMetric {
    const metric: CoverageMetric = {
      id: `metric_${Date.now()}`,
      file,
      linesCovered,
      linesTotal,
      branchCovered,
      branchTotal,
      coveragePercentage: (linesCovered / linesTotal) * 100,
    }
    this.metrics.set(metric.id, metric)
    logger.info({ type: "metric_recorded" }, `${file}: ${metric.coveragePercentage.toFixed(1)}%`)
    return metric
  }

  generateCoverageReport(threshold: number = 80): CoverageReport {
    const allMetrics = Array.from(this.metrics.values())
    const totalCovered = allMetrics.reduce((sum, m) => sum + m.linesCovered, 0)
    const totalLines = allMetrics.reduce((sum, m) => sum + m.linesTotal, 0)
    const overallCoverage = totalLines > 0 ? (totalCovered / totalLines) * 100 : 0

    const report: CoverageReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      metrics: allMetrics.sort((a, b) => a.coveragePercentage - b.coveragePercentage),
      overallCoverage,
      threshold,
      meetsThreshold: overallCoverage >= threshold,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Coverage: ${overallCoverage.toFixed(1)}%`)
    return report
  }

  getStatistics() {
    const allMetrics = Array.from(this.metrics.values())
    const avgCoverage = allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.coveragePercentage, 0) / allMetrics.length : 0
    return {
      filesAnalyzed: allMetrics.length,
      averageCoverage: avgCoverage,
      lowCoverageFiles: allMetrics.filter(m => m.coveragePercentage < 80).length,
    }
  }
}

let globalCoverageAnalysisManager: TestCoverageAnalysisManager | null = null

export function getTestCoverageAnalysisManager(): TestCoverageAnalysisManager {
  if (!globalCoverageAnalysisManager) {
    globalCoverageAnalysisManager = new TestCoverageAnalysisManager()
  }
  return globalCoverageAnalysisManager
}
