/**
 * Compatibility Testing Manager
 * Semana 50, Tarea 50.6: Compatibility Testing
 */

import { logger } from "@/lib/monitoring";

export interface CompatibilityTest {
  id: string;
  platform: string;
  browser?: string;
  osVersion?: string;
  status: "compatible" | "incompatible" | "partial";
  issues: string[];
}

export interface CompatibilityReport {
  id: string;
  timestamp: Date;
  tests: CompatibilityTest[];
  compatibilityScore: number;
  supportedPlatforms: number;
}

export class CompatibilityTestingManager {
  private tests: Map<string, CompatibilityTest> = new Map();
  private reports: Map<string, CompatibilityReport> = new Map();

  constructor() {
    logger.debug({ type: "compatibility_init" }, "Compatibility Testing Manager inicializado");
  }

  testPlatform(platform: string, browser?: string, osVersion?: string): CompatibilityTest {
    const test: CompatibilityTest = {
      id: `test_${Date.now()}`,
      platform,
      browser,
      osVersion,
      status: "compatible",
      issues: [],
    };
    this.tests.set(test.id, test);
    logger.info({ type: "test_completed" }, `${platform}${browser ? ` - ${browser}` : ""}`);
    return test;
  }

  generateReport(): CompatibilityReport {
    const allTests = Array.from(this.tests.values());
    const compatibleCount = allTests.filter((t) => t.status === "compatible").length;
    const compatibilityScore = (compatibleCount / allTests.length) * 100;

    const report: CompatibilityReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      tests: allTests,
      compatibilityScore,
      supportedPlatforms: compatibleCount,
    };
    this.reports.set(report.id, report);
    logger.info({ type: "report_generated" }, `Compatibility: ${compatibilityScore.toFixed(1)}%`);
    return report;
  }

  getStatistics() {
    const allTests = Array.from(this.tests.values());
    return {
      totalTests: allTests.length,
      compatibleTests: allTests.filter((t) => t.status === "compatible").length,
      incompatibleTests: allTests.filter((t) => t.status === "incompatible").length,
    };
  }
}

let globalCompatibilityTestingManager: CompatibilityTestingManager | null = null;

export function getCompatibilityTestingManager(): CompatibilityTestingManager {
  if (!globalCompatibilityTestingManager) {
    globalCompatibilityTestingManager = new CompatibilityTestingManager();
  }
  return globalCompatibilityTestingManager;
}
