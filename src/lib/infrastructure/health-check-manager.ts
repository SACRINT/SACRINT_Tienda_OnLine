/**
 * Health Check Manager
 * Semana 46, Tarea 46.5: Health Check Manager
 */

import { logger } from "@/lib/monitoring"

export interface HealthCheckConfig {
  id: string
  serviceName: string
  interval: number
  timeout: number
  retries: number
  endpoint: string
}

export interface HealthCheckResult {
  checkId: string
  timestamp: Date
  status: "pass" | "fail" | "timeout"
  responseTime: number
  errorMessage?: string
}

export class HealthCheckManager {
  private configs: Map<string, HealthCheckConfig> = new Map()
  private results: Map<string, HealthCheckResult[]> = new Map()

  constructor() {
    logger.debug({ type: "health_check_init" }, "Health Check Manager inicializado")
  }

  registerHealthCheck(serviceName: string, interval: number, endpoint: string): HealthCheckConfig {
    const config: HealthCheckConfig = {
      id: `check_${Date.now()}`,
      serviceName,
      interval,
      timeout: 5000,
      retries: 3,
      endpoint,
    }
    this.configs.set(config.id, config)
    logger.info({ type: "health_check_registered" }, `Health check: ${serviceName}`)
    return config
  }

  executeHealthCheck(checkId: string): HealthCheckResult {
    const config = this.configs.get(checkId)
    if (!config) {
      return {
        checkId,
        timestamp: new Date(),
        status: "fail",
        responseTime: 0,
        errorMessage: "Config not found",
      }
    }

    const result: HealthCheckResult = {
      checkId,
      timestamp: new Date(),
      status: "pass",
      responseTime: Math.random() * 100,
    }

    if (!this.results.has(checkId)) {
      this.results.set(checkId, [])
    }
    this.results.get(checkId)?.push(result)

    logger.debug({ type: "check_executed" }, `Check ejecutado: ${result.status}`)
    return result
  }

  getCheckResults(checkId: string, limit: number = 100): HealthCheckResult[] {
    return (this.results.get(checkId) || []).slice(-limit)
  }

  getStatistics() {
    return {
      totalChecks: this.configs.size,
      totalResults: Array.from(this.results.values()).reduce((sum, r) => sum + r.length, 0),
    }
  }
}

let globalHealthCheckManager: HealthCheckManager | null = null

export function getHealthCheckManager(): HealthCheckManager {
  if (!globalHealthCheckManager) {
    globalHealthCheckManager = new HealthCheckManager()
  }
  return globalHealthCheckManager
}
