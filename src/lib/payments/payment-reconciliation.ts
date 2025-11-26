/**
 * Payment Reconciliation & Accounting
 * Semana 34, Tarea 34.9: Reconciliación de pagos y contabilidad
 */

import { logger } from '@/lib/monitoring'

export interface TransactionRecord {
  id: string
  date: Date
  amount: number
  currency: string
  type: 'debit' | 'credit'
  source: 'payment' | 'refund' | 'fee' | 'adjustment'
  orderId?: string
  description: string
  status: 'pending' | 'reconciled' | 'discrepancy'
  externalId?: string
}

export interface ReconciliationReport {
  id: string
  period: { from: Date; to: Date }
  internalTotal: number
  externalTotal: number
  variance: number
  variancePercentage: number
  discrepancies: Array<{
    transactionId: string
    internalAmount: number
    externalAmount: number
    difference: number
  }>
  status: 'pending' | 'reconciled' | 'manual_review'
  createdAt: Date
  reconciliedAt?: Date
  notes: string[]
}

export interface AccountingEntry {
  id: string
  date: Date
  account: string
  debit?: number
  credit?: number
  description: string
  reference: string
  status: 'draft' | 'posted' | 'archived'
}

export class PaymentReconciliation {
  private transactions: Map<string, TransactionRecord> = new Map()
  private reconciliationReports: Map<string, ReconciliationReport> = new Map()
  private accountingEntries: Map<string, AccountingEntry> = new Map()

  constructor() {
    logger.debug({ type: 'reconciliation_init' }, 'Payment Reconciliation inicializado')
  }

  recordTransaction(transaction: TransactionRecord): void {
    this.transactions.set(transaction.id, transaction)
  }

  reconcilePayments(
    tenantId: string,
    from: Date,
    to: Date,
    externalTransactions: TransactionRecord[],
  ): ReconciliationReport {
    const internalTransactions = Array.from(this.transactions.values()).filter(
      (t) => t.date >= from && t.date <= to,
    )

    const internalTotal = internalTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)

    const externalTotal = externalTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)

    const variance = Math.abs(internalTotal - externalTotal)
    const variancePercentage = internalTotal > 0 ? (variance / internalTotal) * 100 : 0

    const discrepancies: ReconciliationReport['discrepancies'] = []

    // Encontrar discrepancias
    internalTransactions.forEach((internal) => {
      const external = externalTransactions.find((e) => e.externalId === internal.externalId)

      if (!external || external.amount !== internal.amount) {
        discrepancies.push({
          transactionId: internal.id,
          internalAmount: internal.amount,
          externalAmount: external?.amount || 0,
          difference: external ? Math.abs(internal.amount - external.amount) : internal.amount,
        })

        internal.status = 'discrepancy'
      } else {
        internal.status = 'reconciled'
      }
    })

    const report: ReconciliationReport = {
      id: `rec_${Date.now()}_${Math.random()}`,
      period: { from, to },
      internalTotal: Math.round(internalTotal * 100) / 100,
      externalTotal: Math.round(externalTotal * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      variancePercentage: Math.round(variancePercentage * 100) / 100,
      discrepancies,
      status: variancePercentage < 0.1 ? 'reconciled' : 'manual_review',
      createdAt: new Date(),
      notes: [],
    }

    if (report.status === 'reconciled') {
      report.reconciliedAt = new Date()
    }

    this.reconciliationReports.set(report.id, report)

    logger.info(
      { type: 'reconciliation_completed', tenantId, variance: report.variance },
      `Reconciliación completada: Varianza ${report.variancePercentage.toFixed(2)}%`,
    )

    return report
  }

  createAccountingEntry(
    date: Date,
    account: string,
    amount: number,
    type: 'debit' | 'credit',
    description: string,
    reference: string,
  ): AccountingEntry {
    const entry: AccountingEntry = {
      id: `acc_${Date.now()}_${Math.random()}`,
      date,
      account,
      debit: type === 'debit' ? amount : undefined,
      credit: type === 'credit' ? amount : undefined,
      description,
      reference,
      status: 'draft',
    }

    this.accountingEntries.set(entry.id, entry)

    return entry
  }

  postEntry(entryId: string): AccountingEntry | null {
    const entry = this.accountingEntries.get(entryId)
    if (!entry) return null

    entry.status = 'posted'
    logger.info({ type: 'entry_posted', entryId }, 'Asiento contable registrado')

    return entry
  }

  generateGeneralLedger(from: Date, to: Date): Record<string, Array<AccountingEntry>> {
    const ledger: Record<string, Array<AccountingEntry>> = {}

    Array.from(this.accountingEntries.values())
      .filter((e) => e.date >= from && e.date <= to && e.status === 'posted')
      .forEach((entry) => {
        if (!ledger[entry.account]) {
          ledger[entry.account] = []
        }
        ledger[entry.account].push(entry)
      })

    return ledger
  }

  getTrialBalance(date: Date): Array<{ account: string; debit: number; credit: number; balance: number }> {
    const accounts: Record<string, { debit: number; credit: number }> = {}

    Array.from(this.accountingEntries.values())
      .filter((e) => e.date <= date && e.status === 'posted')
      .forEach((entry) => {
        if (!accounts[entry.account]) {
          accounts[entry.account] = { debit: 0, credit: 0 }
        }

        if (entry.debit) accounts[entry.account].debit += entry.debit
        if (entry.credit) accounts[entry.account].credit += entry.credit
      })

    return Object.entries(accounts).map(([account, values]) => ({
      account,
      debit: Math.round(values.debit * 100) / 100,
      credit: Math.round(values.credit * 100) / 100,
      balance: Math.round((values.debit - values.credit) * 100) / 100,
    }))
  }

  resolveDiscrepancy(reportId: string, transactionId: string, resolution: string): void {
    const report = this.reconciliationReports.get(reportId)
    if (!report) return

    const transaction = this.transactions.get(transactionId)
    if (transaction) {
      transaction.status = 'reconciled'
    }

    report.notes.push(`[${new Date().toISOString()}] Discrepancia resuelta: ${resolution}`)

    logger.info({ type: 'discrepancy_resolved', transactionId }, `Discrepancia resuelta`)
  }

  getReconciliationStatus(tenantId: string): {
    lastReconciliation?: Date
    pendingReconciliations: number
    discrepancies: number
  } {
    const reports = Array.from(this.reconciliationReports.values())
    const lastReport = reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

    const pendingTransactions = Array.from(this.transactions.values()).filter((t) => t.status === 'pending')
    const discrepancies = Array.from(this.transactions.values()).filter((t) => t.status === 'discrepancy')

    return {
      lastReconciliation: lastReport?.createdAt,
      pendingReconciliations: pendingTransactions.length,
      discrepancies: discrepancies.length,
    }
  }
}

let globalReconciliation: PaymentReconciliation | null = null

export function initializePaymentReconciliation(): PaymentReconciliation {
  if (!globalReconciliation) {
    globalReconciliation = new PaymentReconciliation()
  }
  return globalReconciliation
}

export function getPaymentReconciliation(): PaymentReconciliation {
  if (!globalReconciliation) {
    return initializePaymentReconciliation()
  }
  return globalReconciliation
}
