/**
 * A/B Test Analytics & Results Dashboard
 * Semana 33, Tarea 33.5: Analytics de pruebas A/B
 */

import { logger } from '@/lib/monitoring'

export interface ABTestResult {
  testId: string
  campaignId: string
  variantA: { name: string; openRate: number; clickRate: number; conversions: number }
  variantB: { name: string; openRate: number; clickRate: number; conversions: number }
  sampleSize: number
  confidence: number
  winner: 'A' | 'B' | 'tie'
  statSignificant: boolean
  recommendations: string[]
}

export class ABTestAnalytics {
  private results: Map<string, ABTestResult> = new Map()

  constructor() {
    logger.debug({ type: 'ab_test_analytics_init' }, 'A/B Test Analytics inicializado')
  }

  recordResult(result: ABTestResult): void {
    this.results.set(result.testId, result)
  }

  getWinningVariant(testId: string): 'A' | 'B' | null {
    const result = this.results.get(testId)
    return result?.winner === 'tie' ? null : result?.winner || null
  }

  calculateSampleSize(expectedLift: number, baseline: number): number {
    // Cálculo simplificado de tamaño de muestra
    return Math.ceil((baseline * (1 - baseline) * 2 * (1.96 + 0.84) ** 2) / (expectedLift * baseline) ** 2)
  }

  getHistoricalWinRate(variantName: string): number {
    const wins = Array.from(this.results.values()).filter(
      (r) => (r.winner === 'A' && r.variantA.name === variantName) ||
             (r.winner === 'B' && r.variantB.name === variantName),
    ).length

    const total = Array.from(this.results.values()).length
    return total > 0 ? (wins / total) * 100 : 0
  }
}

let globalABTestAnalytics: ABTestAnalytics | null = null

export function initializeABTestAnalytics(): ABTestAnalytics {
  if (!globalABTestAnalytics) {
    globalABTestAnalytics = new ABTestAnalytics()
  }
  return globalABTestAnalytics
}

export function getABTestAnalytics(): ABTestAnalytics {
  if (!globalABTestAnalytics) {
    return initializeABTestAnalytics()
  }
  return globalABTestAnalytics
}
