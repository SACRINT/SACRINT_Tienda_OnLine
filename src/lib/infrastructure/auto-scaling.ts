/**
 * Auto Scaling Manager
 * Semana 46, Tarea 46.6: Auto Scaling
 */

import { logger } from "@/lib/monitoring"

export interface ScalingPolicy {
  id: string
  serviceName: string
  metric: string
  scaleUpThreshold: number
  scaleDownThreshold: number
  minInstances: number
  maxInstances: number
  cooldownPeriod: number
}

export interface ScalingEvent {
  id: string
  policyId: string
  timestamp: Date
  action: "scale_up" | "scale_down"
  previousInstances: number
  newInstances: number
}

export class AutoScalingManager {
  private policies: Map<string, ScalingPolicy> = new Map()
  private events: Map<string, ScalingEvent> = new Map()
  private currentInstances: Map<string, number> = new Map()

  constructor() {
    logger.debug({ type: "autoscale_init" }, "Auto Scaling Manager inicializado")
  }

  createScalingPolicy(serviceName: string, metric: string, scaleUpThreshold: number, scaleDownThreshold: number, minInstances: number, maxInstances: number): ScalingPolicy {
    const policy: ScalingPolicy = {
      id: `policy_${Date.now()}`,
      serviceName,
      metric,
      scaleUpThreshold,
      scaleDownThreshold,
      minInstances,
      maxInstances,
      cooldownPeriod: 300,
    }
    this.policies.set(policy.id, policy)
    this.currentInstances.set(serviceName, minInstances)
    logger.info({ type: "policy_created" }, `Política creada: ${serviceName}`)
    return policy
  }

  evaluateScaling(policyId: string, currentMetricValue: number): ScalingEvent | null {
    const policy = this.policies.get(policyId)
    if (!policy) return null

    const currentCount = this.currentInstances.get(policy.serviceName) || policy.minInstances
    let newCount = currentCount

    if (currentMetricValue > policy.scaleUpThreshold && currentCount < policy.maxInstances) {
      newCount = Math.min(currentCount + 1, policy.maxInstances)
    } else if (currentMetricValue < policy.scaleDownThreshold && currentCount > policy.minInstances) {
      newCount = Math.max(currentCount - 1, policy.minInstances)
    }

    if (newCount === currentCount) return null

    const event: ScalingEvent = {
      id: `event_${Date.now()}`,
      policyId,
      timestamp: new Date(),
      action: newCount > currentCount ? "scale_up" : "scale_down",
      previousInstances: currentCount,
      newInstances: newCount,
    }

    this.currentInstances.set(policy.serviceName, newCount)
    this.events.set(event.id, event)
    logger.info({ type: "scaling_event" }, `Scaling: ${currentCount} -> ${newCount}`)
    return event
  }

  getStatistics() {
    return {
      totalPolicies: this.policies.size,
      scalingEvents: this.events.size,
    }
  }
}

let globalAutoScalingManager: AutoScalingManager | null = null

export function getAutoScalingManager(): AutoScalingManager {
  if (!globalAutoScalingManager) {
    globalAutoScalingManager = new AutoScalingManager()
  }
  return globalAutoScalingManager
}
