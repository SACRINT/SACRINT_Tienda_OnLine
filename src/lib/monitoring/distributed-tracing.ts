/**
 * Distributed Tracing
 * Semana 31, Tarea 31.10: Rastreo distribuido de requests a través del sistema
 */

import { logger } from './logger'

/**
 * Identificador único de traza
 */
export interface TraceID {
  traceId: string
  spanId: string
  parentSpanId?: string
}

/**
 * Información de un span
 */
export interface Span {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  service: string
  timestamp: number
  duration: number
  status: 'ok' | 'error'
  tags?: Record<string, string | number | boolean>
  logs?: Array<{
    timestamp: number
    message: string
    level: 'debug' | 'info' | 'warn' | 'error'
  }>
  error?: {
    message: string
    stack?: string
  }
}

/**
 * Traza completa
 */
export interface Trace {
  traceId: string
  startTime: number
  endTime: number
  duration: number
  spans: Span[]
  status: 'ok' | 'error'
  rootService: string
}

/**
 * Contexto de traza actual
 */
let currentTraceContext: TraceID | null = null

/**
 * Distribuidor de trazas
 */
export class DistributedTracer {
  private traces: Map<string, Trace> = new Map()
  private activeSpans: Map<string, Span> = new Map()
  private serviceName: string
  private maxTraces = 1000

  constructor(serviceName: string = 'unknown') {
    this.serviceName = serviceName
    logger.debug(
      { type: 'distributed_tracer_init', service: serviceName },
      `Distributed Tracer inicializado para ${serviceName}`,
    )
  }

  /**
   * Generar IDs únicos
   */
  generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  /**
   * Iniciar nueva traza
   */
  startTrace(): TraceID {
    const traceId = this.generateTraceId()
    const spanId = this.generateSpanId()

    currentTraceContext = {
      traceId,
      spanId,
    }

    logger.debug(
      { type: 'trace_started', traceId, spanId },
      `Traza iniciada: ${traceId}`,
    )

    return currentTraceContext
  }

  /**
   * Iniciar un span
   */
  startSpan(name: string, service: string = this.serviceName): Span {
    const traceId = currentTraceContext?.traceId || this.generateTraceId()
    const spanId = this.generateSpanId()
    const parentSpanId = currentTraceContext?.spanId

    if (!currentTraceContext) {
      currentTraceContext = {
        traceId,
        spanId,
      }
    }

    const span: Span = {
      traceId,
      spanId,
      parentSpanId,
      name,
      service,
      timestamp: Date.now(),
      duration: 0,
      status: 'ok',
    }

    this.activeSpans.set(spanId, span)

    logger.debug(
      {
        type: 'span_started',
        traceId,
        spanId,
        name,
        service,
      },
      `Span iniciado: ${name}`,
    )

    return span
  }

  /**
   * Finalizar un span
   */
  endSpan(spanId: string, status: 'ok' | 'error' = 'ok'): Span | null {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      return null
    }

    span.duration = Date.now() - span.timestamp
    span.status = status

    this.activeSpans.delete(spanId)

    logger.debug(
      {
        type: 'span_ended',
        traceId: span.traceId,
        spanId,
        duration: span.duration,
        status,
      },
      `Span finalizado: ${span.name} (${span.duration}ms)`,
    )

    // Registrar en traza
    const trace = this.traces.get(span.traceId)
    if (trace) {
      trace.spans.push(span)
      trace.endTime = Math.max(trace.endTime, span.timestamp + span.duration)
      trace.duration = trace.endTime - trace.startTime
    }

    return span
  }

  /**
   * Agregar tag a un span
   */
  addTag(spanId: string, key: string, value: string | number | boolean): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      span?.tags
      return
    }

    if (!span.tags) {
      span.tags = {}
    }

    span.tags[key] = value
  }

  /**
   * Agregar log a un span
   */
  addLog(
    spanId: string,
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  ): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      return
    }

    if (!span.logs) {
      span.logs = []
    }

    span.logs.push({
      timestamp: Date.now(),
      message,
      level,
    })
  }

  /**
   * Registrar error en span
   */
  recordError(spanId: string, error: Error): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      return
    }

    span.status = 'error'
    span.error = {
      message: error.message,
      stack: error.stack,
    }
  }

  /**
   * Obtener traza completa
   */
  getTrace(traceId: string): Trace | null {
    return this.traces.get(traceId) || null
  }

  /**
   * Generar estadísticas de traza
   */
  getTraceStats(traceId: string): {
    duration: number
    spanCount: number
    errorCount: number
    serviceCount: number
    criticalPath: number
  } | null {
    const trace = this.traces.get(traceId)
    if (!trace) {
      return null
    }

    const services = new Set(trace.spans.map((s) => s.service))
    const errorCount = trace.spans.filter((s) => s.status === 'error').length

    // Calcular camino crítico (spans sin paralelismo)
    let criticalPath = 0
    for (const span of trace.spans) {
      if (!span.parentSpanId) {
        criticalPath += span.duration
      }
    }

    return {
      duration: trace.duration,
      spanCount: trace.spans.length,
      errorCount,
      serviceCount: services.size,
      criticalPath,
    }
  }

  /**
   * Generar reporte de traza
   */
  generateTraceReport(traceId: string): string {
    const trace = this.traces.get(traceId)
    if (!trace) {
      return `Trace ${traceId} not found`
    }

    const stats = this.getTraceStats(traceId)!

    let report = `Trace Report: ${traceId}\n`
    report += `==================\n\n`

    report += `Status: ${trace.status.toUpperCase()}\n`
    report += `Duration: ${stats.duration}ms\n`
    report += `Services: ${stats.serviceCount}\n`
    report += `Spans: ${stats.spanCount}\n`
    report += `Errors: ${stats.errorCount}\n\n`

    report += 'Span Details:\n'
    for (const span of trace.spans) {
      const indent = span.parentSpanId ? '  ' : ''
      const status = span.status === 'ok' ? '✓' : '✗'
      report += `${indent}${status} ${span.name} [${span.service}] (${span.duration}ms)\n`

      if (span.tags) {
        for (const [key, value] of Object.entries(span.tags)) {
          report += `${indent}  - ${key}: ${value}\n`
        }
      }

      if (span.error) {
        report += `${indent}  ERROR: ${span.error.message}\n`
      }
    }

    return report
  }

  /**
   * Limpiar trazas antiguas
   */
  cleanupOldTraces(olderThanMs: number = 60 * 60 * 1000): number {
    const now = Date.now()
    let removed = 0

    for (const [traceId, trace] of this.traces) {
      if (now - trace.startTime > olderThanMs) {
        this.traces.delete(traceId)
        removed++
      }
    }

    if (removed > 0) {
      logger.debug(
        { type: 'trace_cleanup', removed },
        `Limpiadas ${removed} trazas antiguas`,
      )
    }

    return removed
  }
}

/**
 * Instancia global
 */
let globalTracer: DistributedTracer | null = null

/**
 * Inicializar globalmente
 */
export function initializeDistributedTracer(
  serviceName: string = 'unknown',
): DistributedTracer {
  if (!globalTracer) {
    globalTracer = new DistributedTracer(serviceName)
  }
  return globalTracer
}

/**
 * Obtener tracer global
 */
export function getDistributedTracer(): DistributedTracer {
  if (!globalTracer) {
    return initializeDistributedTracer()
  }
  return globalTracer
}

/**
 * Obtener contexto actual de traza
 */
export function getCurrentTraceContext(): TraceID | null {
  return currentTraceContext
}

/**
 * Establecer contexto de traza
 */
export function setTraceContext(context: TraceID | null): void {
  currentTraceContext = context
}

/**
 * Wrapper para funciones que deben ser trackeadas
 */
export async function withTracing<T>(
  name: string,
  fn: () => Promise<T>,
  service?: string,
): Promise<T> {
  const tracer = getDistributedTracer()
  const span = tracer.startSpan(name, service)

  try {
    const result = await fn()
    tracer.endSpan(span.spanId, 'ok')
    return result
  } catch (error) {
    tracer.recordError(span.spanId, error as Error)
    tracer.endSpan(span.spanId, 'error')
    throw error
  }
}

/**
 * Wrapper síncrono para funciones que deben ser trackeadas
 */
export function withTracingSync<T>(
  name: string,
  fn: () => T,
  service?: string,
): T {
  const tracer = getDistributedTracer()
  const span = tracer.startSpan(name, service)

  try {
    const result = fn()
    tracer.endSpan(span.spanId, 'ok')
    return result
  } catch (error) {
    tracer.recordError(span.spanId, error as Error)
    tracer.endSpan(span.spanId, 'error')
    throw error
  }
}

/**
 * Exportar headers HTTP para propagación de traza
 */
export function getTraceHeaders(): Record<string, string> {
  const context = getCurrentTraceContext()
  if (!context) {
    return {}
  }

  return {
    'X-Trace-ID': context.traceId,
    'X-Span-ID': context.spanId,
    'X-Parent-Span-ID': context.parentSpanId || '',
  }
}

/**
 * Extraer contexto de headers HTTP
 */
export function extractTraceContext(headers: Record<string, string>): TraceID | null {
  const traceId = headers['x-trace-id']
  const spanId = headers['x-span-id']

  if (!traceId || !spanId) {
    return null
  }

  return {
    traceId,
    spanId,
    parentSpanId: headers['x-parent-span-id'] || undefined,
  }
}
