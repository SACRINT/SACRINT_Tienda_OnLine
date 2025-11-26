/**
 * Uptime Monitoring - SLA Tracking
 * Semana 31, Tarea 31.11: Monitoreo de disponibilidad y seguimiento de SLA
 */

import { logger } from './logger'

/**
 * Período de tiempo
 */
export type TimePeriod = '1h' | '24h' | '7d' | '30d' | '90d' | 'ytd'

/**
 * Evento de uptime
 */
export interface UptimeEvent {
  timestamp: number
  type: 'up' | 'down' | 'degraded'
  duration: number // ms
  service: string
  reason?: string
}

/**
 * Estadísticas de SLA
 */
export interface SLAStats {
  period: TimePeriod
  totalTime: number
  uptime: number
  downtime: number
  uptimePercent: number
  events: UptimeEvent[]
  targetPercent: number
  meetsTarget: boolean
}

/**
 * Monitor de uptime
 */
export class UptimeMonitor {
  private events: UptimeEvent[] = []
  private lastStatus: Map<string, 'up' | 'down' | 'degraded'> = new Map()
  private lastCheckTime: Map<string, number> = new Map()
  private serviceTargets: Map<string, number> = new Map() // % SLA
  private maxEventsHistory = 50000

  // Tiempos en ms para cada período
  private periodDurations: Record<TimePeriod, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    'ytd': 365 * 24 * 60 * 60 * 1000, // Approximate
  }

  constructor() {
    logger.debug({ type: 'uptime_monitor_init' }, 'Uptime Monitor inicializado')
  }

  /**
   * Registrar target de SLA para un servicio
   */
  setServiceTarget(service: string, targetPercent: number): void {
    this.serviceTargets.set(service, targetPercent)
    logger.debug(
      { type: 'service_target_set', service, target: targetPercent },
      `Target SLA establecido para ${service}: ${targetPercent}%`,
    )
  }

  /**
   * Registrar cambio de estado
   */
  recordStatusChange(
    service: string,
    status: 'up' | 'down' | 'degraded',
    reason?: string,
  ): void {
    const now = Date.now()
    const previousStatus = this.lastStatus.get(service)

    if (previousStatus === status && previousStatus !== 'down') {
      // No hay cambio
      return
    }

    const lastCheckTime = this.lastCheckTime.get(service) || now
    const duration = now - lastCheckTime

    const event: UptimeEvent = {
      timestamp: lastCheckTime,
      type: previousStatus || status,
      duration,
      service,
      reason,
    }

    this.events.push(event)
    if (this.events.length > this.maxEventsHistory) {
      this.events.shift()
    }

    this.lastStatus.set(service, status)
    this.lastCheckTime.set(service, now)

    logger.info(
      {
        type: 'status_change',
        service,
        oldStatus: previousStatus,
        newStatus: status,
        duration,
        reason,
      },
      `${service} cambió a ${status}${reason ? `: ${reason}` : ''}`,
    )
  }

  /**
   * Obtener estado actual de un servicio
   */
  getCurrentStatus(service: string): 'up' | 'down' | 'degraded' | 'unknown' {
    return this.lastStatus.get(service) || 'unknown'
  }

  /**
   * Calcular uptime en un período
   */
  private calculateUptimePercent(
    service: string,
    period: TimePeriod,
  ): number {
    const now = Date.now()
    const periodDuration = this.periodDurations[period]
    const startTime = now - periodDuration

    const periodEvents = this.events.filter(
      (e) => e.service === service && e.timestamp >= startTime,
    )

    if (periodEvents.length === 0) {
      // Sin eventos registrados, asumir 100%
      return 100
    }

    let totalUptime = 0

    for (const event of periodEvents) {
      if (event.type === 'up') {
        totalUptime += event.duration
      }
    }

    return (totalUptime / periodDuration) * 100
  }

  /**
   * Obtener estadísticas de SLA
   */
  getSLAStats(service: string, period: TimePeriod = '30d'): SLAStats {
    const periodDuration = this.periodDurations[period]
    const targetPercent = this.serviceTargets.get(service) || 99.9
    const uptime = this.calculateUptimePercent(service, period)

    const now = Date.now()
    const startTime = now - periodDuration

    const periodEvents = this.events.filter(
      (e) => e.service === service && e.timestamp >= startTime,
    )

    const downtimeMs = periodEvents
      .filter((e) => e.type === 'down')
      .reduce((sum, e) => sum + e.duration, 0)

    return {
      period,
      totalTime: periodDuration,
      uptime: (periodDuration * uptime) / 100,
      downtime: downtimeMs,
      uptimePercent: uptime,
      targetPercent,
      events: periodEvents,
      meetsTarget: uptime >= targetPercent,
    }
  }

  /**
   * Obtener todos los servicios
   */
  getAllServices(): string[] {
    const services = new Set<string>()
    for (const event of this.events) {
      services.add(event.service)
    }
    return Array.from(services)
  }

  /**
   * Obtener resumen de todos los servicios
   */
  getSummary(period: TimePeriod = '30d'): {
    services: { name: string; status: string; uptime: number }[]
    criticalIssues: string[]
  } {
    const services = this.getAllServices()
    const summary = services.map((service) => {
      const stats = this.getSLAStats(service, period)
      return {
        name: service,
        status: this.getCurrentStatus(service),
        uptime: stats.uptimePercent,
      }
    })

    const criticalIssues = services
      .filter((s) => {
        const stats = this.getSLAStats(s, period)
        return !stats.meetsTarget
      })
      .map((s) => `${s} no cumple SLA target`)

    return {
      services: summary.sort((a, b) => a.uptime - b.uptime),
      criticalIssues,
    }
  }

  /**
   * Calcular compensación de SLA (% faltante)
   */
  calculateSLACompensation(service: string, period: TimePeriod = '30d'): {
    percentageMissed: number
    compensation: string
  } {
    const stats = this.getSLAStats(service, period)

    if (stats.meetsTarget) {
      return { percentageMissed: 0, compensation: '0%' }
    }

    const missed = stats.targetPercent - stats.uptimePercent
    const compensation = (missed * 100) / stats.targetPercent

    return {
      percentageMissed: missed,
      compensation: `${compensation.toFixed(2)}%`,
    }
  }

  /**
   * Generar reporte
   */
  generateReport(period: TimePeriod = '30d'): string {
    const services = this.getAllServices()

    let report = `Uptime & SLA Report (${period})\n`
    report += `======================\n\n`

    for (const service of services) {
      const stats = this.getSLAStats(service, period)
      const status = this.getCurrentStatus(service)
      const icon = stats.meetsTarget ? '✅' : '❌'

      report += `${icon} ${service}\n`
      report += `  Status: ${status.toUpperCase()}\n`
      report += `  Uptime: ${stats.uptimePercent.toFixed(4)}%\n`
      report += `  Target: ${stats.targetPercent}%\n`
      report += `  Downtime: ${Math.round(stats.downtime / 1000 / 60)} minutes\n`

      if (!stats.meetsTarget) {
        const comp = this.calculateSLACompensation(service, period)
        report += `  ⚠️  SLA Compensation: ${comp.compensation}\n`
      }

      report += '\n'
    }

    return report
  }

  /**
   * Obtener eventos recientes
   */
  getRecentEvents(limit: number = 50): UptimeEvent[] {
    return this.events.slice(-limit).reverse()
  }

  /**
   * Calcular MTTR (Mean Time To Recovery)
   */
  calculateMTTR(service: string): number {
    const downEvents = this.events.filter(
      (e) => e.service === service && e.type === 'down',
    )

    if (downEvents.length === 0) {
      return 0
    }

    const totalRecoveryTime = downEvents.reduce(
      (sum, e) => sum + e.duration,
      0,
    )

    return totalRecoveryTime / downEvents.length
  }

  /**
   * Calcular MTTF (Mean Time To Failure)
   */
  calculateMTTF(service: string): number {
    const upEvents = this.events.filter(
      (e) => e.service === service && e.type === 'up',
    )

    if (upEvents.length === 0) {
      return 0
    }

    const totalUptime = upEvents.reduce((sum, e) => sum + e.duration, 0)

    return totalUptime / (upEvents.length || 1)
  }

  /**
   * Limpiar eventos antiguos
   */
  cleanupOldEvents(olderThanMs: number = 90 * 24 * 60 * 60 * 1000): number {
    const now = Date.now()
    const before = this.events.length

    this.events = this.events.filter((e) => now - e.timestamp < olderThanMs)

    const removed = before - this.events.length

    if (removed > 0) {
      logger.debug(
        { type: 'uptime_events_cleanup', removed },
        `Limpiados ${removed} eventos antiguos`,
      )
    }

    return removed
  }
}

/**
 * Instancia global
 */
let globalMonitor: UptimeMonitor | null = null

/**
 * Inicializar globalmente
 */
export function initializeUptimeMonitor(): UptimeMonitor {
  if (!globalMonitor) {
    globalMonitor = new UptimeMonitor()
  }
  return globalMonitor
}

/**
 * Obtener monitor global
 */
export function getUptimeMonitor(): UptimeMonitor {
  if (!globalMonitor) {
    return initializeUptimeMonitor()
  }
  return globalMonitor
}

/**
 * Estándares de SLA comunes
 */
export const CommonSLATargets = {
  CRITICAL: 99.99, // 4 nines - 52.6 minutos/año
  HIGH: 99.9, // 3 nines - 8.77 horas/año
  STANDARD: 99.5, // 43.8 minutos/mes
  BASIC: 99, // 7.2 horas/mes
  DEVELOPMENT: 95, // 1.5 días/mes
}
