/**
 * Payment Gateway Orchestrator & Failover
 * Semana 34, Tarea 34.2: Orquestación de pasarelas de pago y failover
 */

import { logger } from '@/lib/monitoring'

export type PaymentGateway = 'stripe' | 'mercadopago' | 'paypal' | 'adyen'
export type PaymentStatus = 'pending' | 'processing' | 'authorized' | 'captured' | 'failed' | 'refunded'

export interface PaymentTransaction {
  transactionId: string
  orderId: string
  amount: number
  currency: string
  gateway: PaymentGateway
  status: PaymentStatus
  gatewayTransactionId: string
  timestamp: Date
  metadata: Record<string, any>
}

export interface GatewayConfig {
  gateway: PaymentGateway
  apiKey: string
  secretKey: string
  webhookUrl: string
  retryAttempts: number
  timeout: number // milliseconds
  enabled: boolean
  priority: number // Lower = higher priority
}

export interface PaymentResult {
  success: boolean
  transaction?: PaymentTransaction
  error?: {
    code: string
    message: string
    gateway: PaymentGateway
  }
  fallbackGateway?: PaymentGateway
  attemptCount: number
}

export class PaymentGatewayOrchestrator {
  private gateways: Map<PaymentGateway, GatewayConfig> = new Map()
  private transactions: Map<string, PaymentTransaction> = new Map()
  private gatewayStats: Map<PaymentGateway, { success: number; failed: number; avgTime: number }> = new Map()

  constructor() {
    this.initializeGateways()
    logger.debug({ type: 'gateway_orchestrator_init' }, 'Payment Gateway Orchestrator inicializado')
  }

  private initializeGateways(): void {
    const gateways: GatewayConfig[] = [
      {
        gateway: 'stripe',
        apiKey: process.env.STRIPE_SECRET_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookUrl: process.env.STRIPE_WEBHOOK_URL || '',
        retryAttempts: 3,
        timeout: 5000,
        enabled: true,
        priority: 1,
      },
      {
        gateway: 'mercadopago',
        apiKey: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
        secretKey: process.env.MERCADOPAGO_SECRET_KEY || '',
        webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || '',
        retryAttempts: 2,
        timeout: 6000,
        enabled: true,
        priority: 2,
      },
      {
        gateway: 'paypal',
        apiKey: process.env.PAYPAL_CLIENT_ID || '',
        secretKey: process.env.PAYPAL_SECRET || '',
        webhookUrl: process.env.PAYPAL_WEBHOOK_URL || '',
        retryAttempts: 2,
        timeout: 7000,
        enabled: false,
        priority: 3,
      },
      {
        gateway: 'adyen',
        apiKey: process.env.ADYEN_API_KEY || '',
        secretKey: process.env.ADYEN_API_KEY || '',
        webhookUrl: process.env.ADYEN_WEBHOOK_URL || '',
        retryAttempts: 2,
        timeout: 6000,
        enabled: false,
        priority: 4,
      },
    ]

    gateways.forEach((config) => {
      this.gateways.set(config.gateway, config)
      this.gatewayStats.set(config.gateway, { success: 0, failed: 0, avgTime: 0 })
    })
  }

  async processPayment(
    orderId: string,
    amount: number,
    currency: string,
    preferredGateway?: PaymentGateway,
  ): Promise<PaymentResult> {
    const gateways = this.getGatewayPriority(preferredGateway)
    let lastError: any = null
    let attemptCount = 0

    for (const gateway of gateways) {
      attemptCount++
      const config = this.gateways.get(gateway)

      if (!config || !config.enabled) {
        logger.warn({ type: 'gateway_disabled', gateway }, `Pasarela ${gateway} deshabilitada`)
        continue
      }

      try {
        const startTime = Date.now()

        // Simular procesamiento de pago
        const transaction: PaymentTransaction = {
          transactionId: `txn_${Date.now()}_${Math.random()}`,
          orderId,
          amount,
          currency,
          gateway,
          status: 'captured',
          gatewayTransactionId: `${gateway}_${Date.now()}`,
          timestamp: new Date(),
          metadata: {},
        }

        this.transactions.set(transaction.transactionId, transaction)

        const processingTime = Date.now() - startTime
        this.updateGatewayStats(gateway, true, processingTime)

        logger.info(
          { type: 'payment_processed', gateway, orderId, transactionId: transaction.transactionId },
          `Pago procesado exitosamente en ${gateway}`,
        )

        return {
          success: true,
          transaction,
          attemptCount,
        }
      } catch (error) {
        lastError = error
        this.updateGatewayStats(gateway, false, 0)

        logger.error(
          { type: 'payment_failed', gateway, orderId, error: String(error) },
          `Error al procesar pago en ${gateway}`,
        )

        if (attemptCount >= config.retryAttempts) {
          continue // Try next gateway
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'ALL_GATEWAYS_FAILED',
        message: 'Todas las pasarelas de pago fallaron',
        gateway: 'unknown' as PaymentGateway,
      },
      attemptCount,
    }
  }

  private getGatewayPriority(preferred?: PaymentGateway): PaymentGateway[] {
    const sorted = Array.from(this.gateways.values())
      .filter((g) => g.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map((g) => g.gateway)

    if (preferred && sorted.includes(preferred)) {
      // Mover preferida al inicio
      sorted.splice(sorted.indexOf(preferred), 1)
      sorted.unshift(preferred)
    }

    return sorted
  }

  private updateGatewayStats(gateway: PaymentGateway, success: boolean, processingTime: number): void {
    const stats = this.gatewayStats.get(gateway)
    if (!stats) return

    if (success) {
      stats.success++
      stats.avgTime = (stats.avgTime * (stats.success - 1) + processingTime) / stats.success
    } else {
      stats.failed++
    }
  }

  getTransaction(transactionId: string): PaymentTransaction | null {
    return this.transactions.get(transactionId) || null
  }

  getGatewayHealth(): Record<PaymentGateway, { successRate: number; avgTime: number; enabled: boolean }> {
    const health: Record<string, any> = {}

    this.gateways.forEach((config, gateway) => {
      const stats = this.gatewayStats.get(gateway)!
      const total = stats.success + stats.failed

      health[gateway] = {
        successRate: total > 0 ? (stats.success / total) * 100 : 100,
        avgTime: stats.avgTime,
        enabled: config.enabled,
      }
    })

    return health
  }

  toggleGateway(gateway: PaymentGateway, enabled: boolean): void {
    const config = this.gateways.get(gateway)
    if (config) {
      config.enabled = enabled
      logger.info({ type: 'gateway_toggled', gateway, enabled }, `Pasarela ${gateway} ${enabled ? 'habilitada' : 'deshabilitada'}`)
    }
  }

  getTransactionHistory(orderId: string): PaymentTransaction[] {
    return Array.from(this.transactions.values()).filter((t) => t.orderId === orderId)
  }
}

let globalOrchestrator: PaymentGatewayOrchestrator | null = null

export function initializePaymentOrchestrator(): PaymentGatewayOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new PaymentGatewayOrchestrator()
  }
  return globalOrchestrator
}

export function getPaymentOrchestrator(): PaymentGatewayOrchestrator {
  if (!globalOrchestrator) {
    return initializePaymentOrchestrator()
  }
  return globalOrchestrator
}
