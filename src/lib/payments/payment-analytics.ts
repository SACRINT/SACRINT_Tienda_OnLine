/**
 * Payment Analytics & Financial Reporting
 * Semana 34, Tarea 34.8: Analytics de pagos y reportes financieros
 */

import { logger } from '@/lib/monitoring'

export interface PaymentMetrics {
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  totalVolume: number
  averageTransactionAmount: number
  successRate: number
  failureRate: number
  chargebackRate: number
}

export interface RevenueBreakdown {
  date: Date
  totalRevenue: number
  byPaymentMethod: Record<string, number>
  byGateway: Record<string, number>
  byProduct: Record<string, number>
  byCountry: Record<string, number>
}

export interface PaymentFlowAnalysis {
  period: string
  completionRate: number
  abandonmentRate: number
  averageTimeToCompletion: number // seconds
  topAbandonmentReasons: Array<{ reason: string; count: number }>
  conversionRate: number
}

export interface FinancialReport {
  period: { from: Date; to: Date }
  totalRevenue: number
  totalFees: number
  netRevenue: number
  refunds: number
  chargebacks: number
  transactions: number
  averageOrderValue: number
  profitMargin: number
}

export class PaymentAnalytics {
  private metrics: Map<string, PaymentMetrics> = new Map()
  private revenueHistory: RevenueBreakdown[] = []
  private flowAnalysis: Map<string, PaymentFlowAnalysis> = new Map()

  constructor() {
    logger.debug({ type: 'payment_analytics_init' }, 'Payment Analytics inicializado')
  }

  recordPaymentMetrics(tenantId: string, metrics: PaymentMetrics): void {
    this.metrics.set(tenantId, metrics)
    logger.debug({ type: 'metrics_recorded', tenantId }, 'Métricas de pago registradas')
  }

  recordRevenueBreakdown(breakdown: RevenueBreakdown): void {
    this.revenueHistory.push(breakdown)

    // Mantener últimos 365 días
    if (this.revenueHistory.length > 365) {
      this.revenueHistory.shift()
    }

    logger.debug({ type: 'revenue_recorded', date: breakdown.date }, 'Ingresos registrados')
  }

  getPaymentMetrics(tenantId: string): PaymentMetrics | null {
    return this.metrics.get(tenantId) || null
  }

  getDailyRevenue(tenantId: string, days: number = 30): Array<{ date: Date; revenue: number }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return this.revenueHistory
      .filter((r) => r.date >= cutoffDate)
      .map((r) => ({
        date: r.date,
        revenue: r.totalRevenue,
      }))
  }

  getMonthlyRevenue(tenantId: string, months: number = 12): Array<{ month: string; revenue: number }> {
    const monthly: Record<string, number> = {}

    this.revenueHistory.forEach((r) => {
      const month = r.date.toISOString().substring(0, 7)
      monthly[month] = (monthly[month] || 0) + r.totalRevenue
    })

    return Object.entries(monthly)
      .sort()
      .slice(-months)
      .map(([month, revenue]) => ({ month, revenue }))
  }

  getRevenueByPaymentMethod(tenantId: string, days: number = 30): Record<string, number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const byMethod: Record<string, number> = {}

    this.revenueHistory
      .filter((r) => r.date >= cutoffDate)
      .forEach((r) => {
        Object.entries(r.byPaymentMethod).forEach(([method, amount]) => {
          byMethod[method] = (byMethod[method] || 0) + amount
        })
      })

    return byMethod
  }

  getRevenueByGateway(tenantId: string, days: number = 30): Record<string, number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const byGateway: Record<string, number> = {}

    this.revenueHistory
      .filter((r) => r.date >= cutoffDate)
      .forEach((r) => {
        Object.entries(r.byGateway).forEach(([gateway, amount]) => {
          byGateway[gateway] = (byGateway[gateway] || 0) + amount
        })
      })

    return byGateway
  }

  analyzePaymentFlow(
    tenantId: string,
    period: string,
    startedCheckouts: number,
    completedCheckouts: number,
    averageTime: number,
  ): PaymentFlowAnalysis {
    const completionRate = startedCheckouts > 0 ? (completedCheckouts / startedCheckouts) * 100 : 0
    const abandonmentRate = 100 - completionRate

    const analysis: PaymentFlowAnalysis = {
      period,
      completionRate,
      abandonmentRate,
      averageTimeToCompletion: averageTime,
      topAbandonmentReasons: [
        { reason: 'Shipping costs too high', count: Math.floor(startedCheckouts * 0.02) },
        { reason: 'Too many steps', count: Math.floor(startedCheckouts * 0.015) },
        { reason: 'Payment declined', count: Math.floor(startedCheckouts * 0.01) },
        { reason: 'Unexpected fees', count: Math.floor(startedCheckouts * 0.008) },
      ],
      conversionRate: completionRate,
    }

    this.flowAnalysis.set(tenantId, analysis)

    logger.info(
      { type: 'flow_analyzed', tenantId, completionRate },
      `Análisis de flujo de pago: ${completionRate.toFixed(2)}% completación`,
    )

    return analysis
  }

  generateFinancialReport(
    tenantId: string,
    from: Date,
    to: Date,
  ): FinancialReport {
    const relevantHistory = this.revenueHistory.filter((r) => r.date >= from && r.date <= to)

    const totalRevenue = relevantHistory.reduce((sum, r) => sum + r.totalRevenue, 0)
    const totalFees = totalRevenue * 0.029 + 0.3 // Simular fees (2.9% + 30 centavos)
    const netRevenue = totalRevenue - totalFees

    const report: FinancialReport = {
      period: { from, to },
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      refunds: Math.round(totalRevenue * 0.02 * 100) / 100, // Simular 2% refunds
      chargebacks: Math.round(totalRevenue * 0.001 * 100) / 100, // Simular 0.1% chargebacks
      transactions: relevantHistory.length,
      averageOrderValue: relevantHistory.length > 0 ? totalRevenue / relevantHistory.length : 0,
      profitMargin: totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0,
    }

    logger.info(
      { type: 'financial_report_generated', tenantId, totalRevenue: report.totalRevenue },
      `Reporte financiero generado`,
    )

    return report
  }

  getPaymentMethodAnalysis(tenantId: string): Array<{
    method: string
    volume: number
    percentage: number
    avgTransactionValue: number
    successRate: number
  }> {
    const byMethod = this.getRevenueByPaymentMethod(tenantId)
    const total = Object.values(byMethod).reduce((sum, v) => sum + v, 0)

    return Object.entries(byMethod).map(([method, volume]) => ({
      method,
      volume: Math.round(volume * 100) / 100,
      percentage: (volume / total) * 100,
      avgTransactionValue: volume / 10, // Simular
      successRate: 95 + Math.random() * 5, // 95-100%
    }))
  }

  getFraudAnalysis(tenantId: string): {
    suspiciousTransactions: number
    blockedTransactions: number
    fraudRate: number
    estimatedLoss: number
  } {
    const metrics = this.metrics.get(tenantId)
    if (!metrics) return { suspiciousTransactions: 0, blockedTransactions: 0, fraudRate: 0, estimatedLoss: 0 }

    const fraudRate = metrics.chargebackRate * 0.5 // Estimate
    const suspiciousTransactions = Math.floor(metrics.totalTransactions * (fraudRate / 100))
    const blockedTransactions = Math.floor(suspiciousTransactions * 0.7)

    const lastRevenue = this.revenueHistory[this.revenueHistory.length - 1]
    const estimatedLoss = lastRevenue ? (lastRevenue.totalRevenue * fraudRate) / 100 : 0

    return {
      suspiciousTransactions,
      blockedTransactions,
      fraudRate,
      estimatedLoss: Math.round(estimatedLoss * 100) / 100,
    }
  }
}

let globalPaymentAnalytics: PaymentAnalytics | null = null

export function initializePaymentAnalytics(): PaymentAnalytics {
  if (!globalPaymentAnalytics) {
    globalPaymentAnalytics = new PaymentAnalytics()
  }
  return globalPaymentAnalytics
}

export function getPaymentAnalytics(): PaymentAnalytics {
  if (!globalPaymentAnalytics) {
    return initializePaymentAnalytics()
  }
  return globalPaymentAnalytics
}
