/**
 * A/B Testing for Search Results
 * Semana 39, Tarea 39.11: A/B Testing for Search Results
 */

import { logger } from '@/lib/monitoring'

export interface ABTestVariant {
  id: string
  name: string
  description?: string
  algorithm: string
  trafficPercentage: number
}

export interface ABTest {
  id: string
  name: string
  query?: string
  variants: ABTestVariant[]
  status: 'active' | 'paused' | 'completed'
  startDate: Date
  endDate?: Date
  minSampleSize: number
  statisticalSignificance: number
}

export interface TestResult {
  testId: string
  variantId: string
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  conversionRate: number
}

export class ABTestingManager {
  private tests: Map<string, ABTest> = new Map()
  private results: Map<string, TestResult[]> = new Map()
  private userVariantAssignment: Map<string, Map<string, string>> = new Map() // userId -> testId -> variantId

  constructor() {
    logger.debug({ type: 'ab_testing_init' }, 'A/B Testing Manager inicializado')
  }

  /**
   * Crear A/B test
   */
  createTest(test: ABTest): void {
    try {
      this.tests.set(test.id, test)
      this.results.set(test.id, [])

      // Inicializar resultados para cada variante
      for (const variant of test.variants) {
        this.results.get(test.id)!.push({
          testId: test.id,
          variantId: variant.id,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          ctr: 0,
          conversionRate: 0,
        })
      }

      logger.info(
        { type: 'ab_test_created', testId: test.id, name: test.name, variantCount: test.variants.length },
        `A/B test creado: ${test.name}`,
      )
    } catch (error) {
      logger.error({ type: 'test_creation_error', error: String(error) }, 'Error al crear A/B test')
    }
  }

  /**
   * Asignar usuario a variante
   */
  assignUserToVariant(testId: string, userId: string): string {
    const test = this.tests.get(testId)
    if (!test) throw new Error('Test no encontrado')

    // Verificar si ya tiene asignación
    if (this.userVariantAssignment.has(userId)) {
      const userTests = this.userVariantAssignment.get(userId)!
      if (userTests.has(testId)) {
        return userTests.get(testId)!
      }
    }

    // Asignar aleatoriamente basado en traffic percentage
    const random = Math.random() * 100
    let cumulative = 0

    for (const variant of test.variants) {
      cumulative += variant.trafficPercentage
      if (random <= cumulative) {
        if (!this.userVariantAssignment.has(userId)) {
          this.userVariantAssignment.set(userId, new Map())
        }
        this.userVariantAssignment.get(userId)!.set(testId, variant.id)
        return variant.id
      }
    }

    // Fallback a primera variante
    return test.variants[0].id
  }

  /**
   * Registrar impresión
   */
  recordImpression(testId: string, variantId: string): void {
    const results = this.results.get(testId)
    if (!results) return

    const result = results.find((r) => r.variantId === variantId)
    if (result) {
      result.impressions++
    }
  }

  /**
   * Registrar click
   */
  recordClick(testId: string, variantId: string): void {
    const results = this.results.get(testId)
    if (!results) return

    const result = results.find((r) => r.variantId === variantId)
    if (result) {
      result.clicks++
      result.ctr = result.impressions > 0 ? result.clicks / result.impressions : 0
    }
  }

  /**
   * Registrar conversión
   */
  recordConversion(testId: string, variantId: string, revenue: number = 0): void {
    const results = this.results.get(testId)
    if (!results) return

    const result = results.find((r) => r.variantId === variantId)
    if (result) {
      result.conversions++
      result.revenue += revenue
      result.conversionRate = result.clicks > 0 ? result.conversions / result.clicks : 0
    }
  }

  /**
   * Obtener resultados del test
   */
  getResults(testId: string): TestResult[] | null {
    return this.results.get(testId) || null
  }

  /**
   * Obtener ganador del test
   */
  getWinner(testId: string): { variantId: string; conversionRate: number; confidence: number } | null {
    const results = this.results.get(testId)
    if (!results) return null

    // Calcular estadísticas bayesianas simplificadas
    let winner = results[0]
    for (const result of results) {
      if (result.conversionRate > winner.conversionRate) {
        winner = result
      }
    }

    // Calcular confianza basada en sample size
    const test = this.tests.get(testId)
    const minSample = test?.minSampleSize || 100
    const confidence = Math.min(1, winner.conversions / minSample)

    return {
      variantId: winner.variantId,
      conversionRate: winner.conversionRate,
      confidence,
    }
  }

  /**
   * Completar test
   */
  completeTest(testId: string): ABTest | null {
    const test = this.tests.get(testId)
    if (!test) return null

    test.status = 'completed'
    test.endDate = new Date()

    logger.info(
      { type: 'test_completed', testId, name: test.name },
      `A/B test completado: ${test.name}`,
    )

    return test
  }

  /**
   * Obtener test
   */
  getTest(testId: string): ABTest | null {
    return this.tests.get(testId) || null
  }

  /**
   * Obtener tests activos
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.tests.values()).filter((t) => t.status === 'active')
  }

  /**
   * Generar reporte de test
   */
  generateReport(testId: string): string {
    const test = this.tests.get(testId)
    const results = this.results.get(testId)

    if (!test || !results) return 'Test no encontrado'

    const winner = this.getWinner(testId)

    let report = `
╔════════════════════════════════════════════════════════════╗
║              A/B TEST REPORT
╚════════════════════════════════════════════════════════════╝

Test: ${test.name}
Status: ${test.status}
Duration: ${test.startDate.toISOString()} - ${test.endDate?.toISOString() || 'Ongoing'}

Variants:
${results
  .map(
    (r) => `
  ${r.variantId}:
    Impressions: ${r.impressions}
    Clicks: ${r.clicks} (CTR: ${(r.ctr * 100).toFixed(2)}%)
    Conversions: ${r.conversions} (Conversion Rate: ${(r.conversionRate * 100).toFixed(2)}%)
    Revenue: $${r.revenue.toFixed(2)}
  `,
  )
  .join('')}

Winner: ${winner ? `${winner.variantId} (${(winner.conversionRate * 100).toFixed(2)}% CR, ${(winner.confidence * 100).toFixed(0)}% confidence)` : 'No determined yet'}

════════════════════════════════════════════════════════════
    `

    return report
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalTests: number; activeTests: number; completedTests: number } {
    const tests = Array.from(this.tests.values())

    return {
      totalTests: tests.length,
      activeTests: tests.filter((t) => t.status === 'active').length,
      completedTests: tests.filter((t) => t.status === 'completed').length,
    }
  }
}

let globalABTestingManager: ABTestingManager | null = null

export function initializeABTestingManager(): ABTestingManager {
  if (!globalABTestingManager) {
    globalABTestingManager = new ABTestingManager()
  }
  return globalABTestingManager
}

export function getABTestingManager(): ABTestingManager {
  if (!globalABTestingManager) {
    return initializeABTestingManager()
  }
  return globalABTestingManager
}
