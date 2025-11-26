/**
 * Log Aggregation Manager
 * Semana 45, Tarea 45.2: Log Aggregation
 */

import { logger } from "@/lib/monitoring"

export interface LogEntry {
  id: string
  timestamp: Date
  level: "debug" | "info" | "warn" | "error"
  service: string
  message: string
  metadata?: Record<string, any>
  traceId?: string
}

export interface LogFilter {
  level?: string
  service?: string
  timeRange?: { start: Date; end: Date }
  keyword?: string
}

export class LogAggregationManager {
  private logs: Map<string, LogEntry> = new Map()
  private logIndex: Map<string, string[]> = new Map()

  constructor() {
    logger.debug({ type: "log_aggregation_init" }, "Log Aggregation Manager inicializado")
  }

  aggregateLog(entry: LogEntry): void {
    this.logs.set(entry.id, entry)
    const key = `${entry.service}:${entry.level}`
    if (!this.logIndex.has(key)) {
      this.logIndex.set(key, [])
    }
    this.logIndex.get(key)?.push(entry.id)
    logger.debug({ type: "log_aggregated" }, "Log agregado")
  }

  queryLogs(filter: LogFilter): LogEntry[] {
    return Array.from(this.logs.values()).filter(log => {
      if (filter.level && log.level !== filter.level) return false
      if (filter.service && log.service !== filter.service) return false
      if (filter.keyword && !log.message.includes(filter.keyword)) return false
      if (filter.timeRange) {
        if (log.timestamp < filter.timeRange.start || log.timestamp > filter.timeRange.end) {
          return false
        }
      }
      return true
    })
  }

  getLogsByService(service: string): LogEntry[] {
    return Array.from(this.logs.values()).filter(l => l.service === service)
  }

  getErrorLogs(limit: number = 100): LogEntry[] {
    return Array.from(this.logs.values())
      .filter(l => l.level === "error")
      .slice(-limit)
  }

  getStatistics() {
    return {
      totalLogs: this.logs.size,
      errorCount: Array.from(this.logs.values()).filter(l => l.level === "error").length,
      warningCount: Array.from(this.logs.values()).filter(l => l.level === "warn").length,
    }
  }
}

let globalLogAggregationManager: LogAggregationManager | null = null

export function getLogAggregationManager(): LogAggregationManager {
  if (!globalLogAggregationManager) {
    globalLogAggregationManager = new LogAggregationManager()
  }
  return globalLogAggregationManager
}
