/**
 * Automation Workflows - Abandoned Cart, Welcome, Re-engagement
 * Semana 32, Tarea 32.6: Flujos automáticos de email marketing
 */

import { logger } from '@/lib/monitoring'

export type WorkflowTrigger = 'signup' | 'abandoned_cart' | 'purchase' | 'inactivity' | 'birthday'
export type WorkflowStatus = 'active' | 'paused' | 'disabled'

export interface WorkflowEmail {
  templateId: string
  delayMinutes: number
  subject: string
}

export interface EmailWorkflow {
  id: string
  tenantId: string
  name: string
  trigger: WorkflowTrigger
  status: WorkflowStatus
  emails: WorkflowEmail[]
  conditions?: Record<string, any>
  conversions: number
  revenue: number
  createdAt: Date
  updatedAt: Date
}

export class WorkflowManager {
  private workflows: Map<string, EmailWorkflow> = new Map()
  private workflowInstances: Map<string, { subscriberId: string; currentStep: number; startedAt: Date }[]> =
    new Map()

  constructor() {
    logger.debug({ type: 'workflow_manager_init' }, 'Workflow Manager inicializado')
  }

  createWorkflow(
    tenantId: string,
    data: Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'conversions' | 'revenue'>,
  ): EmailWorkflow {
    const workflow: EmailWorkflow = {
      ...data,
      id: `flow-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      conversions: 0,
      revenue: 0,
    }

    this.workflows.set(workflow.id, workflow)
    this.workflowInstances.set(workflow.id, [])

    logger.debug({ type: 'workflow_created', workflowId: workflow.id }, `Workflow creado: ${workflow.name}`)

    return workflow
  }

  triggerWorkflow(workflowId: string, subscriberId: string): void {
    const workflow = this.workflows.get(workflowId)
    if (!workflow || workflow.status !== 'active') return

    const instances = this.workflowInstances.get(workflowId) || []
    instances.push({ subscriberId, currentStep: 0, startedAt: new Date() })

    logger.debug(
      { type: 'workflow_triggered', workflowId, subscriberId },
      `Workflow iniciado para suscriptor`,
    )
  }

  getWorkflowStats(workflowId: string): {
    name: string
    engagedSubscribers: number
    conversionRate: number
    revenue: number
  } | null {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return null

    const instances = this.workflowInstances.get(workflowId) || []

    return {
      name: workflow.name,
      engagedSubscribers: instances.length,
      conversionRate: instances.length > 0 ? (workflow.conversions / instances.length) * 100 : 0,
      revenue: workflow.revenue,
    }
  }

  /**
   * Workflows predefinidos
   */
  static getPredefinedWorkflows() {
    return {
      welcomeSeries: (): Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt'> => ({
        tenantId: '',
        name: 'Welcome Series',
        trigger: 'signup',
        status: 'active',
        emails: [
          { templateId: 'welcome-1', delayMinutes: 5, subject: 'Welcome to {{storeName}}!' },
          { templateId: 'welcome-2', delayMinutes: 1440, subject: 'Here are your first products' },
          { templateId: 'welcome-3', delayMinutes: 2880, subject: 'Special discount inside' },
        ],
        conversions: 0,
        revenue: 0,
      }),

      abandonedCart: (): Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt'> => ({
        tenantId: '',
        name: 'Abandoned Cart Recovery',
        trigger: 'abandoned_cart',
        status: 'active',
        emails: [
          { templateId: 'cart-1', delayMinutes: 60, subject: 'You left {{itemCount}} items' },
          { templateId: 'cart-2', delayMinutes: 1440, subject: 'Last chance: {{discount}}% off' },
          { templateId: 'cart-3', delayMinutes: 2880, subject: 'Final reminder on your items' },
        ],
        conversions: 0,
        revenue: 0,
      }),

      reengagement: (): Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt'> => ({
        tenantId: '',
        name: 'Re-engagement Campaign',
        trigger: 'inactivity',
        status: 'active',
        emails: [
          { templateId: 'reeng-1', delayMinutes: 60, subject: 'We miss you!' },
          { templateId: 'reeng-2', delayMinutes: 10080, subject: 'Exclusive offer for you' },
        ],
        conversions: 0,
        revenue: 0,
      }),
    }
  }
}

let globalWorkflowManager: WorkflowManager | null = null

export function initializeWorkflowManager(): WorkflowManager {
  if (!globalWorkflowManager) {
    globalWorkflowManager = new WorkflowManager()
  }
  return globalWorkflowManager
}

export function getWorkflowManager(): WorkflowManager {
  if (!globalWorkflowManager) {
    return initializeWorkflowManager()
  }
  return globalWorkflowManager
}
