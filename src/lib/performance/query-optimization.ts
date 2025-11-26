/**
 * Query Optimization
 * Semana 43, Tarea 43.2: Query Optimization
 */

import { logger } from "@/lib/monitoring";

export interface SlowQuery {
  id: string;
  query: string;
  executionTime: number;
}

export class QueryOptimizationManager {
  private slowQueries: Map<string, SlowQuery> = new Map();

  constructor() {
    logger.debug({ type: "query_optimization_init" }, "Manager inicializado");
  }

  detectSlowQuery(query: string, executionTime: number): SlowQuery | null {
    const id = "slow_" + Date.now();
    const slowQuery: SlowQuery = { id, query, executionTime };
    this.slowQueries.set(id, slowQuery);
    logger.warn({ type: "slow_query_detected" }, "Detectada");
    return slowQuery;
  }

  getStatistics() {
    return {
      totalSlowQueries: this.slowQueries.size,
    };
  }
}

let globalQueryOptimizationManager: QueryOptimizationManager | null = null;

export function getQueryOptimizationManager(): QueryOptimizationManager {
  if (!globalQueryOptimizationManager) {
    globalQueryOptimizationManager = new QueryOptimizationManager();
  }
  return globalQueryOptimizationManager;
}
