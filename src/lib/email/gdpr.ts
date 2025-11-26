/**
 * GDPR Compliance y Data Privacy
 * Semana 32, Tarea 32.11: Cumplimiento de GDPR y privacidad de datos
 */

import { logger } from '@/lib/monitoring'

export interface ConsentRecord {
  id: string
  email: string
  consentType: 'marketing' | 'newsletter' | 'data_processing' | 'third_party'
  consented: boolean
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  expiresAt?: Date
}

export interface DataSubjectRequest {
  id: string
  email: string
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection'
  status: 'pending' | 'processing' | 'completed' | 'denied'
  createdAt: Date
  completedAt?: Date
  reason?: string
}

export class GDPRComplianceManager {
  private consents: Map<string, ConsentRecord> = new Map()
  private requests: Map<string, DataSubjectRequest> = new Map()
  private retentionDays = 1095 // 3 años por defecto

  constructor() {
    logger.debug({ type: 'gdpr_manager_init' }, 'GDPR Compliance Manager inicializado')
  }

  recordConsent(email: string, consentType: string, data?: { ipAddress?: string; userAgent?: string }): ConsentRecord {
    const consent: ConsentRecord = {
      id: `consent-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email,
      consentType: consentType as ConsentRecord['consentType'],
      consented: true,
      timestamp: new Date(),
      ipAddress: data?.ipAddress,
      userAgent: data?.userAgent,
      expiresAt: new Date(Date.now() + this.retentionDays * 24 * 60 * 60 * 1000),
    }

    this.consents.set(consent.id, consent)

    logger.info(
      { type: 'consent_recorded', email, consentType },
      `Consentimiento registrado: ${email}`,
    )

    return consent
  }

  withdrawConsent(email: string, consentType: string): ConsentRecord | null {
    const consent = Array.from(this.consents.values()).find(
      (c) => c.email === email && c.consentType === (consentType as any),
    )

    if (consent) {
      consent.consented = false
      consent.timestamp = new Date()

      logger.info(
        { type: 'consent_withdrawn', email, consentType },
        `Consentimiento retirado: ${email}`,
      )

      return consent
    }

    return null
  }

  hasConsent(email: string, consentType: string): boolean {
    const consent = Array.from(this.consents.values()).find(
      (c) => c.email === email && c.consentType === (consentType as any),
    )

    return consent ? consent.consented : false
  }

  submitDataRequest(email: string, requestType: 'access' | 'erasure' | 'portability'): DataSubjectRequest {
    const request: DataSubjectRequest = {
      id: `dsr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email,
      requestType,
      status: 'pending',
      createdAt: new Date(),
    }

    this.requests.set(request.id, request)

    logger.info(
      { type: 'data_request_submitted', email, requestType },
      `Solicitud de datos presentada: ${requestType}`,
    )

    return request
  }

  processDataRequest(requestId: string): DataSubjectRequest | null {
    const request = this.requests.get(requestId)
    if (!request) return null

    request.status = 'processing'
    request.completedAt = new Date()

    logger.info(
      { type: 'data_request_processed', requestId },
      `Solicitud de datos procesada: ${request.requestType}`,
    )

    return request
  }

  erasePersonalData(email: string): { erased: number; status: string } {
    let erased = 0

    // Eliminar consentimientos
    const consentsToDelete: string[] = []
    for (const [id, consent] of this.consents.entries()) {
      if (consent.email === email) {
        consentsToDelete.push(id)
        erased++
      }
    }
    for (const id of consentsToDelete) {
      this.consents.delete(id)
    }

    logger.warn(
      { type: 'personal_data_erased', email, itemsErased: erased },
      `Datos personales eliminados para: ${email}`,
    )

    return {
      erased,
      status: 'completed',
    }
  }

  getConsentHistory(email: string): ConsentRecord[] {
    return Array.from(this.consents.values()).filter((c) => c.email === email).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getDataRequestHistory(email: string): DataSubjectRequest[] {
    return Array.from(this.requests.values())
      .filter((r) => r.email === email)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  validateGDPRCompliance(): {
    compliant: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // Verificar si hay políticas de privacidad
    if (!this.hasPrivacyPolicy()) {
      issues.push('Privacy policy not documented')
    }

    // Verificar retención de datos
    if (this.retentionDays > 1095) {
      issues.push('Data retention exceeds 3 years')
    }

    // Verificar consentimientos
    const totalConsents = this.consents.size
    const activeConsents = Array.from(this.consents.values()).filter((c) => c.consented).length

    if (totalConsents === 0) {
      issues.push('No consent records found')
    }

    logger.debug(
      { type: 'gdpr_validation', compliant: issues.length === 0, issues },
      `Validación GDPR: ${issues.length} problemas encontrados`,
    )

    return {
      compliant: issues.length === 0,
      issues,
    }
  }

  generateConsentForm(domain: string): string {
    const form = `
<form id="gdpr-consent-form">
  <h2>Data Privacy & Consent</h2>

  <label>
    <input type="checkbox" name="marketing" value="true" required>
    I consent to receive marketing emails
  </label>

  <label>
    <input type="checkbox" name="newsletter" value="true">
    I consent to receive newsletters
  </label>

  <label>
    <input type="checkbox" name="data_processing" value="true" required>
    I consent to data processing in accordance with our privacy policy
  </label>

  <p>
    <small>
      Your data will be processed according to our <a href="/privacy">Privacy Policy</a>.
      You can withdraw consent at any time.
    </small>
  </p>

  <button type="submit">Accept</button>
  <button type="button" onclick="location.href='/privacy'">Learn More</button>
</form>
    `

    return form
  }

  private hasPrivacyPolicy(): boolean {
    // Verificación simulada
    return true
  }

  generateGDPRReport(): string {
    const compliance = this.validateGDPRCompliance()
    const totalConsents = this.consents.size
    const totalRequests = this.requests.size

    let report = 'GDPR Compliance Report\n'
    report += '=====================\n\n'

    report += `Status: ${compliance.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n\n`

    report += `Consent Management:\n`
    report += `  Total Records: ${totalConsents}\n`
    report += `  Active Consents: ${Array.from(this.consents.values()).filter((c) => c.consented).length}\n\n`

    report += `Data Subject Requests:\n`
    report += `  Total: ${totalRequests}\n`
    report += `  Pending: ${Array.from(this.requests.values()).filter((r) => r.status === 'pending').length}\n`
    report += `  Completed: ${Array.from(this.requests.values()).filter((r) => r.status === 'completed').length}\n\n`

    if (compliance.issues.length > 0) {
      report += `Issues:\n`
      for (const issue of compliance.issues) {
        report += `  - ${issue}\n`
      }
    }

    return report
  }
}

let globalManager: GDPRComplianceManager | null = null

export function initializeGDPRComplianceManager(): GDPRComplianceManager {
  if (!globalManager) {
    globalManager = new GDPRComplianceManager()
  }
  return globalManager
}

export function getGDPRComplianceManager(): GDPRComplianceManager {
  if (!globalManager) {
    return initializeGDPRComplianceManager()
  }
  return globalManager
}
