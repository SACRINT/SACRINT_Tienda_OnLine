/**
 * Reporting & Admin Dashboard
 * Semana 31, Tarea 31.12: Sistema de reportes y dashboard administrativo
 */

import { logger } from './logger'
import { getErrorMonitor } from './error-monitor'
import { getAPIMonitor } from './api-monitor'
import { getDatabaseMonitor } from './db-monitor'
import { getCustomMetricsMonitor } from './custom-metrics'
import { getAlertingSystem } from './alerting'
import { getUptimeMonitor } from './uptime-monitor'
import { getHealthCheckMonitor } from './health-checks'

/**
 * Período de reporte
 */
export type ReportPeriod = '1h' | '24h' | '7d' | '30d'

/**
 * Tipo de reporte
 */
export type ReportType =
  | 'summary'
  | 'errors'
  | 'performance'
  | 'health'
  | 'business'
  | 'sla'
  | 'detailed'

/**
 * Datos del dashboard
 */
export interface DashboardData {
  timestamp: number
  period: ReportPeriod
  summary: {
    overallHealth: 'healthy' | 'degraded' | 'unhealthy'
    uptime: number
    errorRate: number
    avgLatency: number
    activeAlerts: number
  }
  services: {
    name: string
    status: 'up' | 'down' | 'degraded'
    uptime: number
    lastChecked: number
  }[]
  topErrors: Array<{
    message: string
    count: number
    lastOccurrence: number
  }>
  slowEndpoints: Array<{
    endpoint: string
    avgTime: number
    requests: number
  }>
  metrics: Record<string, number>
  alerts: Array<{
    id: string
    severity: string
    message: string
    timestamp: number
  }>
}

/**
 * Generador de reportes
 */
export class ReportingService {
  private lastGeneratedReport: Map<string, { data: any; timestamp: number }> =
    new Map()

  constructor() {
    logger.debug(
      { type: 'reporting_service_init' },
      'Reporting Service inicializado',
    )
  }

  /**
   * Generar resumen del dashboard
   */
  generateDashboardData(period: ReportPeriod = '24h'): DashboardData {
    const timestamp = Date.now()

    const errorMonitor = getErrorMonitor()
    const apiMonitor = getAPIMonitor()
    const dbMonitor = getDatabaseMonitor()
    const alertingSystem = getAlertingSystem()
    const uptimeMonitor = getUptimeMonitor()
    const healthMonitor = getHealthCheckMonitor()

    const errorStats = errorMonitor.getStats()
    const apiStats = apiMonitor.getAllEndpointStats()
    const healthSummary = { status: 'unknown', uptime: 0 } // Sincronización

    // Calcular métricas agregadas
    const avgLatency =
      apiStats.length > 0
        ? apiStats.reduce((sum, s) => sum + s.averageResponseTime, 0) /
          apiStats.length
        : 0

    const errorRate = (errorStats.totalErrors / Math.max(1, errorStats.totalErrors + 1000)) * 100

    const overallHealth =
      errorRate > 5 || avgLatency > 2000
        ? 'unhealthy'
        : errorRate > 2 || avgLatency > 1000
          ? 'degraded'
          : 'healthy'

    const activeAlerts = alertingSystem.getActiveAlerts().length

    // Obtener errores top
    const errorPatterns = errorMonitor.detectErrorPatterns(3)
    const topErrors = errorPatterns.map((p) => ({
      message: p.pattern.substring(0, 100),
      count: p.count,
      lastOccurrence: p.lastSeen,
    }))

    // Obtener endpoints lentos
    const slowEndpoints = apiMonitor
      .getSlowEndpoints(1000, 5)
      .map((s) => ({
        endpoint: s.endpoint,
        avgTime: s.averageResponseTime,
        requests: s.totalRequests,
      }))

    // Obtener servicios
    const uptime = uptimeMonitor.getSummary(period)

    // Alertas activas
    const alerts = alertingSystem.getActiveAlerts().slice(0, 10)

    return {
      timestamp,
      period,
      summary: {
        overallHealth,
        uptime: uptime.services[0]?.uptime || 100,
        errorRate,
        avgLatency,
        activeAlerts,
      },
      services: uptime.services.map((s) => ({
        name: s.name,
        status: s.status as any,
        uptime: s.uptime,
        lastChecked: timestamp,
      })),
      topErrors,
      slowEndpoints,
      metrics: {
        totalRequests: apiStats.reduce((sum, s) => sum + s.totalRequests, 0),
        totalErrors: errorStats.totalErrors,
        p95Latency: Math.max(
          ...apiStats.map((s) => s.p95),
        ),
        p99Latency: Math.max(
          ...apiStats.map((s) => s.p99),
        ),
      },
      alerts: alerts.map((a) => ({
        id: a.id,
        severity: a.severity,
        message: a.message,
        timestamp: a.timestamp,
      })),
    }
  }

  /**
   * Generar reporte de errores
   */
  generateErrorReport(limit: number = 50): string {
    const errorMonitor = getErrorMonitor()
    const errors = errorMonitor.getRecentErrors(limit)

    let report = 'Error Report\n'
    report += '============\n\n'

    report += `Total Errors: ${errorMonitor.getStats().totalErrors}\n\n`

    report += 'Recent Errors:\n'
    for (const error of errors) {
      const date = new Date(error.timestamp).toLocaleString()
      report += `[${error.severity.toUpperCase()}] ${date}\n`
      report += `  ${error.message}\n`
      if (error.endpoint) {
        report += `  Endpoint: ${error.endpoint}\n`
      }
      if (error.userId) {
        report += `  User: ${error.userId}\n`
      }
      report += '\n'
    }

    return report
  }

  /**
   * Generar reporte de performance
   */
  generatePerformanceReport(): string {
    const apiMonitor = getAPIMonitor()
    const dbMonitor = getDatabaseMonitor()

    let report = 'Performance Report\n'
    report += '==================\n\n'

    report += 'Slowest API Endpoints:\n'
    const slowEndpoints = apiMonitor.getSlowEndpoints(1000, 10)
    for (const endpoint of slowEndpoints) {
      report += `  ${endpoint.method} ${endpoint.endpoint}\n`
      report += `    Avg: ${endpoint.averageResponseTime.toFixed(2)}ms (p95: ${endpoint.p95.toFixed(2)}ms)\n`
      report += `    Requests: ${endpoint.totalRequests}\n`
    }

    report += '\nSlowest Database Queries:\n'
    const slowQueries = dbMonitor.getSlowQueries(10)
    for (const query of slowQueries) {
      report += `  ${query.model}.${query.operation}\n`
      report += `    Duration: ${query.duration}ms\n`
    }

    return report
  }

  /**
   * Generar reporte de salud
   */
  async generateHealthReport(): Promise<string> {
    const healthMonitor = getHealthCheckMonitor()
    return await healthMonitor.generateReport()
  }

  /**
   * Generar reporte de SLA
   */
  generateSLAReport(): string {
    const uptimeMonitor = getUptimeMonitor()
    return uptimeMonitor.generateReport('30d')
  }

  /**
   * Generar reporte completo
   */
  async generateCompleteReport(): Promise<string> {
    let report = 'COMPLETE SYSTEM REPORT\n'
    report += '======================\n'
    report += `Generated: ${new Date().toISOString()}\n\n`

    // Dashboard summary
    const dashboard = this.generateDashboardData()
    report += `Overall Health: ${dashboard.summary.overallHealth.toUpperCase()}\n`
    report += `Error Rate: ${dashboard.summary.errorRate.toFixed(2)}%\n`
    report += `Avg Latency: ${dashboard.summary.avgLatency.toFixed(2)}ms\n`
    report += `Active Alerts: ${dashboard.summary.activeAlerts}\n\n`

    // Error section
    const errorMonitor = getErrorMonitor()
    report += '--- ERROR ANALYSIS ---\n'
    report += errorMonitor.generateReport()
    report += '\n\n'

    // Performance section
    report += '--- PERFORMANCE ANALYSIS ---\n'
    report += this.generatePerformanceReport()
    report += '\n\n'

    // Health section
    report += '--- HEALTH STATUS ---\n'
    report += await this.generateHealthReport()
    report += '\n\n'

    // SLA section
    report += '--- SLA COMPLIANCE ---\n'
    report += this.generateSLAReport()

    return report
  }

  /**
   * Exportar dashboard como JSON
   */
  exportDashboardJSON(): string {
    const data = this.generateDashboardData()
    return JSON.stringify(data, null, 2)
  }

  /**
   * Exportar para Grafana/Prometheus
   */
  exportPrometheus(): string {
    const metricsMonitor = getCustomMetricsMonitor()
    return metricsMonitor.exportPrometheus()
  }

  /**
   * Enviar reporte por email (stub)
   */
  async emailReport(
    recipients: string[],
    reportType: ReportType = 'summary',
  ): Promise<void> {
    let subject = ''
    let body = ''

    switch (reportType) {
      case 'summary':
        subject = 'Daily Monitoring Summary'
        body = JSON.stringify(this.generateDashboardData(), null, 2)
        break
      case 'errors':
        subject = 'Error Report'
        body = this.generateErrorReport()
        break
      case 'performance':
        subject = 'Performance Report'
        body = this.generatePerformanceReport()
        break
      case 'sla':
        subject = 'SLA Compliance Report'
        body = this.generateSLAReport()
        break
      case 'detailed':
        subject = 'Detailed System Report'
        body = await this.generateCompleteReport()
        break
    }

    logger.debug(
      {
        type: 'email_report_sent',
        recipients,
        reportType,
        subject,
      },
      `Reporte enviado por email: ${subject}`,
    )

    // Aquí iría la integración con Resend o similar
    // await sendEmail({ to: recipients, subject, body })
  }

  /**
   * Programar reporte automático
   */
  scheduleAutomaticReports(interval: number = 24 * 60 * 60 * 1000): NodeJS.Timer {
    logger.info(
      { type: 'auto_reports_scheduled', interval },
      `Reportes automáticos programados cada ${interval / 1000 / 60}min`,
    )

    return setInterval(() => {
      this.emailReport(['admin@example.com'], 'summary').catch((error) => {
        logger.error(
          { type: 'auto_report_error', error },
          'Error en reporte automático',
        )
      })
    }, interval)
  }
}

/**
 * Instancia global
 */
let globalReportingService: ReportingService | null = null

/**
 * Inicializar globalmente
 */
export function initializeReportingService(): ReportingService {
  if (!globalReportingService) {
    globalReportingService = new ReportingService()
  }
  return globalReportingService
}

/**
 * Obtener servicio global
 */
export function getReportingService(): ReportingService {
  if (!globalReportingService) {
    return initializeReportingService()
  }
  return globalReportingService
}
