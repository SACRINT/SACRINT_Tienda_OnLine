/**
 * Performance Testing
 * Semana 43, Tarea 43.11: Performance Testing
 */

import { logger } from '@/lib/monitoring'

export interface PerformanceTest {
  id: string
  name: string
  endpoint: string
  method: string
  duration: number
  concurrency: number
  status: 'passed' | 'failed'
  timestamp: Date
}

export interface PerformanceTestResult {
  testId: string
  minResponseTime: number
  maxResponseTime: number
  avgResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  throughput: number
  errorRate: number
}

export class PerformanceTestingManager {
  private tests: Map<string, PerformanceTest> = new Map()
  private results: Map<string, PerformanceTestResult> = new Map()

  constructor() {
    logger.debug({ type: 'performance_testing_init' }, 'Performance Testing Manager inicializado')
  }

  /**
   * Crear test de rendimiento
   */
  createTest(name: string, endpoint: string, method: string, duration: number, concurrency: number): PerformanceTest {
    const test: PerformanceTest = {
      id: `perf_test_${Date.now()}`,
      name,
      endpoint,
      method,
      duration,
      concurrency,
      status: 'passed',
      timestamp: new Date(),
    }

    this.tests.set(test.id, test)
    logger.info({ type: 'performance_test_created', name, endpoint }, `Test de rendimiento creado: ${name}`)

    return test
  }

  /**
   * Ejecutar test
   */
  executeTest(testId: string, responseTimes: number[], errorCount: number = 0): PerformanceTestResult | null {
    const test = this.tests.get(testId)
    if (!test) return null

    const sorted = responseTimes.sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)

    const result: PerformanceTestResult = {
      testId,
      minResponseTime: sorted[0],
      maxResponseTime: sorted[sorted.length - 1],
      avgResponseTime: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
      p95ResponseTime: sorted[p95Index],
      p99ResponseTime: sorted[p99Index],
      throughput: responseTimes.length / (test.duration / 1000),
      errorRate: (errorCount / responseTimes.length) * 100,
    }

    this.results.set(testId, result)

    // Determinar si pasó
    if (result.avgResponseTime > 1000 || result.errorRate > 5) {
      test.status = 'failed'
      logger.warn({ type: 'performance_test_failed', testId, avg: result.avgResponseTime }, `Test de rendimiento falló: ${test.name}`)
    } else {
      test.status = 'passed'
      logger.info({ type: 'performance_test_passed', testId, avg: result.avgResponseTime }, `Test de rendimiento pasó: ${test.name}`)
    }

    return result
  }

  /**
   * Generar reporte
   */
  generateTestReport(testId: string): string {
    const test = this.tests.get(testId)
    const result = this.results.get(testId)

    if (!test || !result) return 'Test no encontrado'

    return `
=== REPORTE DE TEST DE RENDIMIENTO ===

TEST: ${test.name}
ENDPOINT: ${test.method} ${test.endpoint}
ESTADO: ${test.status.toUpperCase()}

RESULTADOS:
- Respuesta Mín: ${result.minResponseTime}ms
- Respuesta Máx: ${result.maxResponseTime}ms
- Respuesta Promedio: ${result.avgResponseTime}ms
- P95: ${result.p95ResponseTime}ms
- P99: ${result.p99ResponseTime}ms
- Throughput: ${result.throughput.toFixed(2)} req/s
- Tasa de Error: ${result.errorRate.toFixed(2)}%

CONFIGURACIÓN:
- Duración: ${test.duration}ms
- Concurrencia: ${test.concurrency}
    `
  }

  /**
   * Comparar tests
   */
  compareTests(testId1: string, testId2: string): string {
    const result1 = this.results.get(testId1)
    const result2 = this.results.get(testId2)

    if (!result1 || !result2) return 'Tests no encontrados'

    const improvement = ((result1.avgResponseTime - result2.avgResponseTime) / result1.avgResponseTime) * 100

    return `
=== COMPARACIÓN DE TESTS ===

Test 1 Respuesta Promedio: ${result1.avgResponseTime}ms
Test 2 Respuesta Promedio: ${result2.avgResponseTime}ms
Mejora: ${improvement > 0 ? `+${improvement.toFixed(2)}%` : `${improvement.toFixed(2)}%`}
    `
  }
}

let globalPerformanceTestingManager: PerformanceTestingManager | null = null

export function initializePerformanceTestingManager(): PerformanceTestingManager {
  if (!globalPerformanceTestingManager) {
    globalPerformanceTestingManager = new PerformanceTestingManager()
  }
  return globalPerformanceTestingManager
}

export function getPerformanceTestingManager(): PerformanceTestingManager {
  if (!globalPerformanceTestingManager) {
    return initializePerformanceTestingManager()
  }
  return globalPerformanceTestingManager
}
