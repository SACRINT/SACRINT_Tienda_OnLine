/**
 * Refund Management & Dispute Resolution
 * Semana 34, Tarea 34.6: Gestión de reembolsos y resolución de disputas
 */

import { logger } from '@/lib/monitoring'

export type RefundStatus = 'requested' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed'
export type RefundReason = 'customer_request' | 'defective_product' | 'not_as_described' | 'duplicate_charge' | 'unauthorized' | 'chargeback' | 'other'
export type DisputeStatus = 'opened' | 'under_review' | 'resolved' | 'escalated' | 'closed'

export interface RefundRequest {
  id: string
  orderId: string
  customerId: string
  transactionId: string
  amount: number
  currency: string
  reason: RefundReason
  description: string
  evidence?: string[] // URLs to evidence
  status: RefundStatus
  requestedDate: Date
  approvedDate?: Date
  approvedBy?: string
  completedDate?: Date
  refundTransactionId?: string
  metadata: Record<string, any>
}

export interface Dispute {
  id: string
  refundRequestId: string
  orderId: string
  customerId: string
  gateway: string // stripe, mercadopago, etc
  gatewayDisputeId: string
  amount: number
  currency: string
  reason: string
  evidenceDeadline: Date
  status: DisputeStatus
  openedDate: Date
  submittedEvidenceDate?: Date
  resolvedDate?: Date
  outcome?: 'won' | 'lost' | 'settled'
  notes: string[]
  attachments: string[]
}

export interface RefundPolicy {
  tenantId: string
  refundWindow: number // días
  restockingFee: number // porcentaje
  allowFullRefund: boolean
  automaticApproval: boolean
  approvalThreshold: number // cantidad máxima para aprobación automática
  requiresEvidence: boolean
}

export class RefundManager {
  private refundRequests: Map<string, RefundRequest> = new Map()
  private disputes: Map<string, Dispute> = new Map()
  private refundPolicies: Map<string, RefundPolicy> = new Map()

  constructor() {
    logger.debug({ type: 'refund_manager_init' }, 'Refund Manager inicializado')
  }

  setRefundPolicy(tenantId: string, policy: RefundPolicy): void {
    this.refundPolicies.set(tenantId, policy)
    logger.info({ type: 'refund_policy_set', tenantId }, `Política de reembolso actualizada`)
  }

  requestRefund(
    orderId: string,
    customerId: string,
    transactionId: string,
    amount: number,
    currency: string,
    reason: RefundReason,
    description: string,
    tenantId: string,
  ): RefundRequest {
    const policy = this.refundPolicies.get(tenantId)

    const refund: RefundRequest = {
      id: `refund_${Date.now()}_${Math.random()}`,
      orderId,
      customerId,
      transactionId,
      amount,
      currency,
      reason,
      description,
      status: 'requested',
      requestedDate: new Date(),
      metadata: {},
    }

    // Auto-approve based on policy
    if (policy) {
      if (policy.automaticApproval && amount <= policy.approvalThreshold) {
        refund.status = 'approved'
        refund.approvedDate = new Date()
        logger.info({ type: 'refund_auto_approved', refundId: refund.id }, 'Reembolso aprobado automáticamente')
      }
    }

    this.refundRequests.set(refund.id, refund)

    logger.info(
      { type: 'refund_requested', refundId: refund.id, orderId, reason },
      `Reembolso solicitado: ${amount} ${currency}`,
    )

    return refund
  }

  approveRefund(refundId: string, approvedBy: string): RefundRequest | null {
    const refund = this.refundRequests.get(refundId)
    if (!refund) return null

    refund.status = 'approved'
    refund.approvedDate = new Date()
    refund.approvedBy = approvedBy

    logger.info({ type: 'refund_approved', refundId, approvedBy }, `Reembolso aprobado`)

    return refund
  }

  rejectRefund(refundId: string, reason: string): RefundRequest | null {
    const refund = this.refundRequests.get(refundId)
    if (!refund) return null

    refund.status = 'rejected'
    refund.metadata['rejectionReason'] = reason

    logger.warn({ type: 'refund_rejected', refundId, reason }, `Reembolso rechazado: ${reason}`)

    return refund
  }

  processRefund(refundId: string, refundTransactionId: string): RefundRequest | null {
    const refund = this.refundRequests.get(refundId)
    if (!refund) return null

    if (refund.status !== 'approved') {
      logger.error({ type: 'refund_not_approved', refundId }, 'No se puede procesar reembolso no aprobado')
      return null
    }

    refund.status = 'processing'
    refund.refundTransactionId = refundTransactionId

    // Simular completación
    setTimeout(() => {
      refund.status = 'completed'
      refund.completedDate = new Date()
    }, 2000)

    logger.info({ type: 'refund_processing', refundId }, `Reembolso en procesamiento`)

    return refund
  }

  openDispute(
    refundRequestId: string,
    orderId: string,
    customerId: string,
    gateway: string,
    gatewayDisputeId: string,
    amount: number,
    currency: string,
    reason: string,
  ): Dispute {
    const evidenceDeadline = new Date()
    evidenceDeadline.setDate(evidenceDeadline.getDate() + 7) // 7 días para enviar evidencia

    const dispute: Dispute = {
      id: `dispute_${Date.now()}_${Math.random()}`,
      refundRequestId,
      orderId,
      customerId,
      gateway,
      gatewayDisputeId,
      amount,
      currency,
      reason,
      evidenceDeadline,
      status: 'opened',
      openedDate: new Date(),
      notes: [],
      attachments: [],
    }

    this.disputes.set(dispute.id, dispute)

    logger.warn(
      { type: 'dispute_opened', disputeId: dispute.id, gateway, amount },
      `Disputa abierta en ${gateway}: ${amount} ${currency}`,
    )

    return dispute
  }

  submitDefenseEvidence(disputeId: string, evidenceUrls: string[]): Dispute | null {
    const dispute = this.disputes.get(disputeId)
    if (!dispute) return null

    dispute.attachments.push(...evidenceUrls)
    dispute.submittedEvidenceDate = new Date()

    logger.info({ type: 'defense_evidence_submitted', disputeId, count: evidenceUrls.length }, 'Evidencia de defensa enviada')

    return dispute
  }

  addDisputeNote(disputeId: string, note: string): Dispute | null {
    const dispute = this.disputes.get(disputeId)
    if (!dispute) return null

    dispute.notes.push(`[${new Date().toISOString()}] ${note}`)

    return dispute
  }

  resolveDispute(
    disputeId: string,
    outcome: 'won' | 'lost' | 'settled',
    notes: string,
  ): Dispute | null {
    const dispute = this.disputes.get(disputeId)
    if (!dispute) return null

    dispute.status = 'closed'
    dispute.outcome = outcome
    dispute.resolvedDate = new Date()
    dispute.notes.push(`[RESOLVED] ${outcome.toUpperCase()}: ${notes}`)

    logger.info(
      { type: 'dispute_resolved', disputeId, outcome },
      `Disputa resuelta: ${outcome}`,
    )

    return dispute
  }

  getRefundRequest(refundId: string): RefundRequest | null {
    return this.refundRequests.get(refundId) || null
  }

  getRefundsByOrder(orderId: string): RefundRequest[] {
    return Array.from(this.refundRequests.values()).filter((r) => r.orderId === orderId)
  }

  getRefundsByCustomer(customerId: string): RefundRequest[] {
    return Array.from(this.refundRequests.values()).filter((r) => r.customerId === customerId)
  }

  getPendingRefunds(tenantId: string): RefundRequest[] {
    return Array.from(this.refundRequests.values())
      .filter((r) => r.status === 'requested')
      .slice(0, 50)
  }

  getOpenDisputes(): Dispute[] {
    return Array.from(this.disputes.values()).filter((d) => d.status === 'opened' || d.status === 'under_review')
  }

  getRefundMetrics(tenantId: string): {
    totalRefunds: number
    approvedRefunds: number
    rejectedRefunds: number
    totalRefundAmount: number
    averageRefundTime: number // days
    chargebackRate: number
  } {
    const refunds = Array.from(this.refundRequests.values())
    const approved = refunds.filter((r) => r.status === 'approved' || r.status === 'completed')
    const rejected = refunds.filter((r) => r.status === 'rejected')
    const chargebacks = refunds.filter((r) => r.reason === 'chargeback')

    const totalAmount = approved.reduce((sum, r) => sum + r.amount, 0)

    let avgTime = 0
    if (approved.length > 0) {
      const times = approved
        .filter((r) => r.completedDate)
        .map((r) => (r.completedDate!.getTime() - r.requestedDate.getTime()) / (1000 * 60 * 60 * 24))
      avgTime = times.reduce((sum, t) => sum + t, 0) / times.length
    }

    return {
      totalRefunds: refunds.length,
      approvedRefunds: approved.length,
      rejectedRefunds: rejected.length,
      totalRefundAmount: totalAmount,
      averageRefundTime: avgTime,
      chargebackRate: refunds.length > 0 ? (chargebacks.length / refunds.length) * 100 : 0,
    }
  }
}

let globalRefundManager: RefundManager | null = null

export function initializeRefundManager(): RefundManager {
  if (!globalRefundManager) {
    globalRefundManager = new RefundManager()
  }
  return globalRefundManager
}

export function getRefundManager(): RefundManager {
  if (!globalRefundManager) {
    return initializeRefundManager()
  }
  return globalRefundManager
}
