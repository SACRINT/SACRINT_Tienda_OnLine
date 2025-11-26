/**
 * GDPR Compliance Tools
 * Semana 42, Tarea 42.4: GDPR Compliance Tools
 */

import { logger } from '@/lib/monitoring'

export interface DataProcessingRecord {
  id: string
  userId: string
  dataType: string
  processingPurpose: 'marketing' | 'support' | 'billing' | 'analytics' | 'service'
  consentGiven: boolean
  consentDate: Date
  retentionDays: number
  expiresAt: Date
}

export interface ConsentRecord {
  id: string
  userId: string
  consentType: 'marketing' | 'analytics' | 'third_party' | 'cookies'
  given: boolean
  timestamp: Date
  ipAddress: string
  userAgent: string
}

export interface DataSubjectRequest {
  id: string
  userId: string
  requestType: 'access' | 'rectification' | 'deletion' | 'portability' | 'objection'
  status: 'pending' | 'processing' | 'completed' | 'denied'
  createdAt: Date
  completedAt?: Date
  responseData?: any
}

export interface DataRetentionPolicy {
  dataType: string
  retentionDays: number
  purpose: string
  deleteAfterExpiry: boolean
}

export class GDPRComplianceManager {
  private processingRecords: Map<string, DataProcessingRecord> = new Map()
  private consentRecords: Map<string, ConsentRecord> = new Map()
  private dataSubjectRequests: Map<string, DataSubjectRequest> = new Map()
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map()
  private dataInventory: Map<string, { type: string; quantity: number; sensitivity: 'low' | 'medium' | 'high' }> = new Map()

  constructor() {
    logger.debug({ type: 'gdpr_compliance_init' }, 'GDPR Compliance Manager inicializado')
    this.initializeDefaultPolicies()
  }

  /**
   * Inicializar políticas por defecto
   */
  private initializeDefaultPolicies(): void {
    this.setRetentionPolicy('personal_data', 36 * 30, 'Customer profile', true)
    this.setRetentionPolicy('transaction_data', 7 * 365, 'Payment records', true)
    this.setRetentionPolicy('marketing_data', 12 * 30, 'Marketing preferences', true)
    this.setRetentionPolicy('analytics_data', 12 * 30, 'User behavior analytics', true)
    this.setRetentionPolicy('support_data', 3 * 365, 'Support tickets and chats', true)
  }

  /**
   * Registrar procesamiento de datos
   */
  recordDataProcessing(
    userId: string,
    dataType: string,
    processingPurpose: string,
    consentGiven: boolean
  ): DataProcessingRecord {
    const policy = this.retentionPolicies.get(dataType)
    const retentionDays = policy?.retentionDays || 365

    const record: DataProcessingRecord = {
      id: `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      dataType,
      processingPurpose: processingPurpose as any,
      consentGiven,
      consentDate: new Date(),
      retentionDays,
      expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
    }

    this.processingRecords.set(record.id, record)

    logger.info(
      { type: 'data_processing_recorded', userId, dataType, consentGiven },
      `Procesamiento de datos registrado: ${dataType}`
    )

    return record
  }

  /**
   * Registrar consentimiento
   */
  recordConsent(
    userId: string,
    consentType: string,
    given: boolean,
    ipAddress: string,
    userAgent: string
  ): ConsentRecord {
    const record: ConsentRecord = {
      id: `consent_${Date.now()}`,
      userId,
      consentType: consentType as any,
      given,
      timestamp: new Date(),
      ipAddress,
      userAgent,
    }

    this.consentRecords.set(record.id, record)

    logger.info(
      { type: 'consent_recorded', userId, consentType, given },
      `Consentimiento registrado: ${consentType}`
    )

    return record
  }

  /**
   * Crear solicitud de derechos GDPR
   */
  createDataSubjectRequest(
    userId: string,
    requestType: string
  ): DataSubjectRequest {
    const request: DataSubjectRequest = {
      id: `dsr_${Date.now()}`,
      userId,
      requestType: requestType as any,
      status: 'pending',
      createdAt: new Date(),
    }

    this.dataSubjectRequests.set(request.id, request)

    logger.info(
      { type: 'data_subject_request_created', userId, requestType },
      `Solicitud de derechos creada: ${requestType}`
    )

    return request
  }

  /**
   * Acceso a datos personales
   */
  grantDataAccess(requestId: string): DataSubjectRequest | null {
    const request = this.dataSubjectRequests.get(requestId)
    if (!request || request.requestType !== 'access') {
      return null
    }

    const userProcessing = Array.from(this.processingRecords.values()).filter((p) => p.userId === request.userId)

    request.status = 'completed'
    request.completedAt = new Date()
    request.responseData = {
      processingRecords: userProcessing,
      consentRecords: Array.from(this.consentRecords.values()).filter((c) => c.userId === request.userId),
    }

    logger.info({ type: 'data_access_granted', requestId }, 'Acceso a datos concedido')

    return request
  }

  /**
   * Derecho al olvido (eliminación de datos)
   */
  rightToBeForotten(userId: string): boolean {
    // Marcar registros para eliminación
    const recordsToDelete = Array.from(this.processingRecords.values()).filter((p) => p.userId === userId)

    for (const record of recordsToDelete) {
      this.processingRecords.delete(record.id)
    }

    const consentsToDelete = Array.from(this.consentRecords.values()).filter((c) => c.userId === userId)
    for (const consent of consentsToDelete) {
      this.consentRecords.delete(consent.id)
    }

    logger.warn({ type: 'right_to_be_forgotten_executed', userId }, 'Derecho al olvido ejecutado')

    return true
  }

  /**
   * Portabilidad de datos
   */
  getDataPortability(userId: string): any {
    const processing = Array.from(this.processingRecords.values()).filter((p) => p.userId === userId)
    const consents = Array.from(this.consentRecords.values()).filter((c) => c.userId === userId)

    const portableData = {
      userId,
      exportDate: new Date(),
      processingRecords: processing,
      consentRecords: consents,
      format: 'JSON',
    }

    logger.info({ type: 'data_portability_requested', userId }, 'Portabilidad de datos exportada')

    return portableData
  }

  /**
   * Establecer política de retención
   */
  setRetentionPolicy(dataType: string, retentionDays: number, purpose: string, deleteAfterExpiry: boolean): void {
    this.retentionPolicies.set(dataType, {
      dataType,
      retentionDays,
      purpose,
      deleteAfterExpiry,
    })

    logger.info(
      { type: 'retention_policy_set', dataType, retentionDays },
      `Política de retención establecida para ${dataType}`
    )
  }

  /**
   * Registrar datos sensibles
   */
  recordSensitiveData(dataType: string, quantity: number, sensitivity: 'low' | 'medium' | 'high'): void {
    this.dataInventory.set(dataType, {
      type: dataType,
      quantity,
      sensitivity,
    })

    logger.info(
      { type: 'sensitive_data_recorded', dataType, sensitivity },
      `Datos sensibles registrados: ${dataType}`
    )
  }

  /**
   * Obtener solicitudes pendientes
   */
  getPendingRequests(): DataSubjectRequest[] {
    return Array.from(this.dataSubjectRequests.values()).filter((r) => r.status === 'pending')
  }

  /**
   * Obtener solicitudes de usuario
   */
  getUserRequests(userId: string): DataSubjectRequest[] {
    return Array.from(this.dataSubjectRequests.values()).filter((r) => r.userId === userId)
  }

  /**
   * Obtener consentimientos de usuario
   */
  getUserConsents(userId: string): ConsentRecord[] {
    return Array.from(this.consentRecords.values()).filter((c) => c.userId === userId)
  }

  /**
   * Generar reporte de cumplimiento GDPR
   */
  generateGDPRReport(): string {
    const totalProcessing = this.processingRecords.size
    const totalConsents = this.consentRecords.size
    const pendingRequests = this.getPendingRequests()

    const consentsByType: Record<string, number> = {}
    for (const consent of this.consentRecords.values()) {
      consentsByType[consent.consentType] = (consentsByType[consent.consentType] || 0) + 1
    }

    const requestsByType: Record<string, number> = {}
    for (const request of this.dataSubjectRequests.values()) {
      requestsByType[request.requestType] = (requestsByType[request.requestType] || 0) + 1
    }

    const report = `
=== REPORTE DE CUMPLIMIENTO GDPR ===

REGISTROS DE PROCESAMIENTO:
- Total: ${totalProcessing}
- Con Consentimiento: ${Array.from(this.processingRecords.values()).filter((p) => p.consentGiven).length}
- Sin Consentimiento: ${Array.from(this.processingRecords.values()).filter((p) => !p.consentGiven).length}

CONSENTIMIENTOS:
- Total: ${totalConsents}
${Object.entries(consentsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

SOLICITUDES DE DERECHOS:
- Total: ${this.dataSubjectRequests.size}
- Pendientes: ${pendingRequests.length}
${Object.entries(requestsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

POLÍTICAS DE RETENCIÓN:
${Array.from(this.retentionPolicies.values())
  .map((p) => `- ${p.dataType}: ${p.retentionDays} días`)
  .join('\n')}

INVENTARIO DE DATOS SENSIBLES:
${Array.from(this.dataInventory.values())
  .map((d) => `- ${d.type}: ${d.quantity} registros (${d.sensitivity})`)
  .join('\n')}
    `

    logger.info({ type: 'gdpr_report_generated' }, 'Reporte GDPR generado')
    return report
  }

  /**
   * Obtener política de retención
   */
  getRetentionPolicy(dataType: string): DataRetentionPolicy | null {
    return this.retentionPolicies.get(dataType) || null
  }

  /**
   * Limpiar datos expirados
   */
  purgeExpiredData(): number {
    const now = new Date()
    let purgedCount = 0

    // Purgar registros de procesamiento expirados
    for (const [key, record] of this.processingRecords) {
      if (record.expiresAt <= now) {
        this.processingRecords.delete(key)
        purgedCount++
      }
    }

    logger.info({ type: 'expired_data_purged', count: purgedCount }, `${purgedCount} registros expirados eliminados`)

    return purgedCount
  }
}

let globalGDPRComplianceManager: GDPRComplianceManager | null = null

export function initializeGDPRComplianceManager(): GDPRComplianceManager {
  if (!globalGDPRComplianceManager) {
    globalGDPRComplianceManager = new GDPRComplianceManager()
  }
  return globalGDPRComplianceManager
}

export function getGDPRComplianceManager(): GDPRComplianceManager {
  if (!globalGDPRComplianceManager) {
    return initializeGDPRComplianceManager()
  }
  return globalGDPRComplianceManager
}
