/**
 * Alert Management Manager
 * Semana 45, Tarea 45.4: Alert Management
 */

import { logger } from "@/lib/monitoring"

export interface Alert {
  id: string
  name: string
  condition: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "resolved" | "acknowledged"
  triggeredAt?: Date
  resolvedAt?: Date
  assignedTo?: string
}

export interface AlertRule {
  id: string
  metricName: string
  threshold: number
  operator: ">" | "<" | "==" | "\!="
  severity: string
  enabled: boolean
}

export class AlertManagementManager {
  private alerts: Map<string, Alert> = new Map()
  private rules: Map<string, AlertRule> = new Map()
  private history: Alert[] = []

  constructor() {
    logger.debug({ type: "alert_init" }, "Alert Management Manager inicializado")
  }

  createAlertRule(metricName: string, threshold: number, operator: string, severity: string): AlertRule {
    const rule: AlertRule = {
      id: `rule_${Date.now()}`,
      metricName,
      threshold,
      operator: operator as any,
      severity,
      enabled: true,
    }
    this.rules.set(rule.id, rule)
    logger.info({ type: "rule_created" }, `Regla de alerta creada: ${metricName}`)
    return rule
  }

  triggerAlert(name: string, condition: string, severity: string): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      name,
      condition,
      severity: severity as any,
      status: "active",
      triggeredAt: new Date(),
    }
    this.alerts.set(alert.id, alert)
    this.history.push(alert)
    logger.warn({ type: "alert_triggered", severity }, `Alerta: ${name}`)
    return alert
  }

  acknowledgeAlert(alertId: string, assignedTo: string): Alert | null {
    const alert = this.alerts.get(alertId)
    if (\!alert) return null
    alert.status = "acknowledged"
    alert.assignedTo = assignedTo
    logger.info({ type: "alert_acknowledged" }, `Alerta asignada a ${assignedTo}`)
    return alert
  }

  resolveAlert(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId)
    if (\!alert) return null
    alert.status = "resolved"
    alert.resolvedAt = new Date()
    logger.info({ type: "alert_resolved" }, "Alerta resuelta")
    return alert
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === "active")
  }

  getAlertsByServerity(severity: string): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.severity === severity)
  }

  getStatistics() {
    return {
      totalAlerts: this.alerts.size,
      activeAlerts: this.getActiveAlerts().length,
      totalRules: this.rules.size,
    }
  }
}

let globalAlertManager: AlertManagementManager | null = null

export function getAlertManagementManager(): AlertManagementManager {
  if (\!globalAlertManager) {
    globalAlertManager = new AlertManagementManager()
  }
  return globalAlertManager
}
