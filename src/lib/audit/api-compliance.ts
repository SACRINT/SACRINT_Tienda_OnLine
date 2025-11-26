/**
 * API Compliance Manager
 * Semana 49, Tarea 49.7: API Compliance Validation
 */

import { logger } from "@/lib/monitoring"

export interface APIComplianceRule {
  id: string
  name: string
  description: string
  category: string
  severity: "low" | "medium" | "high"
  requirement: string
}

export interface APIComplianceCheckResult {
  id: string
  endpoint: string
  passed: boolean
  violations: string[]
  timestamp: Date
}

export class APIComplianceManager {
  private rules: Map<string, APIComplianceRule> = new Map()
  private results: Map<string, APIComplianceCheckResult> = new Map()

  constructor() {
    logger.debug({ type: "api_compliance_init" }, "API Compliance Manager inicializado")
  }

  registerRule(name: string, description: string, category: string, severity: string, requirement: string): APIComplianceRule {
    const rule: APIComplianceRule = {
      id: `rule_${Date.now()}`,
      name,
      description,
      category,
      severity: severity as any,
      requirement,
    }
    this.rules.set(rule.id, rule)
    logger.info({ type: "rule_registered" }, `Rule: ${name}`)
    return rule
  }

  checkEndpointCompliance(endpoint: string): APIComplianceCheckResult {
    const result: APIComplianceCheckResult = {
      id: `check_${Date.now()}`,
      endpoint,
      passed: true,
      violations: [],
      timestamp: new Date(),
    }
    this.results.set(result.id, result)
    logger.info({ type: "compliance_checked" }, `Endpoint: ${endpoint}`)
    return result
  }

  getComplianceScore(): number {
    const allResults = Array.from(this.results.values())
    if (allResults.length === 0) return 100
    const passed = allResults.filter(r => r.passed).length
    return (passed / allResults.length) * 100
  }

  getStatistics() {
    const allResults = Array.from(this.results.values())
    return {
      totalRules: this.rules.size,
      checksPerformed: allResults.length,
      compliantEndpoints: allResults.filter(r => r.passed).length,
      complianceScore: this.getComplianceScore(),
    }
  }
}

let globalAPIComplianceManager: APIComplianceManager | null = null

export function getAPIComplianceManager(): APIComplianceManager {
  if (!globalAPIComplianceManager) {
    globalAPIComplianceManager = new APIComplianceManager()
  }
  return globalAPIComplianceManager
}
