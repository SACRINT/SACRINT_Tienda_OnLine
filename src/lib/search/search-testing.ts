/**
 * Search Integration Testing
 * Semana 39, Tarea 39.12: Search Integration Testing
 */

import { logger } from '@/lib/monitoring'

export interface SearchTestCase {
  id: string
  name: string
  query: string
  expectedMinResults: number
  expectedMaxResults?: number
  expectedProductIds?: string[]
  tags?: string[]
  createdAt: Date
}

export interface SearchTestResult {
  testCaseId: string
  passed: boolean
  actualResults: number
  expected: number
  duration: number
  foundProductIds?: string[]
  error?: string
  timestamp: Date
}

export class SearchIntegrationTester {
  private testCases: Map<string, SearchTestCase> = new Map()
  private testResults: Map<string, SearchTestResult[]> = new Map()

  constructor() {
    logger.debug({ type: 'search_testing_init' }, 'Search Integration Tester inicializado')
    this.createDefaultTests()
  }

  /**
   * Crear tests por defecto
   */
  private createDefaultTests(): void {
    const defaultTests: SearchTestCase[] = [
      {
        id: 'test_basic_search',
        name: 'Basic Product Search',
        query: 'laptop',
        expectedMinResults: 5,
        tags: ['smoke', 'basic'],
        createdAt: new Date(),
      },
      {
        id: 'test_category_filter',
        name: 'Category Filter',
        query: 'electronics',
        expectedMinResults: 10,
        tags: ['filter', 'category'],
        createdAt: new Date(),
      },
      {
        id: 'test_empty_results',
        name: 'No Results Query',
        query: 'xyzabc123notfound',
        expectedMinResults: 0,
        expectedMaxResults: 0,
        tags: ['edge-case'],
        createdAt: new Date(),
      },
      {
        id: 'test_special_characters',
        name: 'Special Characters Query',
        query: 'TV de 50"',
        expectedMinResults: 1,
        tags: ['special', 'edge-case'],
        createdAt: new Date(),
      },
    ]

    for (const test of defaultTests) {
      this.testCases.set(test.id, test)
    }
  }

  /**
   * Crear caso de test
   */
  createTestCase(testCase: SearchTestCase): void {
    this.testCases.set(testCase.id, testCase)
    logger.debug({ type: 'test_case_created', testId: testCase.id }, `Caso de test creado: ${testCase.name}`)
  }

  /**
   * Ejecutar test case
   */
  async runTestCase(testId: string, searchFunction: (query: string) => Promise<string[]>): Promise<SearchTestResult> {
    const testCase = this.testCases.get(testId)
    if (!testCase) throw new Error('Test case no encontrado')

    const startTime = Date.now()

    try {
      const results = await searchFunction(testCase.query)
      const duration = Date.now() - startTime

      let passed = results.length >= testCase.expectedMinResults

      if (testCase.expectedMaxResults !== undefined) {
        passed = passed && results.length <= testCase.expectedMaxResults
      }

      if (testCase.expectedProductIds) {
        passed = passed && testCase.expectedProductIds.every((id) => results.includes(id))
      }

      const result: SearchTestResult = {
        testCaseId: testId,
        passed,
        actualResults: results.length,
        expected: testCase.expectedMinResults,
        duration,
        foundProductIds: results,
        timestamp: new Date(),
      }

      this.recordTestResult(testId, result)

      logger.info(
        { type: 'test_executed', testId, passed, actualResults: results.length, expected: testCase.expectedMinResults },
        `Test ejecutado: ${testCase.name} - ${passed ? 'PASADO' : 'FALLIDO'}`,
      )

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      const result: SearchTestResult = {
        testCaseId: testId,
        passed: false,
        actualResults: 0,
        expected: testCase.expectedMinResults,
        duration,
        error: String(error),
        timestamp: new Date(),
      }

      this.recordTestResult(testId, result)

      logger.error(
        { type: 'test_error', testId, error: String(error) },
        `Test fallido: ${testCase.name}`,
      )

      return result
    }
  }

  /**
   * Ejecutar suite de tests
   */
  async runTestSuite(testIds: string[], searchFunction: (query: string) => Promise<string[]>): Promise<SearchTestResult[]> {
    const results: SearchTestResult[] = []

    logger.info({ type: 'test_suite_started', count: testIds.length }, `Suite de tests iniciada: ${testIds.length} tests`)

    for (const testId of testIds) {
      const result = await this.runTestCase(testId, searchFunction)
      results.push(result)
    }

    logger.info(
      { type: 'test_suite_completed', total: results.length, passed: results.filter((r) => r.passed).length },
      `Suite completada: ${results.filter((r) => r.passed).length}/${results.length} pasados`,
    )

    return results
  }

  /**
   * Registrar resultado de test
   */
  private recordTestResult(testId: string, result: SearchTestResult): void {
    if (!this.testResults.has(testId)) {
      this.testResults.set(testId, [])
    }

    this.testResults.get(testId)!.push(result)

    // Limitar historial a últimos 100 resultados por test
    const results = this.testResults.get(testId)!
    if (results.length > 100) {
      results.shift()
    }
  }

  /**
   * Obtener resultado de test
   */
  getTestResult(testId: string): SearchTestResult | null {
    const results = this.testResults.get(testId)
    return results && results.length > 0 ? results[results.length - 1] : null
  }

  /**
   * Obtener historial de test
   */
  getTestHistory(testId: string): SearchTestResult[] {
    return this.testResults.get(testId) || []
  }

  /**
   * Obtener test case
   */
  getTestCase(testId: string): SearchTestCase | null {
    return this.testCases.get(testId) || null
  }

  /**
   * Obtener todos los test cases
   */
  getAllTestCases(): SearchTestCase[] {
    return Array.from(this.testCases.values())
  }

  /**
   * Obtener test cases por tag
   */
  getTestCasesByTag(tag: string): SearchTestCase[] {
    return Array.from(this.testCases.values()).filter((tc) => tc.tags?.includes(tag))
  }

  /**
   * Generar reporte de tests
   */
  generateTestReport(testIds?: string[]): string {
    const tests = testIds ? testIds.map((id) => this.testCases.get(id)).filter((t): t is SearchTestCase => t !== null) : Array.from(this.testCases.values())

    let passed = 0
    let failed = 0

    const details = tests
      .map((test) => {
        const result = this.getTestResult(test.id)
        if (result) {
          if (result.passed) passed++
          else failed++

          return `
  ✓ ${test.name}
    Status: ${result.passed ? 'PASSED' : 'FAILED'}
    Results: ${result.actualResults} (expected: ${result.expected})
    Duration: ${result.duration}ms
    ${result.error ? `Error: ${result.error}` : ''}
          `
        }
        return `  • ${test.name} - No ejecutado`
      })
      .join('\n')

    let report = `
╔════════════════════════════════════════════════════════════╗
║           SEARCH INTEGRATION TEST REPORT
╚════════════════════════════════════════════════════════════╝

Total Tests: ${tests.length}
Passed: ${passed}
Failed: ${failed}
Pass Rate: ${tests.length > 0 ? ((passed / tests.length) * 100).toFixed(2) : 0}%

Test Results:
${details}

════════════════════════════════════════════════════════════
    `

    return report
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalTestCases: number; totalRuns: number; averagePassRate: number } {
    let totalRuns = 0
    let passedRuns = 0

    for (const results of this.testResults.values()) {
      totalRuns += results.length
      passedRuns += results.filter((r) => r.passed).length
    }

    return {
      totalTestCases: this.testCases.size,
      totalRuns,
      averagePassRate: totalRuns > 0 ? passedRuns / totalRuns : 0,
    }
  }
}

let globalSearchIntegrationTester: SearchIntegrationTester | null = null

export function initializeSearchIntegrationTester(): SearchIntegrationTester {
  if (!globalSearchIntegrationTester) {
    globalSearchIntegrationTester = new SearchIntegrationTester()
  }
  return globalSearchIntegrationTester
}

export function getSearchIntegrationTester(): SearchIntegrationTester {
  if (!globalSearchIntegrationTester) {
    return initializeSearchIntegrationTester()
  }
  return globalSearchIntegrationTester
}
