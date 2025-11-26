/**
 * Type Safety Validator Manager
 * Semana 49, Tarea 49.5: Type Safety Validation
 */

import { logger } from "@/lib/monitoring"

export interface TypeIssue {
  id: string
  file: string
  line: number
  column: number
  message: string
  severity: "error" | "warning"
}

export interface TypeValidationReport {
  id: string
  timestamp: Date
  issues: TypeIssue[]
  errors: number
  warnings: number
  strictMode: boolean
}

export class TypeSafetyValidatorManager {
  private issues: Map<string, TypeIssue> = new Map()
  private reports: Map<string, TypeValidationReport> = new Map()

  constructor() {
    logger.debug({ type: "type_safety_init" }, "Type Safety Validator Manager inicializado")
  }

  reportTypeIssue(file: string, line: number, column: number, message: string, severity: string = "warning"): TypeIssue {
    const issue: TypeIssue = {
      id: `issue_${Date.now()}`,
      file,
      line,
      column,
      message,
      severity: severity as any,
    }
    this.issues.set(issue.id, issue)
    logger.warn({ type: "type_issue", severity }, `${file}:${line}`)
    return issue
  }

  validateTypes(strictMode: boolean = true): TypeValidationReport {
    const allIssues = Array.from(this.issues.values())
    const errorCount = allIssues.filter(i => i.severity === "error").length
    const warningCount = allIssues.filter(i => i.severity === "warning").length

    const report: TypeValidationReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      issues: allIssues,
      errors: errorCount,
      warnings: warningCount,
      strictMode,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "validation_complete" }, `Errors: ${errorCount}, Warnings: ${warningCount}`)
    return report
  }

  getStatistics() {
    const allIssues = Array.from(this.issues.values())
    return {
      totalIssues: allIssues.length,
      errors: allIssues.filter(i => i.severity === "error").length,
      warnings: allIssues.filter(i => i.severity === "warning").length,
    }
  }
}

let globalTypeSafetyManager: TypeSafetyValidatorManager | null = null

export function getTypeSafetyValidatorManager(): TypeSafetyValidatorManager {
  if (!globalTypeSafetyManager) {
    globalTypeSafetyManager = new TypeSafetyValidatorManager()
  }
  return globalTypeSafetyManager
}
