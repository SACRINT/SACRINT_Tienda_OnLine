/**
 * Security Monitoring & Alerts
 * Semana 42, Tarea 42.5: Security Monitoring & Alerts
 */

import { logger } from '@/lib/monitoring'

export interface SecurityEvent {
  id: string
  eventType: 'login' | 'failed_login' | 'permission_denied' | 'data_access' | 'policy_violation' | 'malware_detected'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ipAddress: string
  resource: string
  timestamp: Date
  details: Record<string, any>
}

export interface SecurityAlert {
  id: string
  eventId: string
  alertType: 'threshold_exceeded' | 'anomaly_detected' | 'policy_violation' | 'threat_detected'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  triggered: Date
  acknowledged: boolean
  responseAction?: string
}

export interface AlertRule {
  id: string
  name: string
  condition: string
  threshold: number
  timeWindow: number
  alertSeverity: string
  enabled: boolean
}

export class SecurityMonitoringManager {
  private events: Map<string, SecurityEvent> = new Map()
  private alerts: Map<string, SecurityAlert> = new Map()
  private rules: Map<string, AlertRule> = new Map()
  private metrics: { failedLogins: number; dataAccessAttempts: number; policyViolations: number } = {
    failedLogins: 0,
    dataAccessAttempts: 0,
    policyViolations: 0,
  }

  constructor() {
    logger.debug({ type: 'security_monitoring_init' }, 'Security Monitoring Manager inicializado')
    this.initializeDefaultRules()
  }

  /**
   * Inicializar reglas por defecto
   */
  private initializeDefaultRules(): void {
    this.createAlertRule('5 fallidos en 5 min', 'failed_logins', 5, 300, 'high')
    this.createAlertRule('Acceso a datos sensibles', 'data_access', 10, 3600, 'medium')
    this.createAlertRule('Violación de política', 'policy_violation', 1, 60, 'critical')
  }

  /**
   * Registrar evento de seguridad
   */
  recordSecurityEvent(
    eventType: string,
    severity: string,
    ipAddress: string,
    resource: string,
    userId?: string,
    details?: Record<string, any>
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec_event_${Date.now()}`,
      eventType: eventType as any,
      severity: severity as any,
      userId,
      ipAddress,
      resource,
      timestamp: new Date(),
      details: details || {},
    }

    this.events.set(event.id, event)

    // Actualizar métricas
    if (eventType === 'failed_login') this.metrics.failedLogins++
    if (eventType === 'data_access') this.metrics.dataAccessAttempts++
    if (eventType === 'policy_violation') this.metrics.policyViolations++

    // Evaluar alertas
    this.evaluateAlertRules(event)

    logger.warn(
      { type: 'security_event_recorded', eventType, severity, ipAddress },
      `Evento de seguridad: ${eventType}`
    )

    return event
  }

  /**
   * Crear regla de alerta
   */
  createAlertRule(name: string, condition: string, threshold: number, timeWindow: number, severity: string): AlertRule {
    const rule: AlertRule = {
      id: `rule_${Date.now()}`,
      name,
      condition,
      threshold,
      timeWindow,
      alertSeverity: severity,
      enabled: true,
    }

    this.rules.set(rule.id, rule)

    logger.info({ type: 'alert_rule_created', name }, `Regla de alerta creada: ${name}`)

    return rule
  }

  /**
   * Evaluar reglas de alerta
   */
  private evaluateAlertRules(event: SecurityEvent): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      const windowStart = Date.now() - rule.timeWindow * 1000
      const relevantEvents = Array.from(this.events.values()).filter(
        (e) => e.timestamp.getTime() >= windowStart && e.eventType === rule.condition
      )

      if (relevantEvents.length >= rule.threshold) {
        this.createAlert(event.id, rule.condition, `Umbral de ${rule.threshold} excedido`, rule.alertSeverity)
      }
    }
  }

  /**
   * Crear alerta
   */
  createAlert(eventId: string, alertType: string, message: string, severity: string): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      eventId,
      alertType: alertType as any,
      severity: severity as any,
      message,
      triggered: new Date(),
      acknowledged: false,
    }

    this.alerts.set(alert.id, alert)

    logger.error({ type: 'security_alert_triggered', severity, message }, `Alerta de seguridad: ${message}`)

    return alert
  }

  /**
   * Reconocer alerta
   */
  acknowledgeAlert(alertId: string, actionTaken: string): SecurityAlert | null {
    const alert = this.alerts.get(alertId)
    if (!alert) return null

    alert.acknowledged = true
    alert.responseAction = actionTaken

    logger.info({ type: 'alert_acknowledged', alertId, action: actionTaken }, 'Alerta reconocida')

    return alert
  }

  /**
   * Obtener alertas no reconocidas
   */
  getUnacknowledgedAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.acknowledged)
  }

  /**
   * Obtener eventos por usuario
   */
  getUserEvents(userId: string, limit: number = 50): SecurityEvent[] {
    return Array.from(this.events.values())
      .filter((e) => e.userId === userId)
      .slice(-limit)
  }

  /**
   * Obtener eventos por IP
   */
  getEventsByIP(ipAddress: string): SecurityEvent[] {
    return Array.from(this.events.values()).filter((e) => e.ipAddress === ipAddress)
  }

  /**
   * Generar reporte de monitoreo
   */
  generateMonitoringReport(): string {
    const criticalAlerts = Array.from(this.alerts.values()).filter((a) => a.severity === 'critical')
    const unacknowledged = this.getUnacknowledgedAlerts()

    const report = `
=== REPORTE DE MONITOREO DE SEGURIDAD ===

EVENTOS REGISTRADOS:
- Total: ${this.events.size}
- Login Fallidos: ${this.metrics.failedLogins}
- Accesos a Datos: ${this.metrics.dataAccessAttempts}
- Violaciones de Política: ${this.metrics.policyViolations}

ALERTAS:
- Total: ${this.alerts.size}
- Alertas Críticas: ${criticalAlerts.length}
- No Reconocidas: ${unacknowledged.length}

REGLAS ACTIVAS: ${Array.from(this.rules.values()).filter((r) => r.enabled).length}

EVENTOS RECIENTES:
${Array.from(this.events.values())
  .slice(-5)
  .map((e) => `- ${e.eventType} (${e.severity}): ${e.resource}`)
  .join('\n')}
    `

    logger.info({ type: 'monitoring_report_generated' }, 'Reporte de monitoreo generado')
    return report
  }

  /**
   * Obtener métricas de seguridad
   */
  getSecurityMetrics(): {
    totalEvents: number
    failedLogins: number
    dataAccessAttempts: number
    policyViolations: number
    totalAlerts: number
    criticalAlerts: number
  } {
    return {
      totalEvents: this.events.size,
      failedLogins: this.metrics.failedLogins,
      dataAccessAttempts: this.metrics.dataAccessAttempts,
      policyViolations: this.metrics.policyViolations,
      totalAlerts: this.alerts.size,
      criticalAlerts: Array.from(this.alerts.values()).filter((a) => a.severity === 'critical').length,
    }
  }
}

let globalSecurityMonitoringManager: SecurityMonitoringManager | null = null

export function initializeSecurityMonitoringManager(): SecurityMonitoringManager {
  if (!globalSecurityMonitoringManager) {
    globalSecurityMonitoringManager = new SecurityMonitoringManager()
  }
  return globalSecurityMonitoringManager
}

export function getSecurityMonitoringManager(): SecurityMonitoringManager {
  if (!globalSecurityMonitoringManager) {
    return initializeSecurityMonitoringManager()
  }
  return globalSecurityMonitoringManager
}
