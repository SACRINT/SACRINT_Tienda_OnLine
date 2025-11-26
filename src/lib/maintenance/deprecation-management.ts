/**
 * Deprecation Manager
 * Semana 53, Tarea 53.6: Deprecation & Legacy Code Management
 */

import { logger } from "@/lib/monitoring"

export interface DeprecatedComponent {
  id: string
  componentName: string
  type: "api" | "feature" | "library" | "function"
  deprecatedSince: Date
  replacementComponent?: string
  removalTarget: Date
  status: "deprecation-notice" | "deprecated" | "legacy" | "removed"
  usageCount: number
  migratingUsers: string[]
  notes: string
}

export interface DeprecationPlan {
  id: string
  componentId: string
  migrationType: "direct-replacement" | "gradual-migration" | "feature-parity"
  phases: DeprecationPhase[]
  estimatedCompletionDate: Date
  status: "planned" | "in-progress" | "completed"
}

export interface DeprecationPhase {
  id: string
  phaseName: string
  targetDate: Date
  usersToMigrate: number
  completionPercentage: number
  status: "pending" | "active" | "completed"
}

export class DeprecationManager {
  private deprecatedComponents: Map<string, DeprecatedComponent> = new Map()
  private deprecationPlans: Map<string, DeprecationPlan> = new Map()

  constructor() {
    logger.debug({ type: "deprecation_management_init" }, "Manager inicializado")
  }

  deprecateComponent(
    componentName: string,
    type: "api" | "feature" | "library" | "function",
    replacementComponent: string | undefined,
    removalTarget: Date,
    notes: string
  ): DeprecatedComponent {
    const id = "dep_" + Date.now()
    const component: DeprecatedComponent = {
      id,
      componentName,
      type,
      deprecatedSince: new Date(),
      replacementComponent,
      removalTarget,
      status: "deprecation-notice",
      usageCount: 0,
      migratingUsers: [],
      notes,
    }

    this.deprecatedComponents.set(id, component)
    logger.info(
      { type: "component_deprecated", componentId: id },
      `Componente deprecado: ${componentName}`
    )
    return component
  }

  updateUsageCount(componentId: string, count: number): DeprecatedComponent | null {
    const component = this.deprecatedComponents.get(componentId)
    if (!component) return null

    component.usageCount = count
    this.deprecatedComponents.set(componentId, component)
    return component
  }

  createDeprecationPlan(
    componentId: string,
    migrationType: "direct-replacement" | "gradual-migration" | "feature-parity",
    phases: Array<{ phaseName: string; targetDate: Date; usersToMigrate: number }>,
    estimatedCompletionDate: Date
  ): DeprecationPlan | null {
    const component = this.deprecatedComponents.get(componentId)
    if (!component) return null

    const id = "plan_" + Date.now()
    const deprecationPhases: DeprecationPhase[] = phases.map((p) => ({
      id: "phase_" + Date.now(),
      phaseName: p.phaseName,
      targetDate: p.targetDate,
      usersToMigrate: p.usersToMigrate,
      completionPercentage: 0,
      status: "pending",
    }))

    const plan: DeprecationPlan = {
      id,
      componentId,
      migrationType,
      phases: deprecationPhases,
      estimatedCompletionDate,
      status: "planned",
    }

    this.deprecationPlans.set(id, plan)
    logger.info(
      { type: "deprecation_plan_created", planId: id },
      `Plan de deprecación creado`
    )
    return plan
  }

  updatePhaseProgress(
    planId: string,
    phaseId: string,
    completionPercentage: number
  ): DeprecationPhase | null {
    const plan = this.deprecationPlans.get(planId)
    if (!plan) return null

    const phase = plan.phases.find((p) => p.id === phaseId)
    if (!phase) return null

    phase.completionPercentage = completionPercentage
    if (completionPercentage === 100) {
      phase.status = "completed"
    } else if (completionPercentage > 0) {
      phase.status = "active"
    }

    this.deprecationPlans.set(planId, plan)
    return phase
  }

  markAsLegacy(componentId: string): DeprecatedComponent | null {
    const component = this.deprecatedComponents.get(componentId)
    if (!component) return null

    component.status = "legacy"
    this.deprecatedComponents.set(componentId, component)
    logger.info({ type: "component_marked_legacy", componentId }, `Componente marcado como legacy`)
    return component
  }

  getDeprecatedByType(type: "api" | "feature" | "library" | "function"): DeprecatedComponent[] {
    return Array.from(this.deprecatedComponents.values()).filter((c) => c.type === type)
  }

  getStatistics(): Record<string, unknown> {
    const components = Array.from(this.deprecatedComponents.values())
    const plans = Array.from(this.deprecationPlans.values())

    return {
      totalDeprecated: components.length,
      byStatus: {
        deprecationNotice: components.filter((c) => c.status === "deprecation-notice")
          .length,
        deprecated: components.filter((c) => c.status === "deprecated").length,
        legacy: components.filter((c) => c.status === "legacy").length,
        removed: components.filter((c) => c.status === "removed").length,
      },
      byType: {
        api: components.filter((c) => c.type === "api").length,
        feature: components.filter((c) => c.type === "feature").length,
        library: components.filter((c) => c.type === "library").length,
        function: components.filter((c) => c.type === "function").length,
      },
      totalDeprecationPlans: plans.length,
      plansByStatus: {
        planned: plans.filter((p) => p.status === "planned").length,
        inProgress: plans.filter((p) => p.status === "in-progress").length,
        completed: plans.filter((p) => p.status === "completed").length,
      },
    }
  }

  generateDeprecationReport(): string {
    const stats = this.getStatistics()
    return `Deprecation Management Report\nTotal Deprecated: ${stats.totalDeprecated}\nPlans: ${stats.totalDeprecationPlans}\nCompleted: ${stats.plansByStatus.completed}`
  }
}

let globalDeprecationManager: DeprecationManager | null = null

export function getDeprecationManager(): DeprecationManager {
  if (!globalDeprecationManager) {
    globalDeprecationManager = new DeprecationManager()
  }
  return globalDeprecationManager
}
