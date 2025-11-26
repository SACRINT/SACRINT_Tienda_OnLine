/**
 * User Acceptance Testing Manager
 * Semana 50, Tarea 50.11: User Acceptance Testing
 */

import { logger } from "@/lib/monitoring"

export interface UATTest {
  id: string
  testCase: string
  tester: string
  status: "passed" | "failed" | "pending"
  feedback: string
  timestamp: Date
}

export interface UATReport {
  id: string
  timestamp: Date
  tests: UATTest[]
  passedTests: number
  acceptanceRate: number
  approved: boolean
}

export class UserAcceptanceTestingManager {
  private tests: Map<string, UATTest> = new Map()
  private reports: Map<string, UATReport> = new Map()

  constructor() {
    logger.debug({ type: "uat_init" }, "User Acceptance Testing Manager inicializado")
  }

  submitTest(testCase: string, tester: string, status: string, feedback: string = ""): UATTest {
    const test: UATTest = {
      id: `test_${Date.now()}`,
      testCase,
      tester,
      status: status as any,
      feedback,
      timestamp: new Date(),
    }
    this.tests.set(test.id, test)
    logger.info({ type: "test_submitted" }, `${testCase}: ${status}`)
    return test
  }

  generateUATReport(): UATReport {
    const allTests = Array.from(this.tests.values())
    const passedCount = allTests.filter(t => t.status === "passed").length
    const acceptanceRate = (passedCount / allTests.length) * 100

    const report: UATReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      tests: allTests,
      passedTests: passedCount,
      acceptanceRate,
      approved: acceptanceRate >= 90,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `UAT Acceptance Rate: ${acceptanceRate.toFixed(1)}%`)
    return report
  }

  getStatistics() {
    const allTests = Array.from(this.tests.values())
    return {
      totalTests: allTests.length,
      passedTests: allTests.filter(t => t.status === "passed").length,
      failedTests: allTests.filter(t => t.status === "failed").length,
    }
  }
}

let globalUATManager: UserAcceptanceTestingManager | null = null

export function getUserAcceptanceTestingManager(): UserAcceptanceTestingManager {
  if (\!globalUATManager) {
    globalUATManager = new UserAcceptanceTestingManager()
  }
  return globalUATManager
}
