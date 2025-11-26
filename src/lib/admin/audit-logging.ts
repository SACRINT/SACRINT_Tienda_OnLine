/**
 * Audit Logging & Compliance
 * Semana 40, Tarea 40.4: Audit Logging & Compliance
 */

import { logger } from '@/lib/monitoring'

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout'

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  resource: string
  changes?: { before: any; after: any }
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  status: 'success' | 'failure'
}

export interface ComplianceReport {
  id: string
  period: { start: Date; end: Date }
  totalActions: number
  actionBreakdown: Record<AuditAction, number>
  riskFactors: string[]
  generatedAt: Date
}

export class AuditLoggingManager {
  private logs: AuditLog[] = []
  private complianceSettings: { retentionDays: number; sensitiveActions: AuditAction[] } = {
    retentionDays: 365,
    sensitiveActions: ['delete', 'export', 'update'],
  }

  constructor() {
    logger.debug({ type: 'audit_logging_init' }, 'Audit Logging Manager inicializado')
    this.startAutomaticCleanup()
  }

  /**
   * Registrar acción
   */
  logAction(
    userId: string,
    action: AuditAction,
    resource: string,
    details?: { ipAddress?: string; userAgent?: string; changes?: any },
  ): AuditLog {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random()}`,
      userId,
      action,
      resource,
      changes: details?.changes,
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      timestamp: new Date(),
      status: 'success',
    }

    this.logs.push(auditLog)

    logger.info(
      { type: 'audit_logged', userId, action, resource },
      `Acción auditada: ${userId} - ${action} - ${resource}`,
    )

    return auditLog
  }

  /**
   * Obtener logs
   */
  getLogs(
    filters?: {
      userId?: string
      action?: AuditAction
      resource?: string
      startDate?: Date
      endDate?: Date
    },
    limit: number = 100,
  ): AuditLog[] {
    let results = [...this.logs]

    if (filters?.userId) results = results.filter((l) => l.userId === filters.userId)
    if (filters?.action) results = results.filter((l) => l.action === filters.action)
    if (filters?.resource) results = results.filter((l) => l.resource === filters.resource)
    if (filters?.startDate) results = results.filter((l) => l.timestamp >= filters.startDate!)
    if (filters?.endDate) results = results.filter((l) => l.timestamp <= filters.endDate!)

    return results.slice(-limit)
  }

  /**
   * Generar reporte de compliance
   */
  generateComplianceReport(startDate: Date, endDate: Date): ComplianceReport {
    const periodLogs = this.logs.filter((l) => l.timestamp >= startDate && l.timestamp <= endDate)

    const actionBreakdown: Record<AuditAction, number> = {
      create: 0,
      update: 0,
      delete: 0,
      view: 0,
      export: 0,
      login: 0,
      logout: 0,
    }

    const riskFactors: string[] = []

    for (const log of periodLogs) {
      actionBreakdown[log.action]++

      if (log.status === 'failure') {
        riskFactors.push(`Failed ${log.action} on ${log.resource}`)
      }

      if (this.complianceSettings.sensitiveActions.includes(log.action)) {
        if (actionBreakdown[log.action] > 100) {
          riskFactors.push(`High frequency of ${log.action} actions`)
        }
      }
    }

    return {
      id: `report_${Date.now()}`,
      period: { start: startDate, end: endDate },
      totalActions: periodLogs.length,
      actionBreakdown,
      riskFactors: [...new Set(riskFactors)],
      generatedAt: new Date(),
    }
  }

  /**
   * Iniciar limpieza automática
   */
  private startAutomaticCleanup(): void {
    setInterval(() => {
      const cutoffDate = new Date(Date.now() - this.complianceSettings.retentionDays * 24 * 60 * 60 * 1000)
      const beforeCount = this.logs.length

      this.logs = this.logs.filter((l) => l.timestamp >= cutoffDate)

      const removed = beforeCount - this.logs.length
      if (removed > 0) {
        logger.debug({ type: 'audit_cleanup', removed }, `${removed} logs antiguos eliminados`)
      }
    }, 24 * 60 * 60 * 1000) // Diariamente
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalLogs: number; byAction: Record<AuditAction, number>; successRate: number } {
    const byAction: Record<AuditAction, number> = {
      create: 0,
      update: 0,
      delete: 0,
      view: 0,
      export: 0,
      login: 0,
      logout: 0,
    }

    let successful = 0

    for (const log of this.logs) {
      byAction[log.action]++
      if (log.status === 'success') successful++
    }

    return {
      totalLogs: this.logs.length,
      byAction,
      successRate: this.logs.length > 0 ? successful / this.logs.length : 0,
    }
  }
}

let globalAuditLoggingManager: AuditLoggingManager | null = null

export function initializeAuditLoggingManager(): AuditLoggingManager {
  if (!globalAuditLoggingManager) {
    globalAuditLoggingManager = new AuditLoggingManager()
  }
  return globalAuditLoggingManager
}

export function getAuditLoggingManager(): AuditLoggingManager {
  if (!globalAuditLoggingManager) {
    return initializeAuditLoggingManager()
  }
  return globalAuditLoggingManager
}
