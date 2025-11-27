/**
 * Monitoring & Observability Index
 * Semana 31: Sistema completo de monitoreo, logging y observabilidad
 */

// Sentry - Error Tracking
export {
  captureException,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  setUser,
  setContext,
} from "./sentry";

// Logger - Structured Logging
export {
  logger,
  logRequest,
  logResponse,
  logAuth,
  logPayment,
  logError,
  logPerformance,
  PerfTimer,
} from "./logger";

// Web Vitals - Performance Monitoring
export {
  WebVitalsCollector,
  initializeWebVitalsMonitoring,
  getWebVitalsCollector,
  measurePageLoadTime,
  getResourceMetrics,
  monitorLongTasks,
  getMemoryMetrics,
  exportMetrics,
  type VitalMetric,
} from "./web-vitals";

// Database Monitor - Query Monitoring
export {
  DatabaseQueryMonitor,
  initializeDatabaseMonitor,
  getDatabaseMonitor,
  createPrismaMonitoringMiddleware,
  getQueryStats,
  getSlowQueries,
  detectNPlusOne,
  type QueryInfo,
  type QueryMonitorConfig,
} from "./db-monitor";

// API Monitor - API Response Time Monitoring
export {
  APIMonitor,
  initializeAPIMonitor,
  getAPIMonitor,
  apiMonitoringMiddleware,
  getSlowEndpoints,
  getEndpointsWithErrors,
  getAllEndpointStats,
  type APIMetrics,
  type EndpointStats,
} from "./api-monitor";

// Error Monitor - Error Rate Monitoring
export {
  ErrorRateMonitor,
  initializeErrorMonitor,
  getErrorMonitor,
  recordError,
  getErrorStats,
  getErrorPatterns,
  isCriticalErrorRate,
  type ErrorRecord,
  type ErrorStats,
} from "./error-monitor";

// Health Checks
export {
  HealthCheckMonitor,
  initializeHealthCheckMonitor,
  getHealthCheckMonitor,
  CommonHealthChecks,
  type HealthStatus,
  type HealthCheckResult,
  type HealthCheckConfig,
  type HealthCheckSummary,
} from "./health-checks";

// Custom Metrics
export {
  CustomMetricsMonitor,
  initializeCustomMetricsMonitor,
  getCustomMetricsMonitor,
  ECommerceMetrics,
  type MetricType,
  type CustomMetric,
  type MetricStats,
} from "./custom-metrics";

// Alerting System
export {
  AlertingSystem,
  initializeAlertingSystem,
  getAlertingSystem,
  CommonAlertRules,
  type AlertSeverity,
  type Alert,
  type AlertRule,
} from "./alerting";

// Distributed Tracing
export {
  DistributedTracingManager,
  getDistributedTracingManager,
  type Trace,
  type Span,
} from "./distributed-tracing";

// Uptime Monitoring
export {
  UptimeMonitor,
  initializeUptimeMonitor,
  getUptimeMonitor,
  CommonSLATargets,
  type UptimeEvent,
  type SLAStats,
  type TimePeriod,
} from "./uptime-monitor";

// Reporting & Dashboard
export {
  ReportingService,
  initializeReportingService,
  getReportingService,
  type DashboardData,
  type ReportPeriod,
  type ReportType,
} from "./reporting";

/**
 * Función auxiliar para inicializar todo el sistema de monitoreo
 */
export function initializeMonitoringSystem(config?: {
  serviceName?: string;
  sentryDSN?: string;
  enableHealthChecks?: boolean;
  enableAutoReporting?: boolean;
}) {
  const { logger } = require("./logger");
  const { initializeDistributedTracer, getDistributedTracer } = require("./distributed-tracing");
  const { initializeDatabaseMonitor } = require("./db-monitor");
  const { initializeAPIMonitor } = require("./api-monitor");
  const { initializeErrorMonitor } = require("./error-monitor");
  const { initializeCustomMetricsMonitor } = require("./custom-metrics");
  const { initializeAlertingSystem } = require("./alerting");
  const { initializeUptimeMonitor } = require("./uptime-monitor");
  const { initializeHealthCheckMonitor } = require("./health-checks");
  const { getReportingService } = require("./reporting");

  const serviceName = config?.serviceName || "unknown";

  // Inicializar componentes principales
  initializeDistributedTracer(serviceName);
  initializeDatabaseMonitor({ slowQueryThreshold: 1000, enableLogging: true });
  initializeAPIMonitor({ warning: 1000, critical: 5000 });
  initializeErrorMonitor({ criticalErrorRate: 5, highErrorRate: 10 });
  initializeCustomMetricsMonitor();
  initializeAlertingSystem();
  initializeUptimeMonitor();

  // Inicializar health checks si está habilitado
  if (config?.enableHealthChecks) {
    const healthMonitor = initializeHealthCheckMonitor();
    healthMonitor.startMonitoring();
  }

  // Programar reportes automáticos si está habilitado
  if (config?.enableAutoReporting) {
    const reporting = getReportingService();
    reporting.scheduleAutomaticReports(6 * 60 * 60 * 1000); // Cada 6 horas
  }

  logger.info(
    { type: "monitoring_system_initialized", service: serviceName },
    `Monitoring system inicializado para ${serviceName}`,
  );

  return {
    sentry: "initialized",
    logger: "initialized",
    webVitals: "client-side",
    database: "initialized",
    api: "initialized",
    errors: "initialized",
    health: config?.enableHealthChecks ? "initialized" : "disabled",
    metrics: "initialized",
    alerting: "initialized",
    tracing: "initialized",
    uptime: "initialized",
    reporting: config?.enableAutoReporting ? "initialized" : "ready",
  };
}
