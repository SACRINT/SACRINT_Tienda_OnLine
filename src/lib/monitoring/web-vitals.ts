/**
 * Performance Monitoring con Web Vitals
 * Semana 31, Tarea 31.3: Monitoreo de Core Web Vitals y métricas de performance
 */

import { logger } from './logger'
import { captureMessage } from './sentry'

/**
 * Interfaz para una métrica de Web Vitals
 */
export interface VitalMetric {
  name: string
  value: number
  unit: string
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  id?: string
}

/**
 * Thresholds para clasificar métricas (Google Web Vitals 2024)
 */
const VITALS_THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  fid: { good: 100, poor: 300 }, // First Input Delay (ms)
  cls: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift (score)
  ttfb: { good: 800, poor: 1800 }, // Time to First Byte (ms)
  tti: { good: 3800, poor: 7300 }, // Time to Interactive (ms)
  inp: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
}

/**
 * Clasificar una métrica según su valor
 */
function rateVital(
  name: string,
  value: number,
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS]

  if (!thresholds) {
    return 'needs-improvement'
  }

  if (value <= thresholds.good) {
    return 'good'
  }

  if (value <= thresholds.poor) {
    return 'needs-improvement'
  }

  return 'poor'
}

/**
 * Recolector de Web Vitals
 */
export class WebVitalsCollector {
  private metrics: Map<string, VitalMetric> = new Map()
  private observers: Set<PerformanceObserver> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  /**
   * Inicializar PerformanceObservers para múltiples tipos de métricas
   */
  private initializeObservers(): void {
    try {
      // Observer para Paint Timing (FCP)
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric({
              name: 'fcp',
              value: entry.startTime,
              unit: 'ms',
              timestamp: Date.now(),
            })
          }
        }
      })

      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.add(paintObserver)

      // Observer para LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1]
          this.recordMetric({
            name: 'lcp',
            value: lastEntry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          })
        }
      })

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.add(lcpObserver)

      // Observer para CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value
          }
        }
        this.recordMetric({
          name: 'cls',
          value: cls,
          unit: 'score',
          timestamp: Date.now(),
        })
      })

      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.add(clsObserver)

      logger.debug(
        { type: 'web_vitals_init' },
        'Web Vitals observers inicializados',
      )
    } catch (error) {
      logger.error(
        {
          type: 'web_vitals_init_error',
          error,
        },
        'Error inicializando Web Vitals observers',
      )
    }
  }

  /**
   * Registrar una métrica individual
   */
  recordMetric(metric: Omit<VitalMetric, 'rating' | 'id'>): void {
    const rating = rateVital(metric.name, metric.value)
    const id = `${metric.name}-${metric.timestamp}`

    const vitalMetric: VitalMetric = {
      ...metric,
      rating,
      id,
    }

    this.metrics.set(metric.name, vitalMetric)

    logger.debug(
      {
        type: 'web_vital_recorded',
        metric: metric.name,
        value: metric.value,
        rating,
      },
      `Web Vital: ${metric.name} = ${metric.value}${metric.unit}`,
    )

    // Alertar si hay problema
    if (rating === 'poor') {
      captureMessage(`Critical: ${metric.name} metric is poor: ${metric.value}${metric.unit}`, 'warning')
    }
  }

  /**
   * Obtener todas las métricas registradas
   */
  getMetrics(): VitalMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Obtener métrica específica
   */
  getMetric(name: string): VitalMetric | undefined {
    return this.metrics.get(name)
  }

  /**
   * Generar reporte de Web Vitals
   */
  generateReport(): string {
    const metrics = this.getMetrics()

    let report = 'Web Vitals Report\n'
    report += '==================\n\n'

    for (const metric of metrics) {
      const ratingEmoji =
        metric.rating === 'good'
          ? '✅'
          : metric.rating === 'needs-improvement'
            ? '⚠️'
            : '❌'
      report += `${ratingEmoji} ${metric.name.toUpperCase()}: ${metric.value.toFixed(2)}${metric.unit} (${metric.rating})\n`
    }

    return report
  }

  /**
   * Limpiar observadores
   */
  disconnect(): void {
    for (const observer of this.observers) {
      observer.disconnect()
    }
    this.observers.clear()
    logger.debug(
      { type: 'web_vitals_disconnect' },
      'Web Vitals observers desconectados',
    )
  }
}

/**
 * Instancia global del recolector
 */
let globalCollector: WebVitalsCollector | null = null

/**
 * Inicializar Web Vitals monitoring globalmente
 */
export function initializeWebVitalsMonitoring(): WebVitalsCollector {
  if (typeof window === 'undefined') {
    throw new Error('Web Vitals monitoring solo funciona en el cliente')
  }

  if (!globalCollector) {
    globalCollector = new WebVitalsCollector()
  }

  return globalCollector
}

/**
 * Obtener el recolector global
 */
export function getWebVitalsCollector(): WebVitalsCollector {
  if (!globalCollector) {
    return initializeWebVitalsMonitoring()
  }
  return globalCollector
}

/**
 * Medir el tiempo de carga de la página
 */
export function measurePageLoadTime(): {
  navigationStart: number
  domContentLoaded: number
  pageLoad: number
  resourceTiming: number
} {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!nav) {
    return {
      navigationStart: 0,
      domContentLoaded: 0,
      pageLoad: 0,
      resourceTiming: 0,
    }
  }

  return {
    navigationStart: nav.fetchStart,
    domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
    pageLoad: nav.loadEventEnd - nav.fetchStart,
    resourceTiming: nav.responseEnd - nav.responseStart,
  }
}

/**
 * Medir tiempo de recursos específicos
 */
export function getResourceMetrics(
  type?: string,
): Array<{ name: string; duration: number }> {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

  return entries
    .filter((entry) => !type || entry.initiatorType === type)
    .map((entry) => ({
      name: entry.name,
      duration: entry.duration,
    }))
    .sort((a, b) => b.duration - a.duration)
}

/**
 * Detectar long tasks
 */
export function monitorLongTasks(
  threshold: number = 50,
  callback?: (duration: number, name: string) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > threshold) {
          logger.warn(
            {
              type: 'long_task',
              duration: entry.duration,
              name: entry.name,
            },
            `Long task detected: ${entry.duration.toFixed(2)}ms`,
          )

          callback?.(entry.duration, entry.name)
        }
      }
    })

    observer.observe({ entryTypes: ['longtask'] })

    return () => {
      observer.disconnect()
      logger.debug(
        { type: 'long_task_monitoring_stopped' },
        'Long task monitoring detenido',
      )
    }
  } catch {
    return () => {}
  }
}

/**
 * Obtener métricas de memoria (si está disponible)
 */
export function getMemoryMetrics(): {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  percentageUsed: number
} | null {
  const perfMemory = (performance as any).memory

  if (!perfMemory) {
    return null
  }

  const percentageUsed =
    (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100

  return {
    usedJSHeapSize: perfMemory.usedJSHeapSize,
    totalJSHeapSize: perfMemory.totalJSHeapSize,
    jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
    percentageUsed,
  }
}

/**
 * Exportar métricas a un servidor
 */
export async function exportMetrics(
  endpoint: string = '/api/metrics/web-vitals',
): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const collector = getWebVitalsCollector()
    const metrics = collector.getMetrics()
    const pageLoad = measurePageLoadTime()

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics,
        pageLoad,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    })

    logger.debug(
      { type: 'metrics_exported', count: metrics.length },
      'Métricas exportadas al servidor',
    )
  } catch (error) {
    logger.error(
      { type: 'metrics_export_error', error },
      'Error exportando métricas',
    )
  }
}
