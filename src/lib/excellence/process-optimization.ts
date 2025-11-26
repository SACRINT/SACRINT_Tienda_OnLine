/**
 * Process Optimization Manager
 * Semana 55, Tarea 55.8: Process Optimization & Efficiency
 */

import { logger } from "@/lib/monitoring"

export interface ProcessMetric {
  id: string
  processName: string
  currentCycletime: number
  targetCycletime: number
  efficiency: number
  automationPercent: number
  status: "optimized" | "improving" | "needs-work"
}

export class ProcessOptimizationManager {
  private metrics: Map<string, ProcessMetric> = new Map()

  constructor() {
    logger.debug({ type: "process_optimization_init" }, "Manager inicializado")
  }

  assessProcessEfficiency(
    processName: string,
    currentCycletime: number,
    targetCycletime: number,
    automationPercent: number
  ): ProcessMetric {
    const id = "process_" + Date.now()
    const efficiency = (targetCycletime / currentCycletime) * 100
    let status: "optimized" | "improving" | "needs-work"
    if (efficiency >= 95) {
      status = "optimized"
    } else if (efficiency >= 80) {
      status = "improving"
    } else {
      status = "needs-work"
    }

    const metric: ProcessMetric = {
      id,
      processName,
      currentCycletime,
      targetCycletime,
      efficiency,
      automationPercent,
      status,
    }

    this.metrics.set(id, metric)
    logger.info({ type: "process_assessed", metricId: id }, `Proceso evaluado`)
    return metric
  }

  getStatistics(): Record<string, unknown> {
    const metrics = Array.from(this.metrics.values())

    return {
      totalProcesses: metrics.length,
      byStatus: {
        optimized: metrics.filter((m) => m.status === "optimized").length,
        improving: metrics.filter((m) => m.status === "improving").length,
        needsWork: metrics.filter((m) => m.status === "needs-work").length,
      },
      averageAutomation:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.automationPercent, 0) / metrics.length
          : 0,
    }
  }

  generateProcessReport(): string {
    const stats = this.getStatistics()
    return `Process Optimization Report\nProcesses: ${stats.totalProcesses}\nOptimized: ${stats.byStatus.optimized}`
  }
}

let globalProcessOptimizationManager: ProcessOptimizationManager | null = null

export function getProcessOptimizationManager(): ProcessOptimizationManager {
  if (!globalProcessOptimizationManager) {
    globalProcessOptimizationManager = new ProcessOptimizationManager()
  }
  return globalProcessOptimizationManager
}
