/**
 * A/B Testing para Campañas de Email
 * Semana 32, Tarea 32.5: Sistema de pruebas A/B y variantes
 */

import { logger } from '@/lib/monitoring'

export interface ABTest {
  id: string
  campaignId: string
  name: string
  variantA: { templateId: string; subject: string; name: string }
  variantB: { templateId: string; subject: string; name: string }
  splitPercentage: number // % para cada variante
  testSize: number // total emails para A/B test
  startedAt: Date
  endedAt?: Date
  winner?: 'A' | 'B'
  stats: {
    variantA: { sent: number; opened: number; clicked: number }
    variantB: { sent: number; opened: number; clicked: number }
  }
}

export class ABTestManager {
  private tests: Map<string, ABTest> = new Map()

  constructor() {
    logger.debug({ type: 'ab_test_manager_init' }, 'A/B Test Manager inicializado')
  }

  createTest(campaignId: string, data: Omit<ABTest, 'id' | 'startedAt' | 'endedAt' | 'stats'>): ABTest {
    const test: ABTest = {
      ...data,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      startedAt: new Date(),
      stats: {
        variantA: { sent: 0, opened: 0, clicked: 0 },
        variantB: { sent: 0, opened: 0, clicked: 0 },
      },
    }

    this.tests.set(test.id, test)
    logger.debug({ type: 'ab_test_created', testId: test.id }, `A/B Test creado: ${test.name}`)

    return test
  }

  getResults(testId: string): { winner: string; confidence: number } | null {
    const test = this.tests.get(testId)
    if (!test) return null

    const openRateA = test.stats.variantA.sent > 0 ? (test.stats.variantA.opened / test.stats.variantA.sent) * 100 : 0
    const openRateB = test.stats.variantB.sent > 0 ? (test.stats.variantB.opened / test.stats.variantB.sent) * 100 : 0
    const clickRateA = test.stats.variantA.sent > 0 ? (test.stats.variantA.clicked / test.stats.variantA.sent) * 100 : 0
    const clickRateB = test.stats.variantB.sent > 0 ? (test.stats.variantB.clicked / test.stats.variantB.sent) * 100 : 0

    const scoreA = openRateA * 0.6 + clickRateA * 0.4
    const scoreB = openRateB * 0.6 + clickRateB * 0.4

    const winner = scoreA > scoreB ? 'A' : 'B'
    const difference = Math.abs(scoreA - scoreB)
    const confidence = Math.min(100, (difference / Math.max(scoreA, scoreB)) * 100)

    return { winner, confidence }
  }
}

let globalABTestManager: ABTestManager | null = null

export function initializeABTestManager(): ABTestManager {
  if (!globalABTestManager) {
    globalABTestManager = new ABTestManager()
  }
  return globalABTestManager
}

export function getABTestManager(): ABTestManager {
  if (!globalABTestManager) {
    return initializeABTestManager()
  }
  return globalABTestManager
}
