/**
 * Admin Tools Testing & Optimization
 * Semana 40, Tarea 40.12: Admin Tools Testing & Optimization
 */

import { logger } from '@/lib/monitoring'

export interface AdminTestCase {
  id: string
  name: string
  description: string
  testFunction: () => Promise<boolean>
  expectedResult: boolean
  tags: string[]
}

export interface TestResult {
  testCaseId: string
  passed: boolean
  duration: number
  error?: string
  timestamp: Date
}

export class AdminToolsTester {
  private testCases: Map<string, AdminTestCase> = new Map()
  private results: TestResult[] = []

  constructor() {
    logger.debug({ type: 'admin_testing_init' }, 'Admin Tools Tester inicializado')
  }

  /**
   * Registrar test case
   */
  registerTestCase(testCase: AdminTestCase): void {
    this.testCases.set(testCase.id, testCase)
  }

  /**
   * Ejecutar test
   */
  async runTest(testCaseId: string): Promise<TestResult> {
    const testCase = this.testCases.get(testCaseId)
    if (!testCase) throw new Error('Test case no encontrado')

    const startTime = Date.now()

    try {
      const passed = await testCase.testFunction()

      const result: TestResult = {
        testCaseId,
        passed,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }

      this.results.push(result)
      logger.info({ type: 'test_executed', testCaseId, passed }, `Test: ${testCase.name} - ${passed ? 'PASÓ' : 'FALLÓ'}`)

      return result
    } catch (error) {
      const result: TestResult = {
        testCaseId,
        passed: false,
        duration: Date.now() - startTime,
        error: String(error),
        timestamp: new Date(),
      }

      this.results.push(result)
      return result
    }
  }

  /**
   * Ejecutar suite
   */
  async runSuite(testIds: string[]): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const testId of testIds) {
      const result = await this.runTest(testId)
      results.push(result)
    }

    return results
  }

  /**
   * Obtener resultados
   */
  getResults(limit: number = 50): TestResult[] {
    return this.results.slice(-limit)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { total: number; passed: number; failed: number; passRate: number; avgDuration: number } {
    if (this.results.length === 0) {
      return { total: 0, passed: 0, failed: 0, passRate: 0, avgDuration: 0 }
    }

    const passed = this.results.filter((r) => r.passed).length
    const failed = this.results.filter((r) => !r.passed).length
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length

    return {
      total: this.results.length,
      passed,
      failed,
      passRate: passed / this.results.length,
      avgDuration,
    }
  }
}

let globalAdminToolsTester: AdminToolsTester | null = null

export function initializeAdminToolsTester(): AdminToolsTester {
  if (!globalAdminToolsTester) {
    globalAdminToolsTester = new AdminToolsTester()
  }
  return globalAdminToolsTester
}

export function getAdminToolsTester(): AdminToolsTester {
  if (!globalAdminToolsTester) {
    return initializeAdminToolsTester()
  }
  return globalAdminToolsTester
}
