/**
 * Database Analytics Manager
 * Semana 44, Tarea 44.9: Database Analytics
 */

import { logger } from "@/lib/monitoring";

export interface QueryAnalysis {
  query: string;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
}

export interface TableStatistics {
  tableName: string;
  rowCount: number;
  indexCount: number;
  sizeBytes: number;
  lastAnalyzedAt: Date;
}

export class DatabaseAnalyticsManager {
  private queryAnalysis: Map<string, QueryAnalysis> = new Map();
  private tableStats: Map<string, TableStatistics> = new Map();

  constructor() {
    logger.debug({ type: "analytics_init" }, "Manager inicializado");
  }

  recordQueryExecution(query: string, executionTime: number): void {
    const hash = Buffer.from(query).toString("base64").substring(0, 50);
    const existing = this.queryAnalysis.get(hash);

    if (existing) {
      existing.executionCount++;
      existing.totalExecutionTime += executionTime;
      existing.averageExecutionTime = existing.totalExecutionTime / existing.executionCount;
      existing.maxExecutionTime = Math.max(existing.maxExecutionTime, executionTime);
      existing.minExecutionTime = Math.min(existing.minExecutionTime, executionTime);
    } else {
      this.queryAnalysis.set(hash, {
        query,
        executionCount: 1,
        totalExecutionTime: executionTime,
        averageExecutionTime: executionTime,
        maxExecutionTime: executionTime,
        minExecutionTime: executionTime,
      });
    }
    logger.debug({ type: "query_execution_recorded" }, "Ejecucion registrada");
  }

  analyzeTable(tableName: string): TableStatistics {
    const stats: TableStatistics = {
      tableName,
      rowCount: 0,
      indexCount: 0,
      sizeBytes: 0,
      lastAnalyzedAt: new Date(),
    };
    this.tableStats.set(tableName, stats);
    logger.info({ type: "table_analyzed" }, `Tabla ${tableName} analizada`);
    return stats;
  }

  getTopQueries(limit: number = 10): QueryAnalysis[] {
    return Array.from(this.queryAnalysis.values())
      .sort((a, b) => b.totalExecutionTime - a.totalExecutionTime)
      .slice(0, limit);
  }

  getTableStatistics(tableName: string): TableStatistics | null {
    return this.tableStats.get(tableName) || null;
  }
}

let globalAnalyticsManager: DatabaseAnalyticsManager | null = null;

export function getDatabaseAnalyticsManager(): DatabaseAnalyticsManager {
  if (!globalAnalyticsManager) {
    globalAnalyticsManager = new DatabaseAnalyticsManager();
  }
  return globalAnalyticsManager;
}
