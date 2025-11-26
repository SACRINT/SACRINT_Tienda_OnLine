/**
 * Deployment Rollback Manager
 * Semana 47, Tarea 47.11: Deployment Rollback Management
 */

import { logger } from "@/lib/monitoring"

export interface RollbackPoint {
  id: string
  version: string
  timestamp: Date
  snapshotId: string
  automatic: boolean
  reason?: string
}

export interface RollbackEvent {
  id: string
  fromVersion: string
  toVersion: string
  timestamp: Date
  status: "initiated" | "in_progress" | "completed" | "failed"
  duration?: number
}

export class DeploymentRollbackManager {
  private rollbackPoints: Map<string, RollbackPoint> = new Map()
  private events: Map<string, RollbackEvent> = new Map()

  constructor() {
    logger.debug({ type: "rollback_init" }, "Deployment Rollback Manager inicializado")
  }

  createRollbackPoint(version: string, snapshotId: string, automatic: boolean = false): RollbackPoint {
    const point: RollbackPoint = {
      id: `rollback_${Date.now()}`,
      version,
      timestamp: new Date(),
      snapshotId,
      automatic,
    }
    this.rollbackPoints.set(point.id, point)
    logger.info({ type: "rollback_point_created" }, `Punto: v${version}`)
    return point
  }

  initiateRollback(fromVersion: string, toVersion: string, reason?: string): RollbackEvent {
    const event: RollbackEvent = {
      id: `event_${Date.now()}`,
      fromVersion,
      toVersion,
      timestamp: new Date(),
      status: "initiated",
      reason,
    }
    this.events.set(event.id, event)
    logger.warn({ type: "rollback_initiated" }, `Rollback: ${fromVersion} -> ${toVersion}`)
    return event
  }

  completeRollback(eventId: string): RollbackEvent | null {
    const event = this.events.get(eventId)
    if (!event) return null
    event.status = "completed"
    event.duration = Date.now() - event.timestamp.getTime()
    logger.warn({ type: "rollback_completed" }, "Rollback completado")
    return event
  }

  getStatistics() {
    return {
      totalRollbackPoints: this.rollbackPoints.size,
      completedRollbacks: Array.from(this.events.values()).filter(e => e.status === "completed").length,
      failedRollbacks: Array.from(this.events.values()).filter(e => e.status === "failed").length,
    }
  }
}

let globalRollbackManager: DeploymentRollbackManager | null = null

export function getDeploymentRollbackManager(): DeploymentRollbackManager {
  if (!globalRollbackManager) {
    globalRollbackManager = new DeploymentRollbackManager()
  }
  return globalRollbackManager
}
