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

/**
 * Wrapper para ejecutar funciones con medición de tiempo
 * @param label Nombre de la operación a medir
 * @param fn Función a ejecutar
 * @returns Resultado de la función
 */
export async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    const manager = getQueryOptimizationManager();
    if (executionTime > 100) {
      // Reportar queries que tardan más de 100ms
      manager.detectSlowQuery(label, executionTime);
    }

    logger.debug(
      {
        type: "query_timing",
        label,
        executionTime: `${executionTime.toFixed(2)}ms`,
      },
      "Operación completada",
    );

    return result;
  } catch (error) {
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    logger.error(
      {
        type: "query_error",
        label,
        executionTime: `${executionTime.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error),
      },
      "Error en operación",
    );

    throw error;
  }
}
