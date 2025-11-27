/**
 * Error Rate Monitoring
 * Semana 31, Tarea 31.6: Monitoreo de tasa de errores y análisis de patrones
 */

import { logger } from "./logger";
import { captureException, addBreadcrumb } from "./sentry";

/**
 * Información de error registrado
 */
export interface ErrorRecord {
  id: string;
  error: Error | string;
  message: string;
  timestamp: number;
  source: "client" | "server" | "api";
  endpoint?: string;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Estadísticas de errores
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsBySource: Record<string, number>;
  errorRate: number; // % en los últimos X minutos
  criticalErrors: number;
  recentErrors: ErrorRecord[];
}

/**
 * Thresholds for error monitoring
 */
export interface ErrorMonitorThresholds {
  criticalErrorRate: number;
  highErrorRate: number;
  errorRateWindow: number;
}

/**
 * Monitor de tasa de errores
 */
export class ErrorRateMonitor {
  private errors: ErrorRecord[] = [];
  private errorCounts: Map<string, number> = new Map(); // Por tipo
  private severityCounts: Map<string, number> = new Map();
  private sourceCounts: Map<string, number> = new Map();
  private maxHistorySize = 5000;
  private thresholds: ErrorMonitorThresholds = {
    criticalErrorRate: 5, // % de errores críticos
    highErrorRate: 10, // % general
    errorRateWindow: 5 * 60 * 1000, // 5 minutos
  };

  constructor(thresholds?: Partial<ErrorMonitorThresholds>) {
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds };
    }
  }

  /**
   * Registrar un error
   */
  recordError(record: ErrorRecord): void {
    // Generar ID único
    record.id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Agregar al historial
    this.errors.push(record);

    // Mantener límite de tamaño
    if (this.errors.length > this.maxHistorySize) {
      this.errors.shift();
    }

    // Actualizar contadores
    const errorType = record.message.split(":")[0];
    this.errorCounts.set(errorType, (this.errorCounts.get(errorType) || 0) + 1);
    this.severityCounts.set(record.severity, (this.severityCounts.get(record.severity) || 0) + 1);
    this.sourceCounts.set(record.source, (this.sourceCounts.get(record.source) || 0) + 1);

    // Loguear
    logger[record.severity === "critical" ? "error" : record.severity === "high" ? "warn" : "info"](
      {
        type: "error_recorded",
        id: record.id,
        message: record.message,
        source: record.source,
        severity: record.severity,
        endpoint: record.endpoint,
        userId: record.userId,
        stackTrace: record.stackTrace,
      },
      `Error [${record.severity.toUpperCase()}]: ${record.message}`,
    );

    // Registrar en Sentry
    if (record.severity === "critical" || record.severity === "high") {
      if (record.error instanceof Error) {
        captureException(record.error);
      } else {
        captureException(new Error(String(record.error)));
      }
    }

    // Agregar breadcrumb para errores críticos
    if (record.severity === "critical") {
      addBreadcrumb(record.message, {
        category: "error",
        level: "error",
        errorId: record.id,
        source: record.source,
        userId: record.userId,
      });
    }
  }

  /**
   * Calcular tasa de errores en ventana de tiempo
   */
  private calculateErrorRate(windowMs: number = this.thresholds.errorRateWindow): number {
    const now = Date.now();
    const recentErrors = this.errors.filter((e) => now - e.timestamp < windowMs).length;

    if (recentErrors === 0) return 0;

    // Estimar total de operaciones basado en sample rate
    // Si asumimos que el 5% de operaciones genera error
    const estimatedTotal = this.errors.length;
    return (recentErrors / estimatedTotal) * 100;
  }

  /**
   * Obtener errores recientes
   */
  getRecentErrors(limit: number = 50): ErrorRecord[] {
    return this.errors.slice(-limit).reverse();
  }

  /**
   * Obtener errores críticos no resueltos
   */
  getCriticalErrors(): ErrorRecord[] {
    return this.errors.filter((e) => e.severity === "critical").slice(-20);
  }

  /**
   * Obtener errores por tipo
   */
  getErrorsByType(): { type: string; count: number }[] {
    const result = Array.from(this.errorCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    return result;
  }

  /**
   * Detectar patrones de error (mismo error múltiples veces)
   */
  detectErrorPatterns(threshold: number = 5): {
    pattern: string;
    count: number;
    lastSeen: number;
  }[] {
    const patterns = new Map<string, { count: number; lastSeen: number }>();

    for (const error of this.errors) {
      const pattern = error.message.split("\n")[0]; // Primera línea
      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, lastSeen: 0 });
      }

      const data = patterns.get(pattern)!;
      data.count += 1;
      data.lastSeen = Math.max(data.lastSeen, error.timestamp);
    }

    return Array.from(patterns.entries())
      .filter(([_, data]) => data.count >= threshold)
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Obtener estadísticas
   */
  getStats(): ErrorStats {
    const now = Date.now();
    const recentErrors = this.errors.filter(
      (e) => now - e.timestamp < this.thresholds.errorRateWindow,
    );

    return {
      totalErrors: this.errors.length,
      errorsByType: Object.fromEntries(this.errorCounts),
      errorsBySeverity: Object.fromEntries(this.severityCounts),
      errorsBySource: Object.fromEntries(this.sourceCounts),
      errorRate: this.calculateErrorRate(),
      criticalErrors: this.severityCounts.get("critical") || 0,
      recentErrors: recentErrors.slice(-20).reverse(),
    };
  }

  /**
   * Generar reporte
   */
  generateReport(): string {
    const stats = this.getStats();
    const patterns = this.detectErrorPatterns();
    const errorRate = this.calculateErrorRate();

    let report = "Error Rate Monitoring Report\n";
    report += "=============================\n\n";

    report += `Total Errors: ${stats.totalErrors}\n`;
    report += `Error Rate (5min window): ${errorRate.toFixed(2)}%\n`;
    report += `Critical Errors: ${stats.criticalErrors}\n\n`;

    report += "Errors by Severity:\n";
    for (const [severity, count] of Object.entries(stats.errorsBySeverity)) {
      report += `  ${severity.toUpperCase()}: ${count}\n`;
    }

    report += "\nErrors by Source:\n";
    for (const [source, count] of Object.entries(stats.errorsBySource)) {
      report += `  ${source.toUpperCase()}: ${count}\n`;
    }

    if (patterns.length > 0) {
      report += "\nTop Error Patterns:\n";
      for (const pattern of patterns.slice(0, 10)) {
        report += `  [${pattern.count}x] ${pattern.pattern.substring(0, 80)}\n`;
      }
    }

    if (stats.recentErrors.length > 0) {
      report += "\nRecent Errors:\n";
      for (const error of stats.recentErrors.slice(0, 5)) {
        report += `  [${error.severity.toUpperCase()}] ${error.message} (${new Date(error.timestamp).toLocaleTimeString()})\n`;
      }
    }

    return report;
  }

  /**
   * Verificar si tasa de errores es crítica
   */
  isCriticalErrorRate(): boolean {
    const errorRate = this.calculateErrorRate();
    const criticalCount = this.severityCounts.get("critical") || 0;

    return errorRate > this.thresholds.criticalErrorRate || criticalCount > 10;
  }

  /**
   * Limpiar historial antiguo
   */
  clearOldErrors(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const before = this.errors.length;
    const now = Date.now();

    this.errors = this.errors.filter((e) => now - e.timestamp < olderThanMs);

    logger.debug(
      {
        type: "error_monitor_cleanup",
        removed: before - this.errors.length,
      },
      `Limpiados ${before - this.errors.length} errores antiguos`,
    );

    return before - this.errors.length;
  }
}

/**
 * Instancia global
 */
let globalMonitor: ErrorRateMonitor | null = null;

/**
 * Inicializar globalmente
 */
export function initializeErrorMonitor(
  thresholds?: Partial<ErrorMonitorThresholds>,
): ErrorRateMonitor {
  if (!globalMonitor) {
    globalMonitor = new ErrorRateMonitor(thresholds);
  }
  return globalMonitor;
}

/**
 * Obtener monitor global
 */
export function getErrorMonitor(): ErrorRateMonitor {
  if (!globalMonitor) {
    return initializeErrorMonitor();
  }
  return globalMonitor;
}

/**
 * Función auxiliar para registrar errores
 */
export function recordError(
  error: Error | string,
  options: {
    source?: "client" | "server" | "api";
    endpoint?: string;
    userId?: string;
    sessionId?: string;
    severity?: "low" | "medium" | "high" | "critical";
    metadata?: Record<string, any>;
  } = {},
): void {
  const monitor = getErrorMonitor();

  const severity = options.severity || "medium";
  const message = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? error.stack : undefined;

  monitor.recordError({
    error,
    message,
    timestamp: Date.now(),
    source: options.source || "server",
    endpoint: options.endpoint,
    userId: options.userId,
    sessionId: options.sessionId,
    stackTrace,
    severity,
    metadata: options.metadata,
    id: "", // Se establece en recordError
  });
}

/**
 * Utilidades de acceso
 */
export function getErrorStats() {
  return getErrorMonitor().getStats();
}

export function getErrorPatterns() {
  return getErrorMonitor().detectErrorPatterns();
}

export function isCriticalErrorRate() {
  return getErrorMonitor().isCriticalErrorRate();
}
