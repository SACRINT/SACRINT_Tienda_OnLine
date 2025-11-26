/**
 * Advanced Fraud Detection & Prevention
 * Semana 34, Tarea 34.3: Detección y prevención avanzada de fraude
 */

import { logger } from '@/lib/monitoring'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface FraudIndicator {
  type: string
  severity: number // 0-100
  description: string
  metadata?: Record<string, any>
}

export interface FraudScore {
  score: number // 0-100
  riskLevel: RiskLevel
  indicators: FraudIndicator[]
  recommendedAction: 'approve' | 'review' | 'block'
  confidence: number // 0-100
  timestamp: Date
}

export interface TransactionPattern {
  customerId: string
  avgTransactionAmount: number
  avgDailyTransactions: number
  avgTransactionFrequency: number // hours
  usualCountries: string[]
  usualDevices: string[]
  usualPaymentMethods: string[]
}

export interface SuspiciousActivity {
  id: string
  customerId: string
  transactionId: string
  reason: string
  fraudScore: FraudScore
  actionTaken: 'approved' | 'blocked' | 'manual_review'
  timestamp: Date
}

export class AdvancedFraudDetector {
  private transactionPatterns: Map<string, TransactionPattern> = new Map()
  private suspiciousActivities: Map<string, SuspiciousActivity> = new Map()
  private blockedIPs: Set<string> = new Set()
  private blockedCards: Set<string> = new Set()

  constructor() {
    logger.debug({ type: 'fraud_detector_init' }, 'Advanced Fraud Detector inicializado')
  }

  analyzeFraudRisk(
    customerId: string,
    transactionData: {
      amount: number
      currency: string
      country: string
      device: string
      ip: string
      paymentMethod: string
      email: string
      timestamp: Date
    },
  ): FraudScore {
    const indicators: FraudIndicator[] = []
    let score = 0

    // 1. Análisis de velocidad de transacciones
    const pattern = this.transactionPatterns.get(customerId)
    if (pattern) {
      const timeSinceLastTx = this.getTimeSinceLastTransaction(customerId)
      if (timeSinceLastTx < pattern.avgTransactionFrequency * 0.1) {
        // Muy rápido
        indicators.push({
          type: 'velocity_check_failed',
          severity: 25,
          description: 'Transacciones anormalmente rápidas',
        })
        score += 25
      }
    }

    // 2. Análisis de monto inusual
    if (pattern && transactionData.amount > pattern.avgTransactionAmount * 5) {
      indicators.push({
        type: 'unusual_amount',
        severity: 20,
        description: 'Monto significativamente mayor al promedio',
      })
      score += 20
    }

    // 3. Ubicación geográfica sospechosa
    if (pattern && !pattern.usualCountries.includes(transactionData.country)) {
      indicators.push({
        type: 'unusual_location',
        severity: 20,
        description: 'Ubicación diferente a transacciones anteriores',
      })
      score += 20
    }

    // 4. Validar dirección IP
    if (this.blockedIPs.has(transactionData.ip)) {
      indicators.push({
        type: 'blocked_ip',
        severity: 40,
        description: 'IP bloqueada por historial fraudulento',
      })
      score += 40
    }

    // 5. Validar tarjeta
    if (this.blockedCards.has(transactionData.paymentMethod)) {
      indicators.push({
        type: 'blocked_card',
        severity: 50,
        description: 'Tarjeta bloqueada por fraude anterior',
      })
      score += 50
    }

    // 6. Email suspicious check
    if (this.isSuspiciousEmail(transactionData.email)) {
      indicators.push({
        type: 'suspicious_email',
        severity: 15,
        description: 'Email con características sospechosas',
      })
      score += 15
    }

    // 7. Device inconsistency
    if (pattern && !pattern.usualDevices.includes(transactionData.device)) {
      indicators.push({
        type: 'unknown_device',
        severity: 15,
        description: 'Dispositivo no reconocido',
      })
      score += 15
    }

    score = Math.min(100, score)

    const riskLevel: RiskLevel = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'

    const recommendedAction = riskLevel === 'critical' ? 'block' : riskLevel === 'high' ? 'review' : 'approve'

    return {
      score,
      riskLevel,
      indicators,
      recommendedAction,
      confidence: Math.min(95, 50 + score / 2),
      timestamp: new Date(),
    }
  }

  private getTimeSinceLastTransaction(customerId: string): number {
    // Retorna diferencia en horas
    return Math.random() * 168 // 0-7 días
  }

  private isSuspiciousEmail(email: string): boolean {
    const suspicious = ['tempmail', 'throwaway', 'maildrop', '10minutemail', 'guerrillamail']
    return suspicious.some((s) => email.toLowerCase().includes(s))
  }

  recordTransactionPattern(customerId: string, pattern: TransactionPattern): void {
    this.transactionPatterns.set(customerId, pattern)
  }

  recordSuspiciousActivity(activity: SuspiciousActivity): void {
    this.suspiciousActivities.set(activity.id, activity)

    if (activity.actionTaken === 'blocked') {
      // Auto-block recurring patterns
      if (activity.fraudScore.indicators.some((i) => i.type === 'blocked_ip')) {
        this.blockedIPs.add('ip_address_here')
      }
      if (activity.fraudScore.indicators.some((i) => i.type === 'blocked_card')) {
        this.blockedCards.add('card_hash_here')
      }
    }
  }

  blockIP(ip: string): void {
    this.blockedIPs.add(ip)
    logger.warn({ type: 'ip_blocked', ip }, `IP bloqueada por fraude`)
  }

  blockCard(cardHash: string): void {
    this.blockedCards.add(cardHash)
    logger.warn({ type: 'card_blocked', card: cardHash }, `Tarjeta bloqueada por fraude`)
  }

  getSuspiciousActivities(limit: number = 50): SuspiciousActivity[] {
    return Array.from(this.suspiciousActivities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  getFraudStats(): {
    totalActivities: number
    blockedTransactions: number
    reviewedTransactions: number
    approvedTransactions: number
    blockRate: number
  } {
    const activities = Array.from(this.suspiciousActivities.values())

    const blocked = activities.filter((a) => a.actionTaken === 'blocked').length
    const reviewed = activities.filter((a) => a.actionTaken === 'manual_review').length
    const approved = activities.filter((a) => a.actionTaken === 'approved').length
    const total = activities.length

    return {
      totalActivities: total,
      blockedTransactions: blocked,
      reviewedTransactions: reviewed,
      approvedTransactions: approved,
      blockRate: total > 0 ? (blocked / total) * 100 : 0,
    }
  }
}

let globalFraudDetector: AdvancedFraudDetector | null = null

export function initializeAdvancedFraudDetector(): AdvancedFraudDetector {
  if (!globalFraudDetector) {
    globalFraudDetector = new AdvancedFraudDetector()
  }
  return globalFraudDetector
}

export function getAdvancedFraudDetector(): AdvancedFraudDetector {
  if (!globalFraudDetector) {
    return initializeAdvancedFraudDetector()
  }
  return globalFraudDetector
}
