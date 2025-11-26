/**
 * Automation Workflow Performance Analytics
 * Semana 33, Tarea 33.6: Analytics de flujos automáticos
 */

import { logger } from '@/lib/monitoring'

export interface WorkflowMetrics {
  workflowId: string
  name: string
  trigger: string
  totalEnrolled: number
  completed: number
  abandoned: number
  revenue: number
  avgValue: number
  emailsPerEnrollment: number
  performance: { step: string; completion: number }[]
}

export class WorkflowAnalytics {
  private metrics: Map<string, WorkflowMetrics> = new Map()

  constructor() {
    logger.debug({ type: 'workflow_analytics_init' }, 'Workflow Analytics inicializado')
  }

  recordMetrics(metrics: WorkflowMetrics): void {
    this.metrics.set(metrics.workflowId, metrics)
  }

  getTopPerformingWorkflows(): WorkflowMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  getBottlenecks(workflowId: string): Array<{ step: string; dropoff: number }> {
    const metrics = this.metrics.get(workflowId)
    if (!metrics) return []

    const bottlenecks: Array<{ step: string; dropoff: number }> = []

    for (let i = 0; i < metrics.performance.length - 1; i++) {
      const current = metrics.performance[i].completion
      const next = metrics.performance[i + 1].completion
      const dropoff = current - next

      if (dropoff > 0) {
        bottlenecks.push({ step: metrics.performance[i].step, dropoff })
      }
    }

    return bottlenecks
  }

  calculateROI(workflowId: string, costPerEmail: number): number {
    const metrics = this.metrics.get(workflowId)
    if (!metrics) return 0

    const totalCost = metrics.totalEnrolled * metrics.emailsPerEnrollment * costPerEmail
    return totalCost > 0 ? (metrics.revenue - totalCost) / totalCost * 100 : 0
  }
}

let globalWorkflowAnalytics: WorkflowAnalytics | null = null

export function initializeWorkflowAnalytics(): WorkflowAnalytics {
  if (!globalWorkflowAnalytics) {
    globalWorkflowAnalytics = new WorkflowAnalytics()
  }
  return globalWorkflowAnalytics
}

export function getWorkflowAnalytics(): WorkflowAnalytics {
  if (!globalWorkflowAnalytics) {
    return initializeWorkflowAnalytics()
  }
  return globalWorkflowAnalytics
}
