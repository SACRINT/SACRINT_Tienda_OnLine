/**
 * Distributed Tracing Manager
 * Semana 45, Tarea 45.1: Distributed Tracing
 */

import { logger } from "@/lib/monitoring"

export interface Trace {
  id: string
  name: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: "started" | "completed" | "failed"
  spans: Span[]
  metadata?: Record<string, any>
}

export interface Span {
  id: string
  traceId: string
  name: string
  startTime: Date
  endTime?: Date
  duration?: number
  serviceName: string
  tags?: Record<string, any>
}

export class DistributedTracingManager {
  private traces: Map<string, Trace> = new Map()
  private spans: Map<string, Span> = new Map()

  constructor() {
    logger.debug({ type: "tracing_init" }, "Distributed Tracing Manager inicializado")
  }

  startTrace(name: string, metadata?: Record<string, any>): Trace {
    const trace: Trace = {
      id: `trace_${Date.now()}`,
      name,
      startTime: new Date(),
      status: "started",
      spans: [],
      metadata,
    }
    this.traces.set(trace.id, trace)
    logger.info({ type: "trace_started", traceId: trace.id }, `Trace iniciado: ${name}`)
    return trace
  }

  createSpan(traceId: string, name: string, serviceName: string): Span {
    const span: Span = {
      id: `span_${Date.now()}`,
      traceId,
      name,
      startTime: new Date(),
      serviceName,
    }
    this.spans.set(span.id, span)
    const trace = this.traces.get(traceId)
    if (trace) {
      trace.spans.push(span)
    }
    logger.debug({ type: "span_created", spanId: span.id }, `Span creado: ${name}`)
    return span
  }

  endSpan(spanId: string): Span | null {
    const span = this.spans.get(spanId)
    if (!span) return null
    span.endTime = new Date()
    span.duration = span.endTime.getTime() - span.startTime.getTime()
    logger.debug({ type: "span_ended" }, `Span finalizado en ${span.duration}ms`)
    return span
  }

  endTrace(traceId: string): Trace | null {
    const trace = this.traces.get(traceId)
    if (!trace) return null
    trace.endTime = new Date()
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime()
    trace.status = "completed"
    logger.info({ type: "trace_ended" }, `Trace completado en ${trace.duration}ms`)
    return trace
  }

  getTrace(traceId: string): Trace | null {
    return this.traces.get(traceId) || null
  }

  getTraceSpans(traceId: string): Span[] {
    const trace = this.traces.get(traceId)
    return trace?.spans || []
  }

  getStatistics() {
    return {
      totalTraces: this.traces.size,
      totalSpans: this.spans.size,
      activeTraces: Array.from(this.traces.values()).filter(t => t.status === "started").length,
    }
  }
}

let globalTracingManager: DistributedTracingManager | null = null

export function getDistributedTracingManager(): DistributedTracingManager {
  if (!globalTracingManager) {
    globalTracingManager = new DistributedTracingManager()
  }
  return globalTracingManager
}
