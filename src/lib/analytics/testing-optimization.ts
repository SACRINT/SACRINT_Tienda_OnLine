/**
 * Analytics Testing & Performance Optimization
 * Semana 33, Tarea 33.12: Testing y optimización de performance
 */

import { logger } from '@/lib/monitoring'

export interface PerformanceBenchmark {
  moduleName: string
  operation: string
  avgExecutionTime: number
  maxExecutionTime: number
  minExecutionTime: number
  samplesCount: number
  timestamp: Date
}

export interface LoadTestResult {
  moduleName: string
  concurrentUsers: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  memoryUsedMB: number
}

export interface QueryOptimization {
  moduleName: string
  originalTime: number
  optimizedTime: number
  improvement: number
  query: string
  optimizationStrategy: string
}

export interface TestCoverage {
  moduleName: string
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  coverage: number // porcentaje
  criticalFunctionsCovered: boolean
}

export class AnalyticsPerformanceOptimizer {
  private benchmarks: Map<string, PerformanceBenchmark[]> = new Map()
  private loadTestResults: Map<string, LoadTestResult[]> = new Map()
  private queryOptimizations: QueryOptimization[] = []
  private testCoverage: Map<string, TestCoverage> = new Map()

  constructor() {
    logger.debug({ type: 'analytics_optimizer_init' }, 'Analytics Performance Optimizer inicializado')
  }

  // ==================== Benchmarking ====================

  recordBenchmark(
    moduleName: string,
    operation: string,
    executionTime: number,
  ): void {
    const benchmarks = this.benchmarks.get(moduleName) || []
    const existing = benchmarks.find((b) => b.operation === operation)

    if (existing) {
      existing.avgExecutionTime =
        (existing.avgExecutionTime * existing.samplesCount + executionTime) /
        (existing.samplesCount + 1)
      existing.maxExecutionTime = Math.max(existing.maxExecutionTime, executionTime)
      existing.minExecutionTime = Math.min(existing.minExecutionTime, executionTime)
      existing.samplesCount += 1
      existing.timestamp = new Date()
    } else {
      benchmarks.push({
        moduleName,
        operation,
        avgExecutionTime: executionTime,
        maxExecutionTime: executionTime,
        minExecutionTime: executionTime,
        samplesCount: 1,
        timestamp: new Date(),
      })
    }

    this.benchmarks.set(moduleName, benchmarks)
  }

  getBenchmarkReport(moduleName?: string): PerformanceBenchmark[] {
    if (moduleName) {
      return this.benchmarks.get(moduleName) || []
    }

    const allBenchmarks: PerformanceBenchmark[] = []
    this.benchmarks.forEach((benchmarks) => {
      allBenchmarks.push(...benchmarks)
    })
    return allBenchmarks
  }

  // ==================== Load Testing ====================

  recordLoadTestResult(result: LoadTestResult): void {
    const results = this.loadTestResults.get(result.moduleName) || []
    results.push(result)
    this.loadTestResults.set(result.moduleName, results)

    logger.info(
      { type: 'load_test_completed', module: result.moduleName, users: result.concurrentUsers },
      `Load test completado: ${result.successfulRequests}/${result.totalRequests} exitosos`,
    )
  }

  simulateLoadTest(
    moduleName: string,
    concurrentUsers: number,
    requestsPerUser: number,
  ): LoadTestResult {
    // Simular test de carga
    const totalRequests = concurrentUsers * requestsPerUser
    const failureRate = 0.02 // 2% de fallos esperado

    const failedRequests = Math.floor(totalRequests * failureRate)
    const successfulRequests = totalRequests - failedRequests

    // Tiempos simulados (en ms)
    const avgResponseTime = 50 + Math.random() * 100
    const p95ResponseTime = avgResponseTime * 1.95
    const p99ResponseTime = avgResponseTime * 2.99

    return {
      moduleName,
      concurrentUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      memoryUsedMB: 100 + concurrentUsers * 0.5,
    }
  }

  getLoadTestResults(moduleName: string): LoadTestResult[] {
    return this.loadTestResults.get(moduleName) || []
  }

  // ==================== Query Optimization ====================

  recordQueryOptimization(optimization: QueryOptimization): void {
    this.queryOptimizations.push(optimization)

    const improvement = ((optimization.originalTime - optimization.optimizedTime) / optimization.originalTime) * 100

    logger.info(
      { type: 'query_optimized', module: optimization.moduleName, improvement: `${improvement.toFixed(2)}%` },
      `Query optimizada con mejora de ${improvement.toFixed(2)}%`,
    )
  }

  getOptimizationReport(): QueryOptimization[] {
    return this.queryOptimizations.sort((a, b) => b.improvement - a.improvement)
  }

  getTotalImprovement(): number {
    if (this.queryOptimizations.length === 0) return 0
    const totalImprovement = this.queryOptimizations.reduce((sum, opt) => sum + opt.improvement, 0)
    return totalImprovement / this.queryOptimizations.length
  }

  // ==================== Test Coverage ====================

  recordTestCoverage(coverage: TestCoverage): void {
    this.testCoverage.set(coverage.moduleName, coverage)
  }

  getTestCoverageReport(): TestCoverage[] {
    return Array.from(this.testCoverage.values())
  }

  getOverallCoverage(): number {
    const coverages = Array.from(this.testCoverage.values())
    if (coverages.length === 0) return 0
    const totalCoverage = coverages.reduce((sum, c) => sum + c.coverage, 0)
    return totalCoverage / coverages.length
  }

  // ==================== Health Checks ====================

  generateHealthReport(): {
    overallHealth: 'excellent' | 'good' | 'warning' | 'critical'
    performanceScore: number
    testingScore: number
    recommendations: string[]
  } {
    const recommendations: string[] = []
    let performanceScore = 100
    let testingScore = 100

    // Check benchmarks
    const benchmarks = this.getBenchmarkReport()
    benchmarks.forEach((b) => {
      if (b.avgExecutionTime > 1000) {
        performanceScore -= 10
        recommendations.push(`${b.moduleName}.${b.operation} tarda ${b.avgExecutionTime}ms`)
      }
    })

    // Check load test results
    const allLoadTests = Array.from(this.loadTestResults.values()).flat()
    allLoadTests.forEach((result) => {
      const failureRate = result.failedRequests / result.totalRequests
      if (failureRate > 0.05) {
        performanceScore -= 15
        recommendations.push(`${result.moduleName} tiene tasa de fallo de ${(failureRate * 100).toFixed(2)}%`)
      }
      if (result.memoryUsedMB > 500) {
        performanceScore -= 10
        recommendations.push(`${result.moduleName} usa ${result.memoryUsedMB.toFixed(2)}MB`)
      }
    })

    // Check test coverage
    const coverage = this.getOverallCoverage()
    if (coverage < 80) {
      testingScore -= (80 - coverage) * 0.5
      recommendations.push(`Cobertura de tests en ${coverage.toFixed(2)}%, objetivo: 80%+`)
    }

    const coverageReport = this.getTestCoverageReport()
    coverageReport.forEach((c) => {
      if (!c.criticalFunctionsCovered) {
        testingScore -= 20
        recommendations.push(`${c.moduleName} no cubre funciones críticas`)
      }
    })

    // Determine overall health
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent'
    const avgScore = (performanceScore + testingScore) / 2

    if (avgScore < 50) overallHealth = 'critical'
    else if (avgScore < 70) overallHealth = 'warning'
    else if (avgScore < 90) overallHealth = 'good'

    return {
      overallHealth,
      performanceScore: Math.max(0, performanceScore),
      testingScore: Math.max(0, testingScore),
      recommendations,
    }
  }

  // ==================== Optimization Strategies ====================

  getOptimizationStrategies(): Record<string, string[]> {
    return {
      caching: [
        'Implementar Redis para caché de dashboards',
        'Caché de resultados de agregaciones por 5 minutos',
        'Caché local del navegador para widgets estáticos',
      ],
      database: [
        'Agregar índices en fields de filtro frecuente',
        'Denormalizar datos para queries de lectura',
        'Usar vistas materializadas para reportes complejos',
        'Particionamiento de tablas por tenantId',
      ],
      application: [
        'Lazy loading de widgets no visibles',
        'Paginación de resultados grandes',
        'Streaming de datos para reportes en tiempo real',
        'Web Workers para cálculos pesados',
      ],
      infrastructure: [
        'CDN para assets estáticos',
        'Compression gzip/brotli en respuestas API',
        'Connection pooling en database',
      ],
    }
  }

  // ==================== Recommendations ====================

  generateOptimizationRecommendations(): string[] {
    const health = this.generateHealthReport()
    const recommendations = [...health.recommendations]

    if (health.performanceScore < 80) {
      recommendations.push('Ejecutar perfilado de código para identificar hot spots')
      recommendations.push('Considerar implementar message queues para operaciones asíncronas')
    }

    if (health.testingScore < 80) {
      recommendations.push('Aumentar cobertura de tests unitarios')
      recommendations.push('Agregar tests de integración para flujos críticos')
      recommendations.push('Implementar tests de carga periódicos')
    }

    return recommendations
  }
}

let globalOptimizer: AnalyticsPerformanceOptimizer | null = null

export function initializeAnalyticsOptimizer(): AnalyticsPerformanceOptimizer {
  if (!globalOptimizer) {
    globalOptimizer = new AnalyticsPerformanceOptimizer()
  }
  return globalOptimizer
}

export function getAnalyticsOptimizer(): AnalyticsPerformanceOptimizer {
  if (!globalOptimizer) {
    return initializeAnalyticsOptimizer()
  }
  return globalOptimizer
}
