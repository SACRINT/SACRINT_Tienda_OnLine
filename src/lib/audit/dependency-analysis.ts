/**
 * Dependency Analysis Manager
 * Semana 49, Tarea 49.3: Dependency Analysis
 */

import { logger } from "@/lib/monitoring"

export interface Dependency {
  id: string
  name: string
  version: string
  latestVersion?: string
  vulnerabilities: number
  license: string
  outdated: boolean
}

export interface DependencyReport {
  id: string
  timestamp: Date
  dependencies: Dependency[]
  outdatedCount: number
  vulnerabilityCount: number
  licenseCompliance: boolean
}

export class DependencyAnalysisManager {
  private dependencies: Map<string, Dependency> = new Map()
  private reports: Map<string, DependencyReport> = new Map()

  constructor() {
    logger.debug({ type: "dependency_analysis_init" }, "Dependency Analysis Manager inicializado")
  }

  addDependency(name: string, version: string, latestVersion: string, vulnerabilities: number = 0, license: string = "MIT"): Dependency {
    const dep: Dependency = {
      id: `dep_${Date.now()}`,
      name,
      version,
      latestVersion,
      vulnerabilities,
      license,
      outdated: version \!== latestVersion,
    }
    this.dependencies.set(dep.id, dep)
    logger.info({ type: "dependency_added" }, `${name}@${version}`)
    return dep
  }

  generateDependencyReport(): DependencyReport {
    const allDeps = Array.from(this.dependencies.values())
    const outdatedCount = allDeps.filter(d => d.outdated).length
    const vulnCount = allDeps.reduce((sum, d) => sum + d.vulnerabilities, 0)

    const report: DependencyReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      dependencies: allDeps,
      outdatedCount,
      vulnerabilityCount: vulnCount,
      licenseCompliance: allDeps.every(d => ["MIT", "Apache-2.0", "BSD"].includes(d.license)),
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Outdated: ${outdatedCount}, Vulns: ${vulnCount}`)
    return report
  }

  getStatistics() {
    const allDeps = Array.from(this.dependencies.values())
    return {
      totalDependencies: allDeps.length,
      outdatedDependencies: allDeps.filter(d => d.outdated).length,
      vulnerabilities: allDeps.reduce((sum, d) => sum + d.vulnerabilities, 0),
    }
  }
}

let globalDependencyAnalysisManager: DependencyAnalysisManager | null = null

export function getDependencyAnalysisManager(): DependencyAnalysisManager {
  if (\!globalDependencyAnalysisManager) {
    globalDependencyAnalysisManager = new DependencyAnalysisManager()
  }
  return globalDependencyAnalysisManager
}
