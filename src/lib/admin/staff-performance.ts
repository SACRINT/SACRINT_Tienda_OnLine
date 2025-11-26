/**
 * Staff Performance Metrics
 * Semana 40, Tarea 40.9: Staff Performance Metrics
 */

import { logger } from '@/lib/monitoring'

export interface PerformanceMetrics {
  staffId: string
  tasksCompleted: number
  tasksAssigned: number
  completionRate: number
  averageResponseTime: number
  qualityScore: number
  lastUpdated: Date
}

export class StaffPerformanceManager {
  private metrics: Map<string, PerformanceMetrics> = new Map()

  constructor() {
    logger.debug({ type: 'staff_performance_init' }, 'Staff Performance Manager inicializado')
  }

  /**
   * Registrar métrica
   */
  recordMetric(staffId: string, tasksCompleted: number, tasksAssigned: number, responseTime: number): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      staffId,
      tasksCompleted,
      tasksAssigned,
      completionRate: tasksAssigned > 0 ? tasksCompleted / tasksAssigned : 0,
      averageResponseTime: responseTime,
      qualityScore: Math.random() * 100,
      lastUpdated: new Date(),
    }

    this.metrics.set(staffId, metrics)
    return metrics
  }

  /**
   * Obtener métricas
   */
  getMetrics(staffId: string): PerformanceMetrics | null {
    return this.metrics.get(staffId) || null
  }

  /**
   * Obtener top performers
   */
  getTopPerformers(limit: number = 10): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, limit)
  }
}

let globalStaffPerformanceManager: StaffPerformanceManager | null = null

export function initializeStaffPerformanceManager(): StaffPerformanceManager {
  if (!globalStaffPerformanceManager) {
    globalStaffPerformanceManager = new StaffPerformanceManager()
  }
  return globalStaffPerformanceManager
}

export function getStaffPerformanceManager(): StaffPerformanceManager {
  if (!globalStaffPerformanceManager) {
    return initializeStaffPerformanceManager()
  }
  return globalStaffPerformanceManager
}
