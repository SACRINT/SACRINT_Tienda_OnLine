/**
 * Security Audit Trail
 * Semana 42, Tarea 42.8: Security Audit Trail
 */

import { logger } from '@/lib/monitoring'
import crypto from 'crypto'

export interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  action: string
  resource: string
  resourceId: string
  status: 'success' | 'failure'
  changesBefore?: Record<string, any>
  changesAfter?: Record<string, any>
  ipAddress: string
  userAgent: string
}

export interface AuditQuery {
  startDate?: Date
  endDate?: Date
  userId?: string
  action?: string
  resource?: string
  status?: 'success' | 'failure'
}

export class SecurityAuditTrailManager {
  private logs: AuditLog[] = []
  private immutableLogHashes: Map<string, string> = new Map()

  constructor() {
    logger.debug({ type: 'audit_trail_init' }, 'Security Audit Trail Manager inicializado')
  }

  /**
   * Registrar acción en el trail
   */
  logAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    status: 'success' | 'failure',
    ipAddress: string,
    userAgent: string,
    changesBefore?: Record<string, any>,
    changesAfter?: Record<string, any>
  ): AuditLog {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      status,
      changesBefore,
      changesAfter,
      ipAddress,
      userAgent,
    }

    this.logs.push(log)

    // Calcular hash inmutable
    const hash = this.calculateHash(log)
    this.immutableLogHashes.set(log.id, hash)

    logger.info(
      { type: 'audit_action_logged', userId, action, resource, status },
      `Acción auditada: ${action} en ${resource}`
    )

    return log
  }

  /**
   * Calcular hash inmutable del log
   */
  private calculateHash(log: AuditLog): string {
    const data = JSON.stringify(log)
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Verificar integridad de log
   */
  verifyLogIntegrity(logId: string, log: AuditLog): boolean {
    const storedHash = this.immutableLogHashes.get(logId)
    if (!storedHash) return false

    const calculatedHash = this.calculateHash(log)
    return storedHash === calculatedHash
  }

  /**
   * Buscar logs
   */
  searchLogs(query: AuditQuery): AuditLog[] {
    return this.logs.filter((log) => {
      if (query.startDate && log.timestamp < query.startDate) return false
      if (query.endDate && log.timestamp > query.endDate) return false
      if (query.userId && log.userId !== query.userId) return false
      if (query.action && log.action !== query.action) return false
      if (query.resource && log.resource !== query.resource) return false
      if (query.status && log.status !== query.status) return false
      return true
    })
  }

  /**
   * Obtener logs de usuario
   */
  getUserAuditLogs(userId: string, limit: number = 100): AuditLog[] {
    return this.logs.filter((l) => l.userId === userId).slice(-limit)
  }

  /**
   * Obtener logs de recurso
   */
  getResourceAuditLogs(resource: string, resourceId: string, limit: number = 50): AuditLog[] {
    return this.logs
      .filter((l) => l.resource === resource && l.resourceId === resourceId)
      .slice(-limit)
  }

  /**
   * Obtener logs fallidos (intentos de acceso denegado)
   */
  getFailedActions(limit: number = 50): AuditLog[] {
    return this.logs.filter((l) => l.status === 'failure').slice(-limit)
  }

  /**
   * Generar reporte de auditoría
   */
  generateAuditReport(dateRange?: { startDate: Date; endDate: Date }): string {
    const logs = dateRange ? this.searchLogs(dateRange) : this.logs

    const actionCounts: Record<string, number> = {}
    const resourceCounts: Record<string, number> = {}
    const userCounts: Record<string, number> = {}
    let successCount = 0
    let failureCount = 0

    for (const log of logs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1

      if (log.status === 'success') successCount++
      else failureCount++
    }

    const report = `
=== REPORTE DE AUDITORÍA DE SEGURIDAD ===

PERÍODO: ${dateRange ? `${dateRange.startDate.toISOString()} - ${dateRange.endDate.toISOString()}` : 'Todo el tiempo'}

RESUMEN:
- Total de Acciones: ${logs.length}
- Acciones Exitosas: ${successCount}
- Acciones Fallidas: ${failureCount}
- Tasa de Éxito: ${logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(2) : 0}%

TOP 10 ACCIONES:
${Object.entries(actionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([action, count]) => `- ${action}: ${count}`)
  .join('\n')}

TOP 10 RECURSOS:
${Object.entries(resourceCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([resource, count]) => `- ${resource}: ${count}`)
  .join('\n')}

TOP 10 USUARIOS:
${Object.entries(userCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([user, count]) => `- ${user}: ${count} acciones`)
  .join('\n')}
    `

    logger.info({ type: 'audit_report_generated', logsReviewed: logs.length }, 'Reporte de auditoría generado')
    return report
  }

  /**
   * Detectar actividad sospechosa
   */
  detectSuspiciousActivity(): AuditLog[] {
    const suspiciousPatterns: AuditLog[] = []

    // Patrón 1: Múltiples fallos de login desde la misma IP
    const failedLogins = this.logs.filter((l) => l.action === 'login_failed')
    const ipFailures: Record<string, AuditLog[]> = {}

    for (const log of failedLogins) {
      if (!ipFailures[log.ipAddress]) {
        ipFailures[log.ipAddress] = []
      }
      ipFailures[log.ipAddress].push(log)
    }

    for (const logs of Object.values(ipFailures)) {
      if (logs.length >= 5) {
        suspiciousPatterns.push(...logs.slice(-5))
      }
    }

    // Patrón 2: Acceso a datos sensibles fuera de horario normal
    const sensitiveActions = this.logs.filter((l) => ['data_export', 'user_delete', 'permission_change'].includes(l.action))

    for (const log of sensitiveActions) {
      const hour = log.timestamp.getHours()
      if (hour < 6 || hour > 22) {
        suspiciousPatterns.push(log)
      }
    }

    return [...new Map(suspiciousPatterns.map((log) => [log.id, log])).values()]
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    totalLogs: number
    successfulActions: number
    failedActions: number
    uniqueUsers: number
    uniqueResources: number
  } {
    const userSet = new Set(this.logs.map((l) => l.userId))
    const resourceSet = new Set(this.logs.map((l) => l.resource))

    return {
      totalLogs: this.logs.length,
      successfulActions: this.logs.filter((l) => l.status === 'success').length,
      failedActions: this.logs.filter((l) => l.status === 'failure').length,
      uniqueUsers: userSet.size,
      uniqueResources: resourceSet.size,
    }
  }

  /**
   * Exportar logs para conformidad
   */
  exportForCompliance(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2)
    } else {
      // CSV format
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Status', 'IP']
      const rows = this.logs.map((l) => [l.id, l.timestamp.toISOString(), l.userId, l.action, l.resource, l.status, l.ipAddress])

      return [headers, ...rows].map((row) => row.join(',')).join('\n')
    }
  }
}

let globalSecurityAuditTrailManager: SecurityAuditTrailManager | null = null

export function initializeSecurityAuditTrailManager(): SecurityAuditTrailManager {
  if (!globalSecurityAuditTrailManager) {
    globalSecurityAuditTrailManager = new SecurityAuditTrailManager()
  }
  return globalSecurityAuditTrailManager
}

export function getSecurityAuditTrailManager(): SecurityAuditTrailManager {
  if (!globalSecurityAuditTrailManager) {
    return initializeSecurityAuditTrailManager()
  }
  return globalSecurityAuditTrailManager
}
