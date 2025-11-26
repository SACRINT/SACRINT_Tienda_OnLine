/**
 * DDoS Protection
 * Semana 42, Tarea 42.6: DDoS Protection
 */

import { logger } from '@/lib/monitoring'

export interface DDoSRule {
  id: string
  name: string
  type: 'rate_limit' | 'geo_block' | 'pattern_detection'
  threshold: number
  action: 'block' | 'throttle' | 'challenge'
  enabled: boolean
}

export interface RequestTracker {
  ip: string
  count: number
  firstRequest: Date
  lastRequest: Date
  blocked: boolean
}

export interface DDoSAttack {
  id: string
  attackType: string
  sourceIPs: string[]
  targetResource: string
  requestCount: number
  startTime: Date
  endTime?: Date
  status: 'active' | 'mitigated' | 'resolved'
}

export class DDoSProtectionManager {
  private rules: Map<string, DDoSRule> = new Map()
  private requestTrackers: Map<string, RequestTracker> = new Map()
  private attacks: Map<string, DDoSAttack> = new Map()
  private blockedIPs: Set<string> = new Set()
  private cleanupInterval: number = 60000 // 1 minute

  constructor() {
    logger.debug({ type: 'ddos_protection_init' }, 'DDoS Protection Manager inicializado')
    this.initializeDefaultRules()
    this.startCleanup()
  }

  /**
   * Inicializar reglas por defecto
   */
  private initializeDefaultRules(): void {
    this.createRule('Rate limiting', 'rate_limit', 100, 'throttle') // 100 req/min
    this.createRule('Geo blocking', 'geo_block', 0, 'block')
    this.createRule('Pattern detection', 'pattern_detection', 50, 'challenge') // 50 req/min unusual pattern
  }

  /**
   * Crear regla DDoS
   */
  createRule(name: string, type: string, threshold: number, action: string): DDoSRule {
    const rule: DDoSRule = {
      id: `rule_${Date.now()}`,
      name,
      type: type as any,
      threshold,
      action: action as any,
      enabled: true,
    }

    this.rules.set(rule.id, rule)

    logger.info({ type: 'ddos_rule_created', name }, `Regla DDoS creada: ${name}`)

    return rule
  }

  /**
   * Evaluar solicitud
   */
  evaluateRequest(ip: string, resource: string, geo?: string): 'allowed' | 'throttled' | 'blocked' {
    // Verificar si IP está bloqueada
    if (this.blockedIPs.has(ip)) {
      return 'blocked'
    }

    // Obtener o crear tracker
    let tracker = this.requestTrackers.get(ip)
    if (!tracker) {
      tracker = {
        ip,
        count: 0,
        firstRequest: new Date(),
        lastRequest: new Date(),
        blocked: false,
      }
      this.requestTrackers.set(ip, tracker)
    }

    // Incrementar contador
    tracker.lastRequest = new Date()
    tracker.count++

    // Evaluar reglas
    const minute = 60 * 1000
    const timeSinceFirst = tracker.lastRequest.getTime() - tracker.firstRequest.getTime()

    if (timeSinceFirst < minute && tracker.count > 100) {
      // Rate limiting exceeded
      this.detectAttack(ip, resource, tracker.count)
      return 'throttled'
    }

    if (tracker.count > 500) {
      // Block after too many requests
      this.blockIP(ip, 'rate_limit_exceeded')
      return 'blocked'
    }

    return 'allowed'
  }

  /**
   * Detectar ataque DDoS
   */
  detectAttack(ip: string, resource: string, requestCount: number): DDoSAttack {
    const existingAttack = Array.from(this.attacks.values()).find(
      (a) => a.sourceIPs.includes(ip) && a.status === 'active'
    )

    if (existingAttack) {
      existingAttack.requestCount = Math.max(existingAttack.requestCount, requestCount)
      return existingAttack
    }

    const attack: DDoSAttack = {
      id: `attack_${Date.now()}`,
      attackType: 'HTTP_Flood',
      sourceIPs: [ip],
      targetResource: resource,
      requestCount,
      startTime: new Date(),
      status: 'active',
    }

    this.attacks.set(attack.id, attack)

    logger.error(
      { type: 'ddos_attack_detected', attackId: attack.id, sourceIP: ip, requests: requestCount },
      `Ataque DDoS detectado: ${ip}`
    )

    return attack
  }

  /**
   * Bloquear IP
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip)

    logger.warn({ type: 'ip_blocked', ip, reason }, `IP bloqueada: ${ip}`)
  }

  /**
   * Desbloquear IP
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip)

    logger.info({ type: 'ip_unblocked', ip }, `IP desbloqueada: ${ip}`)
  }

  /**
   * Mitigar ataque
   */
  mitigateAttack(attackId: string): DDoSAttack | null {
    const attack = this.attacks.get(attackId)
    if (!attack) return null

    attack.status = 'mitigated'
    attack.endTime = new Date()

    // Bloquear todas las IPs de origen
    for (const ip of attack.sourceIPs) {
      this.blockIP(ip, `Part of attack ${attackId}`)
    }

    logger.info({ type: 'attack_mitigated', attackId }, `Ataque mitigado: ${attackId}`)

    return attack
  }

  /**
   * Obtener ataques activos
   */
  getActiveAttacks(): DDoSAttack[] {
    return Array.from(this.attacks.values()).filter((a) => a.status === 'active')
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    totalTrackedIPs: number
    blockedIPs: number
    activeAttacks: number
    totalAttacksDetected: number
  } {
    return {
      totalTrackedIPs: this.requestTrackers.size,
      blockedIPs: this.blockedIPs.size,
      activeAttacks: this.getActiveAttacks().length,
      totalAttacksDetected: this.attacks.size,
    }
  }

  /**
   * Generar reporte de protección DDoS
   */
  generateDDoSReport(): string {
    const stats = this.getStatistics()
    const activeAttacks = this.getActiveAttacks()

    const report = `
=== REPORTE DE PROTECCIÓN DDoS ===

ESTADÍSTICAS:
- IPs Rastreadas: ${stats.totalTrackedIPs}
- IPs Bloqueadas: ${stats.blockedIPs}
- Ataques Activos: ${stats.activeAttacks}
- Total Ataques Detectados: ${stats.totalAttacksDetected}

ATAQUES ACTIVOS:
${activeAttacks.length > 0 ? activeAttacks.map((a) => `- ${a.attackType}: ${a.sourceIPs.length} IPs, ${a.requestCount} requests`).join('\n') : '- Ninguno'}

REGLAS ACTIVAS: ${Array.from(this.rules.values()).filter((r) => r.enabled).length}
    `

    logger.info({ type: 'ddos_report_generated' }, 'Reporte DDoS generado')
    return report
  }

  /**
   * Limpiar trackers expirados
   */
  private startCleanup(): void {
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000
      let cleaned = 0

      for (const [ip, tracker] of this.requestTrackers) {
        if (tracker.lastRequest.getTime() < oneHourAgo) {
          this.requestTrackers.delete(ip)
          cleaned++
        }
      }

      if (cleaned > 0) {
        logger.debug({ type: 'trackers_cleaned', count: cleaned }, `${cleaned} trackers limpios`)
      }
    }, this.cleanupInterval)
  }
}

let globalDDoSProtectionManager: DDoSProtectionManager | null = null

export function initializeDDoSProtectionManager(): DDoSProtectionManager {
  if (!globalDDoSProtectionManager) {
    globalDDoSProtectionManager = new DDoSProtectionManager()
  }
  return globalDDoSProtectionManager
}

export function getDDoSProtectionManager(): DDoSProtectionManager {
  if (!globalDDoSProtectionManager) {
    return initializeDDoSProtectionManager()
  }
  return globalDDoSProtectionManager
}
