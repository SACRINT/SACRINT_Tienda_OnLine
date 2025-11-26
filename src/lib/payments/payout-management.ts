/**
 * Payout Management & Settlement
 * Semana 34, Tarea 34.11: Gestión de pagos y liquidación a vendedores
 */

import { logger } from '@/lib/monitoring'

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'held'
export type PayoutFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'
export type PayoutMethod = 'bank_transfer' | 'check' | 'wire' | 'crypto'

export interface PayoutPolicy {
  tenantId: string
  frequency: PayoutFrequency
  minimumAmount: number
  holdingPeriod: number // days
  payoutMethod: PayoutMethod
  bankDetails?: {
    accountNumber: string
    routingNumber: string
    accountHolder: string
  }
  isActive: boolean
}

export interface Payout {
  id: string
  tenantId: string
  status: PayoutStatus
  amount: number
  currency: string
  fee: number
  netAmount: number
  method: PayoutMethod
  reference: string
  periodStart: Date
  periodEnd: Date
  createdAt: Date
  scheduledDate: Date
  processedDate?: Date
  metadata: Record<string, any>
}

export interface PayoutTransaction {
  id: string
  payoutId: string
  orderId: string
  amount: number
  commission: number
  netAmount: number
  status: 'pending' | 'included' | 'excluded'
  date: Date
}

export class PayoutManager {
  private payoutPolicies: Map<string, PayoutPolicy> = new Map()
  private payouts: Map<string, Payout> = new Map()
  private payoutTransactions: Map<string, PayoutTransaction[]> = new Map()

  constructor() {
    logger.debug({ type: 'payout_manager_init' }, 'Payout Manager inicializado')
  }

  setPayoutPolicy(tenantId: string, policy: PayoutPolicy): void {
    this.payoutPolicies.set(tenantId, policy)
    logger.info({ type: 'payout_policy_set', tenantId }, `Política de payout actualizada`)
  }

  recordPayoutTransaction(transaction: PayoutTransaction): void {
    const transactions = this.payoutTransactions.get(transaction.payoutId) || []
    transactions.push(transaction)
    this.payoutTransactions.set(transaction.payoutId, transactions)
  }

  createPayout(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    totalAmount: number,
    commissionPercentage: number = 2.9,
  ): Payout {
    const policy = this.payoutPolicies.get(tenantId)
    if (!policy) throw new Error('Payout policy not found')

    const fee = totalAmount * (commissionPercentage / 100)
    const netAmount = totalAmount - fee

    if (netAmount < policy.minimumAmount) {
      logger.warn(
        { type: 'payout_below_minimum', tenantId, amount: netAmount },
        `Monto de payout por debajo del mínimo`,
      )
    }

    const scheduledDate = new Date(endDate)
    scheduledDate.setDate(scheduledDate.getDate() + policy.holdingPeriod)

    const payout: Payout = {
      id: `payout_${Date.now()}_${Math.random()}`,
      tenantId,
      status: 'pending',
      amount: Math.round(totalAmount * 100) / 100,
      currency: 'USD',
      fee: Math.round(fee * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      method: policy.payoutMethod,
      reference: `PAYOUT-${tenantId.substring(0, 4)}-${Date.now()}`,
      periodStart: startDate,
      periodEnd: endDate,
      createdAt: new Date(),
      scheduledDate,
      metadata: {},
    }

    this.payouts.set(payout.id, payout)

    logger.info(
      { type: 'payout_created', payoutId: payout.id, tenantId, amount: payout.netAmount },
      `Payout creado: ${payout.reference}`,
    )

    return payout
  }

  processPayout(payoutId: string, transactionId: string): Payout | null {
    const payout = this.payouts.get(payoutId)
    if (!payout) return null

    const policy = this.payoutPolicies.get(payout.tenantId)
    const now = new Date()

    if (policy && now < payout.scheduledDate) {
      payout.status = 'held'
      logger.info({ type: 'payout_held', payoutId }, 'Payout en espera por período de retención')
      return payout
    }

    payout.status = 'processing'
    payout.metadata['transactionId'] = transactionId

    // Simular procesamiento
    setTimeout(() => {
      payout.status = 'completed'
      payout.processedDate = new Date()
    }, 3000)

    logger.info({ type: 'payout_processing', payoutId, transactionId }, 'Payout en procesamiento')

    return payout
  }

  holdPayout(payoutId: string, reason: string): Payout | null {
    const payout = this.payouts.get(payoutId)
    if (!payout) return null

    payout.status = 'held'
    payout.metadata['holdReason'] = reason

    logger.warn({ type: 'payout_held', payoutId, reason }, `Payout retenido: ${reason}`)

    return payout
  }

  releasePayout(payoutId: string): Payout | null {
    const payout = this.payouts.get(payoutId)
    if (!payout) return null

    if (payout.status === 'held') {
      payout.status = 'pending'
      logger.info({ type: 'payout_released', payoutId }, 'Payout liberado')
    }

    return payout
  }

  cancelPayout(payoutId: string, reason: string): Payout | null {
    const payout = this.payouts.get(payoutId)
    if (!payout) return null

    if (['completed', 'processing'].includes(payout.status)) {
      logger.error({ type: 'payout_cancel_failed', payoutId }, 'No se puede cancelar payout en proceso')
      return null
    }

    payout.status = 'cancelled'
    payout.metadata['cancellationReason'] = reason

    logger.info({ type: 'payout_cancelled', payoutId, reason }, `Payout cancelado: ${reason}`)

    return payout
  }

  getPayout(payoutId: string): Payout | null {
    return this.payouts.get(payoutId) || null
  }

  getTenantPayouts(tenantId: string, limit: number = 50): Payout[] {
    return Array.from(this.payouts.values())
      .filter((p) => p.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  getPendingPayouts(tenantId: string): Payout[] {
    return Array.from(this.payouts.values()).filter((p) => p.tenantId === tenantId && p.status === 'pending')
  }

  getPayoutMetrics(tenantId: string): {
    totalPayouts: number
    totalAmount: number
    totalFees: number
    completedPayouts: number
    pendingPayouts: number
    failedPayouts: number
    averagePayoutAmount: number
  } {
    const payouts = Array.from(this.payouts.values()).filter((p) => p.tenantId === tenantId)

    const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0)
    const totalFees = payouts.reduce((sum, p) => sum + p.fee, 0)
    const completed = payouts.filter((p) => p.status === 'completed').length
    const pending = payouts.filter((p) => p.status === 'pending').length
    const failed = payouts.filter((p) => p.status === 'failed').length

    return {
      totalPayouts: payouts.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      completedPayouts: completed,
      pendingPayouts: pending,
      failedPayouts: failed,
      averagePayoutAmount: payouts.length > 0 ? totalAmount / payouts.length : 0,
    }
  }

  getNextPayoutDate(tenantId: string): Date | null {
    const policy = this.payoutPolicies.get(tenantId)
    if (!policy) return null

    const lastPayout = Array.from(this.payouts.values())
      .filter((p) => p.tenantId === tenantId && p.status === 'completed')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

    if (!lastPayout) {
      return new Date() // Next available
    }

    const next = new Date(lastPayout.createdAt)

    switch (policy.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'quarterly':
        next.setMonth(next.getMonth() + 3)
        break
    }

    return next
  }
}

let globalPayoutManager: PayoutManager | null = null

export function initializePayoutManager(): PayoutManager {
  if (!globalPayoutManager) {
    globalPayoutManager = new PayoutManager()
  }
  return globalPayoutManager
}

export function getPayoutManager(): PayoutManager {
  if (!globalPayoutManager) {
    return initializePayoutManager()
  }
  return globalPayoutManager
}
