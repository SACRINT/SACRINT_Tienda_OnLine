/**
 * Performance Reporting
 * Semana 43, Tarea 43.12: Performance Reporting
 */

import { logger } from '@/lib/monitoring'

export interface PerformanceReport {
  id: string
  title: string
  period: { start: Date; end: Date }
  metrics: Record<string, number>
  summary: string
  recommendations: string[]
  createdAt: Date
}

export interface MetricTrend {
  metric: string
  values: Array<{ timestamp: Date; value: number }>
  trend: 'improving' | 'degrading' | 'stable'
}

export class PerformanceReportingManager {
  private reports: Map<string, PerformanceReport> = new Map()
  private trends: Map<string, MetricTrend> = new Map()

  constructor() {
    logger.debug({ type: 'performance_reporting_init' }, 'Performance Reporting Manager inicializado')
  }

  /**
   * Generar reporte de rendimiento
   */
  generateReport(title: string, metrics: Record<string, number>, recommendations: string[] = []): PerformanceReport {
    const report: PerformanceReport = {
      id: `report_${Date.now()}`,
      title,
      period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      metrics,
      summary: this.generateSummary(metrics),
      recommendations,
      createdAt: new Date(),
    }

    this.reports.set(report.id, report)
    logger.info({ type: 'performance_report_generated', title }, `Reporte de rendimiento generado: ${title}`)

    return report
  }

  /**
   * Generar resumen
   */
  private generateSummary(metrics: Record<string, number>): string {
    const avgResponseTime = metrics['avgResponseTime'] || 0
    const p95ResponseTime = metrics['p95ResponseTime'] || 0
    const errorRate = metrics['errorRate'] || 0
    const availability = metrics['availability'] || 100

    let status = 'EXCELENTE'
    if (avgResponseTime > 2000 || errorRate > 1 || availability < 99) {
      status = 'NECESITA ATENCIÓN'
    } else if (avgResponseTime > 1000 || errorRate > 0.5 || availability < 99.5) {
      status = 'BUENO'
    }

    return `Sistema en estado ${status}. Respuesta promedio: ${avgResponseTime}ms, P95: ${p95ResponseTime}ms, Tasa error: ${errorRate}%`
  }

  /**
   * Rastrear tendencia de métrica
   */
  trackMetricTrend(metricName: string, value: number): void {
    if (!this.trends.has(metricName)) {
      this.trends.set(metricName, {
        metric: metricName,
        values: [],
        trend: 'stable',
      })
    }

    const trendData = this.trends.get(metricName)!
    trendData.values.push({ timestamp: new Date(), value })

    // Mantener últimos 100 valores
    if (trendData.values.length > 100) {
      trendData.values.shift()
    }

    // Calcular tendencia
    if (trendData.values.length >= 10) {
      const recent = trendData.values.slice(-10).reduce((sum, v) => sum + v.value, 0) / 10
      const older = trendData.values.slice(-20, -10).reduce((sum, v) => sum + v.value, 0) / 10

      if (recent > older * 1.1) {
        trendData.trend = 'degrading'
      } else if (recent < older * 0.9) {
        trendData.trend = 'improving'
      } else {
        trendData.trend = 'stable'
      }
    }
  }

  /**
   * Obtener tendencia
   */
  getMetricTrend(metricName: string): MetricTrend | null {
    return this.trends.get(metricName) || null
  }

  /**
   * Exportar reporte
   */
  exportReport(reportId: string, format: 'json' | 'csv' | 'html' = 'json'): string {
    const report = this.reports.get(reportId)
    if (!report) return ''

    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    } else if (format === 'csv') {
      let csv = 'Métrica,Valor\n'
      for (const [key, value] of Object.entries(report.metrics)) {
        csv += `${key},${value}\n`
      }
      return csv
    } else if (format === 'html') {
      return `
        <html>
          <head><title>${report.title}</title></head>
          <body>
            <h1>${report.title}</h1>
            <p>${report.summary}</p>
            <h2>Métricas:</h2>
            <table>
              ${Object.entries(report.metrics).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('\n')}
            </table>
          </body>
        </html>
      `
    }

    return ''
  }

  /**
   * Obtener reportes recientes
   */
  getRecentReports(limit: number = 10): PerformanceReport[] {
    return Array.from(this.reports.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  /**
   * Generar dashboard
   */
  generateDashboard(): string {
    const trends = Array.from(this.trends.values())
    const reports = this.getRecentReports(5)

    const dashboard = `
=== DASHBOARD DE RENDIMIENTO ===

ÚLTIMOS REPORTES:
${reports.map((r) => `- ${r.title}: ${r.summary}`).join('\n')}

TENDENCIAS DE MÉTRICAS:
${trends.map((t) => `- ${t.metric}: ${t.trend}`).join('\n')}
    `

    logger.info({ type: 'dashboard_generated' }, 'Dashboard de rendimiento generado')
    return dashboard
  }
}

let globalPerformanceReportingManager: PerformanceReportingManager | null = null

export function initializePerformanceReportingManager(): PerformanceReportingManager {
  if (!globalPerformanceReportingManager) {
    globalPerformanceReportingManager = new PerformanceReportingManager()
  }
  return globalPerformanceReportingManager
}

export function getPerformanceReportingManager(): PerformanceReportingManager {
  if (!globalPerformanceReportingManager) {
    return initializePerformanceReportingManager()
  }
  return globalPerformanceReportingManager
}
