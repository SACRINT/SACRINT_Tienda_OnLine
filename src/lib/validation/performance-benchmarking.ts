/**
 * Performance Benchmarking Manager
 * Semana 50, Tarea 50.9: Performance Benchmarking
 */

import { logger } from "@/lib/monitoring"

export interface Benchmark {
  id: string
  metric: string
  baseline: number
  current: number
  target: number
  unit: string
  status: "passed" | "warning" | "failed"
}

export interface BenchmarkingReport {
  id: string
  timestamp: Date
  benchmarks: Benchmark[]
  overallScore: number
  meetsTargets: boolean
}

export class PerformanceBenchmarkingManager {
  private benchmarks: Map<string, Benchmark> = new Map()
  private reports: Map<string, BenchmarkingReport> = new Map()

  constructor() {
    logger.debug({ type: "benchmarking_init" }, "Performance Benchmarking Manager inicializado")
  }

  recordBenchmark(metric: string, baseline: number, current: number, target: number, unit: string = "ms"): Benchmark {
    const benchmark: Benchmark = {
      id: `bench_${Date.now()}`,
      metric,
      baseline,
      current,
      target,
      unit,
      status: current <= target ? "passed" : current <= target * 1.1 ? "warning" : "failed",
    }
    this.benchmarks.set(benchmark.id, benchmark)
    logger.info({ type: "benchmark_recorded" }, `${metric}: ${current}${unit}`)
    return benchmark
  }

  generateBenchmarkReport(): BenchmarkingReport {
    const allBenchmarks = Array.from(this.benchmarks.values())
    const passedCount = allBenchmarks.filter(b => b.status === "passed").length
    const overallScore = (passedCount / allBenchmarks.length) * 100

    const report: BenchmarkingReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      benchmarks: allBenchmarks,
      overallScore,
      meetsTargets: passedCount === allBenchmarks.length,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Benchmarking Score: ${overallScore.toFixed(1)}%`)
    return report
  }

  getStatistics() {
    const allBenchmarks = Array.from(this.benchmarks.values())
    return {
      totalBenchmarks: allBenchmarks.length,
      passedBenchmarks: allBenchmarks.filter(b => b.status === "passed").length,
      failedBenchmarks: allBenchmarks.filter(b => b.status === "failed").length,
    }
  }
}

let globalBenchmarkingManager: PerformanceBenchmarkingManager | null = null

export function getPerformanceBenchmarkingManager(): PerformanceBenchmarkingManager {
  if (!globalBenchmarkingManager) {
    globalBenchmarkingManager = new PerformanceBenchmarkingManager()
  }
  return globalBenchmarkingManager
}
