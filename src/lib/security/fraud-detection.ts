/**
 * Advanced Fraud Detection
 * Semana 42, Tarea 42.2: Advanced Fraud Detection
 */

import { logger } from '@/lib/monitoring'

export interface FraudRule {
  id: string
  name: string
  condition: 'velocity' | 'amount' | 'geolocation' | 'device' | 'behavior'
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'block' | 'review' | 'challenge' | 'alert'
  isActive: boolean
}

export interface FraudScore {
  transactionId: string
  userId: string
  score: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: Array<{ factor: string; weight: number; score: number }>
  timestamp: Date
  blocked: boolean
}

export interface FraudAlert {
  id: string
  userId: string
  transactionId: string
  reason: string
  severity: string
  timestamp: Date
  reviewed: boolean
  action: string
}

export class FraudDetectionManager {
  private rules: Map<string, FraudRule> = new Map()
  private scores: Map<string, FraudScore> = new Map()
  private alerts: Map<string, FraudAlert> = new Map()
  private userActivity: Map<string, any[]> = new Map()
  private blacklistedEmails: Set<string> = new Set()
  private blacklistedIPs: Set<string> = new Set()

  constructor() {
    logger.debug({ type: 'fraud_detection_init' }, 'Fraud Detection Manager inicializado')
    this.initializeDefaultRules()
  }

  /**
   * Inicializar reglas por defecto
   */
  private initializeDefaultRules(): void {
    this.createRule(
      'Múltiples transacciones rápidas',
      'velocity',
      5, // 5 transacciones en 5 minutos
      'high',
      'review'
    )

    this.createRule('Monto inusualmente alto', 'amount', 10000, 'high', 'review')

    this.createRule(
      'Cambio de ubicación imposible',
      'geolocation',
      5000, // 5000 km en 1 hora
      'critical',
      'block'
    )

    this.createRule('Nuevo dispositivo con monto alto', 'device', 5000, 'medium', 'challenge')
  }

  /**
   * Crear regla de fraude
   */
  createRule(
    name: string,
    condition: string,
    threshold: number,
    severity: string,
    action: string
  ): FraudRule {
    const rule: FraudRule = {
      id: `fraud_rule_${Date.now()}`,
      name,
      condition: condition as any,
      threshold,
      severity: severity as any,
      action: action as any,
      isActive: true,
    }

    this.rules.set(rule.id, rule)
    logger.info({ type: 'fraud_rule_created', name }, `Regla de fraude creada: ${name}`)

    return rule
  }

  /**
   * Evaluar transacción
   */
  evaluateTransaction(
    transactionId: string,
    userId: string,
    amount: number,
    email: string,
    ip: string,
    deviceId: string,
    location: { lat: number; lon: number }
  ): FraudScore {
    const factors: Array<{ factor: string; weight: number; score: number }> = []
    let totalScore = 0

    // Factor: Velocidad de transacciones
    const recentActivity = this.userActivity.get(userId) || []
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const recentTransactions = recentActivity.filter((a) => a.timestamp > fiveMinutesAgo)

    if (recentTransactions.length >= 5) {
      const velocityScore = Math.min(100, recentTransactions.length * 15)
      factors.push({ factor: 'velocity', weight: 0.25, score: velocityScore })
      totalScore += velocityScore * 0.25
    }

    // Factor: Monto
    if (amount > 5000) {
      const amountScore = Math.min(100, (amount / 10000) * 100)
      factors.push({ factor: 'amount', weight: 0.2, score: amountScore })
      totalScore += amountScore * 0.2
    }

    // Factor: Email en blacklist
    if (this.blacklistedEmails.has(email)) {
      factors.push({ factor: 'blacklisted_email', weight: 1.0, score: 100 })
      totalScore = 100
    }

    // Factor: IP en blacklist
    if (this.blacklistedIPs.has(ip)) {
      factors.push({ factor: 'blacklisted_ip', weight: 1.0, score: 100 })
      totalScore = 100
    }

    // Factor: Dispositivo nuevo
    const userDevices = recentActivity.map((a) => a.deviceId)
    if (!userDevices.includes(deviceId)) {
      const deviceScore = amount > 1000 ? 60 : 30
      factors.push({ factor: 'new_device', weight: 0.15, score: deviceScore })
      totalScore += deviceScore * 0.15
    }

    // Registrar actividad
    if (!this.userActivity.has(userId)) {
      this.userActivity.set(userId, [])
    }
    this.userActivity.get(userId)!.push({
      transactionId,
      timestamp: Date.now(),
      amount,
      ip,
      deviceId,
      location,
    })

    // Determinar nivel de riesgo
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    if (totalScore < 20) riskLevel = 'low'
    else if (totalScore < 50) riskLevel = 'medium'
    else if (totalScore < 80) riskLevel = 'high'
    else riskLevel = 'critical'

    const score: FraudScore = {
      transactionId,
      userId,
      score: Math.round(totalScore),
      riskLevel,
      factors,
      timestamp: new Date(),
      blocked: riskLevel === 'critical',
    }

    this.scores.set(transactionId, score)

    if (score.blocked) {
      this.createAlert(userId, transactionId, `Fraude detectado: Score ${score.score}`, 'critical', 'blocked')
    } else if (riskLevel === 'high') {
      this.createAlert(userId, transactionId, `Transacción sospechosa: Score ${score.score}`, 'high', 'review')
    }

    logger.info(
      { type: 'transaction_evaluated', transactionId, riskLevel, score: score.score },
      `Transacción evaluada: ${riskLevel}`
    )

    return score
  }

  /**
   * Crear alerta de fraude
   */
  createAlert(userId: string, transactionId: string, reason: string, severity: string, action: string): FraudAlert {
    const alert: FraudAlert = {
      id: `fraud_alert_${Date.now()}`,
      userId,
      transactionId,
      reason,
      severity,
      timestamp: new Date(),
      reviewed: false,
      action,
    }

    this.alerts.set(alert.id, alert)

    logger.warn(
      { type: 'fraud_alert_created', userId, transactionId, severity },
      `Alerta de fraude: ${reason}`
    )

    return alert
  }

  /**
   * Revisar alerta
   */
  reviewAlert(alertId: string, action: 'approved' | 'blocked'): FraudAlert | null {
    const alert = this.alerts.get(alertId)
    if (!alert) return null

    alert.reviewed = true
    alert.action = action

    logger.info({ type: 'fraud_alert_reviewed', alertId, action }, `Alerta revisada: ${action}`)

    return alert
  }

  /**
   * Agregar email a blacklist
   */
  blacklistEmail(email: string): void {
    this.blacklistedEmails.add(email)
    logger.warn({ type: 'email_blacklisted', email }, `Email agregado a blacklist: ${email}`)
  }

  /**
   * Agregar IP a blacklist
   */
  blacklistIP(ip: string): void {
    this.blacklistedIPs.add(ip)
    logger.warn({ type: 'ip_blacklisted', ip }, `IP agregada a blacklist: ${ip}`)
  }

  /**
   * Remover de blacklist
   */
  removeFromBlacklist(type: 'email' | 'ip', value: string): void {
    if (type === 'email') {
      this.blacklistedEmails.delete(value)
    } else {
      this.blacklistedIPs.delete(value)
    }

    logger.info({ type: 'blacklist_removed', value_type: type }, `Removido de blacklist: ${value}`)
  }

  /**
   * Obtener alertas pendientes
   */
  getPendingAlerts(): FraudAlert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.reviewed)
  }

  /**
   * Obtener alertas por usuario
   */
  getUserAlerts(userId: string, limit: number = 50): FraudAlert[] {
    return Array.from(this.alerts.values())
      .filter((a) => a.userId === userId)
      .slice(-limit)
  }

  /**
   * Obtener score de transacción
   */
  getTransactionScore(transactionId: string): FraudScore | null {
    return this.scores.get(transactionId) || null
  }

  /**
   * Generar reporte de fraude
   */
  generateFraudReport(): string {
    const totalAlerts = this.alerts.size
    const pendingAlerts = Array.from(this.alerts.values()).filter((a) => !a.reviewed).length
    const blockedTransactions = Array.from(this.scores.values()).filter((s) => s.blocked).length

    const alertsBySeverity: Record<string, number> = {}
    for (const alert of this.alerts.values()) {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1
    }

    const report = `
=== REPORTE DE DETECCIÓN DE FRAUDE ===

ESTADÍSTICAS:
- Total de Alertas: ${totalAlerts}
- Alertas Pendientes: ${pendingAlerts}
- Transacciones Bloqueadas: ${blockedTransactions}

ALERTAS POR SEVERIDAD:
${Object.entries(alertsBySeverity)
  .map(([severity, count]) => `- ${severity}: ${count}`)
  .join('\n')}

LISTAS NEGRAS:
- Emails Bloqueados: ${this.blacklistedEmails.size}
- IPs Bloqueadas: ${this.blacklistedIPs.size}

REGLAS ACTIVAS: ${Array.from(this.rules.values()).filter((r) => r.isActive).length}
    `

    logger.info({ type: 'fraud_report_generated' }, 'Reporte de fraude generado')
    return report
  }

  /**
   * Obtener estadísticas de fraude
   */
  getStatistics(): {
    totalAlerts: number
    pendingAlerts: number
    blockedTransactions: number
    criticalAlerts: number
    averageFraudScore: number
  } {
    const alertsArray = Array.from(this.alerts.values())
    const scoresArray = Array.from(this.scores.values())

    const avgScore = scoresArray.length > 0 ? scoresArray.reduce((sum, s) => sum + s.score, 0) / scoresArray.length : 0

    return {
      totalAlerts: alertsArray.length,
      pendingAlerts: alertsArray.filter((a) => !a.reviewed).length,
      blockedTransactions: scoresArray.filter((s) => s.blocked).length,
      criticalAlerts: alertsArray.filter((a) => a.severity === 'critical').length,
      averageFraudScore: Math.round(avgScore),
    }
  }
}

let globalFraudDetectionManager: FraudDetectionManager | null = null

export function initializeFraudDetectionManager(): FraudDetectionManager {
  if (!globalFraudDetectionManager) {
    globalFraudDetectionManager = new FraudDetectionManager()
  }
  return globalFraudDetectionManager
}

export function getFraudDetectionManager(): FraudDetectionManager {
  if (!globalFraudDetectionManager) {
    return initializeFraudDetectionManager()
  }
  return globalFraudDetectionManager
}
