/**
 * Support Testing & Optimization
 * Semana 41, Tarea 41.12: Support Testing & Optimization
 */

import { logger } from '@/lib/monitoring'

export interface SupportTestCase {
  id: string
  name: string
  description: string
  category: 'ticket' | 'routing' | 'escalation' | 'satisfaction' | 'analytics'
  testFunction: () => Promise<boolean>
  expectedResult: boolean
  tags: string[]
  createdAt: Date
}

export interface SupportTestResult {
  testCaseId: string
  testName: string
  passed: boolean
  duration: number
  error?: string
  timestamp: Date
  coverage?: number
}

export interface OptimizationMetric {
  metric: string
  before: number
  after: number
  improvement: number
  status: 'completed' | 'in_progress' | 'pending'
}

export class SupportTester {
  private testCases: Map<string, SupportTestCase> = new Map()
  private testResults: SupportTestResult[] = []
  private performanceMetrics: OptimizationMetric[] = []

  constructor() {
    logger.debug({ type: 'support_testing_init' }, 'Support Tester inicializado')
  }

  /**
   * Registrar test case
   */
  registerTestCase(testCase: SupportTestCase): void {
    this.testCases.set(testCase.id, testCase)
    logger.debug({ type: 'test_case_registered', testCaseId: testCase.id }, `Test case registrado: ${testCase.name}`)
  }

  /**
   * Ejecutar test individual
   */
  async runTest(testCaseId: string): Promise<SupportTestResult> {
    const testCase = this.testCases.get(testCaseId)
    if (!testCase) {
      throw new Error(`Test case no encontrado: ${testCaseId}`)
    }

    const startTime = Date.now()

    try {
      const passed = await testCase.testFunction()

      const result: SupportTestResult = {
        testCaseId,
        testName: testCase.name,
        passed,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }

      this.testResults.push(result)
      logger.info(
        { type: 'test_executed', testCaseId, passed, duration: result.duration },
        `Test ejecutado: ${testCase.name} - ${passed ? 'PASÓ' : 'FALLÓ'}`
      )

      return result
    } catch (error) {
      const result: SupportTestResult = {
        testCaseId,
        testName: testCase.name,
        passed: false,
        duration: Date.now() - startTime,
        error: String(error),
        timestamp: new Date(),
      }

      this.testResults.push(result)
      logger.error(
        { type: 'test_failed', testCaseId, error: String(error) },
        `Test falló: ${testCase.name}`
      )

      return result
    }
  }

  /**
   * Ejecutar suite de tests
   */
  async runTestSuite(testIds: string[]): Promise<SupportTestResult[]> {
    const results: SupportTestResult[] = []

    for (const testId of testIds) {
      const result = await this.runTest(testId)
      results.push(result)
    }

    return results
  }

  /**
   * Ejecutar tests por categoría
   */
  async runTestsByCategory(category: string): Promise<SupportTestResult[]> {
    const testIds = Array.from(this.testCases.values())
      .filter((t) => t.category === category)
      .map((t) => t.id)

    return this.runTestSuite(testIds)
  }

  /**
   * Obtener resultados
   */
  getTestResults(limit: number = 50): SupportTestResult[] {
    return this.testResults.slice(-limit)
  }

  /**
   * Calcular cobertura
   */
  calculateCoverage(): {
    totalTests: number
    passedTests: number
    failedTests: number
    passRate: number
    averageDuration: number
  } {
    const total = this.testResults.length
    const passed = this.testResults.filter((r) => r.passed).length
    const failed = total - passed
    const avgDuration = total > 0 ? this.testResults.reduce((sum, r) => sum + r.duration, 0) / total : 0

    return {
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      averageDuration: Math.round(avgDuration),
    }
  }

  /**
   * Registrar métrica de optimización
   */
  recordOptimizationMetric(metric: string, before: number, after: number): OptimizationMetric {
    const improvement = ((before - after) / before) * 100

    const optimizationMetric: OptimizationMetric = {
      metric,
      before,
      after,
      improvement,
      status: 'completed',
    }

    this.performanceMetrics.push(optimizationMetric)
    logger.info(
      { type: 'optimization_recorded', metric, improvement: improvement.toFixed(2) },
      `Optimización registrada: ${metric} - ${improvement.toFixed(2)}%`
    )

    return optimizationMetric
  }

  /**
   * Obtener métricas de optimización
   */
  getOptimizationMetrics(): OptimizationMetric[] {
    return this.performanceMetrics
  }

  /**
   * Generar reporte de testing
   */
  generateTestingReport(): string {
    const coverage = this.calculateCoverage()
    const categoryStats: Record<string, { total: number; passed: number }> = {}

    // Contar por categoría
    for (const testCase of this.testCases.values()) {
      if (!categoryStats[testCase.category]) {
        categoryStats[testCase.category] = { total: 0, passed: 0 }
      }
      categoryStats[testCase.category].total++
    }

    for (const result of this.testResults) {
      const testCase = this.testCases.get(result.testCaseId)
      if (testCase && categoryStats[testCase.category]) {
        if (result.passed) {
          categoryStats[testCase.category].passed++
        }
      }
    }

    const report = `
=== REPORTE DE TESTING DE SOPORTE ===

COBERTURA GENERAL:
- Total de Tests: ${coverage.totalTests}
- Tests Pasados: ${coverage.passedTests}
- Tests Fallidos: ${coverage.failedTests}
- Tasa de Paso: ${coverage.passRate.toFixed(2)}%
- Duración Promedio: ${coverage.averageDuration}ms

COBERTURA POR CATEGORÍA:
${Object.entries(categoryStats)
  .map(([category, stats]) => {
    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0
    return `- ${category}: ${stats.passed}/${stats.total} (${passRate}%)`
  })
  .join('\n')}

OPTIMIZACIONES COMPLETADAS:
${this.performanceMetrics.length > 0 ? this.performanceMetrics.map((m) => `- ${m.metric}: ${m.improvement.toFixed(2)}% mejora`).join('\n') : '- Ninguna registrada'}

RECOMENDACIONES:
${coverage.passRate < 90 ? '⚠️  La tasa de paso está por debajo del 90%. Investigar tests fallidos.' : '✅ Tasa de paso por encima del 90%'}
    `

    logger.info({ type: 'testing_report_generated' }, 'Reporte de testing generado')
    return report
  }

  /**
   * Obtener tests fallidos
   */
  getFailedTests(): SupportTestResult[] {
    return this.testResults.filter((r) => !r.passed)
  }

  /**
   * Obtener tests lentos
   */
  getSlowTests(threshold: number = 5000): SupportTestResult[] {
    return this.testResults.filter((r) => r.duration > threshold).sort((a, b) => b.duration - a.duration)
  }

  /**
   * Generar reporte de optimización
   */
  generateOptimizationReport(): string {
    const totalImprovement = this.performanceMetrics.reduce((sum, m) => sum + m.improvement, 0)
    const avgImprovement = this.performanceMetrics.length > 0 ? totalImprovement / this.performanceMetrics.length : 0

    const report = `
=== REPORTE DE OPTIMIZACIÓN DE SOPORTE ===

RESUMEN:
- Métricas Optimizadas: ${this.performanceMetrics.length}
- Mejora Total: ${totalImprovement.toFixed(2)}%
- Mejora Promedio: ${avgImprovement.toFixed(2)}%

DETALLES:
${this.performanceMetrics
  .map((m) => `- ${m.metric}: ${m.before}ms → ${m.after}ms (${m.improvement.toFixed(2)}% mejora)`)
  .join('\n')}

ESTADO:
- Completadas: ${this.performanceMetrics.filter((m) => m.status === 'completed').length}
- En Progreso: ${this.performanceMetrics.filter((m) => m.status === 'in_progress').length}
- Pendientes: ${this.performanceMetrics.filter((m) => m.status === 'pending').length}
    `

    return report
  }
}

let globalSupportTester: SupportTester | null = null

export function initializeSupportTester(): SupportTester {
  if (!globalSupportTester) {
    globalSupportTester = new SupportTester()
  }
  return globalSupportTester
}

export function getSupportTester(): SupportTester {
  if (!globalSupportTester) {
    return initializeSupportTester()
  }
  return globalSupportTester
}
