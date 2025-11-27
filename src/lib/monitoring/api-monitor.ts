/**
 * API Response Time Monitoring
 * Semana 31, Tarea 31.5: Monitoreo de tiempos de respuesta de APIs
 */

import { logger } from "./logger";
import { addBreadcrumb } from "./sentry";

/**
 * Información de respuesta de API
 */
export interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Estadísticas agregadas por endpoint
 */
export interface EndpointStats {
  endpoint: string;
  method: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
}

/**
 * Monitor de APIs
 */
export class APIMonitor {
  private metrics: APIMetrics[] = [];
  private maxHistorySize = 10000;
  private thresholds = {
    warning: 1000, // ms
    critical: 5000, // ms
  };

  constructor(thresholds?: { warning?: number; critical?: number }) {
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds };
    }
  }

  /**
   * Registrar una llamada a API
   */
  recordAPI(metric: APIMetrics): void {
    this.metrics.push(metric);

    // Mantener límite de tamaño
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics.shift();
    }

    // Determinar nivel de log
    let level: "debug" | "warn" | "error" = "debug";
    let message = `API: ${metric.method} ${metric.endpoint} - ${metric.statusCode} (${metric.responseTime}ms)`;

    if (!metric.success) {
      level = "error";
      message += ` - ERROR: ${metric.errorMessage}`;
    } else if (metric.responseTime > this.thresholds.critical) {
      level = "warn";
      message += " - CRITICAL LATENCY";
    } else if (metric.responseTime > this.thresholds.warning) {
      level = "warn";
      message += " - HIGH LATENCY";
    }

    logger[level](
      {
        type: "api_request",
        endpoint: metric.endpoint,
        method: metric.method,
        statusCode: metric.statusCode,
        responseTime: metric.responseTime,
        success: metric.success,
        error: metric.errorMessage,
      },
      message,
    );

    // Registrar en Sentry si es lento o error
    if (metric.responseTime > this.thresholds.warning || !metric.success) {
      addBreadcrumb(`${metric.method} ${metric.endpoint}`, {
        category: "api",
        level: metric.success ? "warning" : "error",
        statusCode: metric.statusCode,
        responseTime: metric.responseTime,
        error: metric.errorMessage,
      });
    }
  }

  /**
   * Calcular percentiles
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Obtener estadísticas para un endpoint
   */
  getEndpointStats(endpoint: string, method?: string): EndpointStats | null {
    const filtered = this.metrics.filter(
      (m) => m.endpoint === endpoint && (!method || m.method === method),
    );

    if (filtered.length === 0) {
      return null;
    }

    const responseTimes = filtered.map((m) => m.responseTime);
    const successCount = filtered.filter((m) => m.success).length;
    const errorCount = filtered.length - successCount;

    return {
      endpoint,
      method: method || "ALL",
      totalRequests: filtered.length,
      successCount,
      errorCount,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / filtered.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p50: this.calculatePercentile(responseTimes, 50),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99),
      errorRate: (errorCount / filtered.length) * 100,
    };
  }

  /**
   * Obtener todas las estadísticas de endpoints únicos
   */
  getAllEndpointStats(): EndpointStats[] {
    const endpoints = new Map<string, APIMetrics[]>();

    // Agrupar por endpoint + método
    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpoints.has(key)) {
        endpoints.set(key, []);
      }
      endpoints.get(key)!.push(metric);
    }

    // Generar estadísticas
    const stats: EndpointStats[] = [];
    for (const [key, metrics] of endpoints) {
      const [method, endpoint] = key.split(" ");
      const responseTimes = metrics.map((m) => m.responseTime);
      const successCount = metrics.filter((m) => m.success).length;
      const errorCount = metrics.length - successCount;

      stats.push({
        endpoint,
        method,
        totalRequests: metrics.length,
        successCount,
        errorCount,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / metrics.length,
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        p50: this.calculatePercentile(responseTimes, 50),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99),
        errorRate: (errorCount / metrics.length) * 100,
      });
    }

    return stats.sort((a, b) => b.averageResponseTime - a.averageResponseTime);
  }

  /**
   * Obtener endpoints lentos
   */
  getSlowEndpoints(threshold: number = 1000, limit: number = 10): EndpointStats[] {
    return this.getAllEndpointStats()
      .filter((s) => s.averageResponseTime > threshold)
      .slice(0, limit);
  }

  /**
   * Obtener endpoints con errores
   */
  getEndpointsWithErrors(limit: number = 10): EndpointStats[] {
    return this.getAllEndpointStats()
      .filter((s) => s.errorCount > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  /**
   * Generar reporte
   */
  generateReport(): string {
    const allStats = this.getAllEndpointStats();

    let report = "API Response Time Monitoring Report\n";
    report += "====================================\n\n";

    report += `Total API Calls: ${this.metrics.length}\n\n`;

    if (allStats.length === 0) {
      report += "No API calls recorded.\n";
      return report;
    }

    report += "Top 10 Slowest Endpoints:\n";
    for (const stats of allStats.slice(0, 10)) {
      report += `  ${stats.method} ${stats.endpoint}\n`;
      report += `    Avg: ${stats.averageResponseTime.toFixed(2)}ms (p95: ${stats.p95.toFixed(2)}ms, p99: ${stats.p99.toFixed(2)}ms)\n`;
      report += `    Success Rate: ${(100 - stats.errorRate).toFixed(2)}%\n`;
    }

    report += "\nEndpoints with Errors:\n";
    const errorEndpoints = this.getEndpointsWithErrors(5);
    if (errorEndpoints.length === 0) {
      report += "  None!\n";
    } else {
      for (const stats of errorEndpoints) {
        report += `  ${stats.method} ${stats.endpoint}: ${stats.errorCount} errors (${stats.errorRate.toFixed(2)}%)\n`;
      }
    }

    return report;
  }

  /**
   * Limpiar historial
   */
  clear(): void {
    this.metrics = [];
    logger.debug({ type: "api_monitor_cleared" }, "API monitor historial limpiado");
  }
}

/**
 * Instancia global
 */
let globalMonitor: APIMonitor | null = null;

/**
 * Inicializar monitor globalmente
 */
export function initializeAPIMonitor(thresholds?: {
  warning?: number;
  critical?: number;
}): APIMonitor {
  if (!globalMonitor) {
    globalMonitor = new APIMonitor(thresholds);
  }
  return globalMonitor;
}

/**
 * Obtener monitor global
 */
export function getAPIMonitor(): APIMonitor {
  if (!globalMonitor) {
    return initializeAPIMonitor();
  }
  return globalMonitor;
}

/**
 * Middleware para Next.js API routes
 * Usar en un middleware global o en route groups
 */
export function apiMonitoringMiddleware(handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    const monitor = getAPIMonitor();

    // Interceptar res.status()
    const originalStatus = res.status;
    let statusCode = 200;

    res.status = function (code: number) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    try {
      await handler(req, res);

      const responseTime = Date.now() - startTime;

      monitor.recordAPI({
        endpoint: req.url,
        method: req.method,
        statusCode,
        responseTime,
        timestamp: Date.now(),
        success: statusCode < 400,
        userAgent: req.headers["user-agent"],
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      monitor.recordAPI({
        endpoint: req.url,
        method: req.method,
        statusCode: statusCode,
        responseTime,
        timestamp: Date.now(),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        userAgent: req.headers["user-agent"],
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      });

      throw error;
    }
  };
}

/**
 * Utilidades de acceso
 */
export function getSlowEndpoints(threshold?: number, limit?: number) {
  return getAPIMonitor().getSlowEndpoints(threshold, limit);
}

export function getEndpointsWithErrors(limit?: number) {
  return getAPIMonitor().getEndpointsWithErrors(limit);
}

export function getAllEndpointStats() {
  return getAPIMonitor().getAllEndpointStats();
}
