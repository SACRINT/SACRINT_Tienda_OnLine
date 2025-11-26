/**
 * IP Whitelisting & Blacklisting
 * Semana 42, Tarea 42.10: IP Whitelisting & Blacklisting
 */

import { logger } from '@/lib/monitoring'

export interface IPRule {
  id: string
  ipAddress: string
  type: 'whitelist' | 'blacklist'
  reason: string
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
}

export interface GeoIPInfo {
  ipAddress: string
  country: string
  region: string
  latitude: number
  longitude: number
}

export class IPProtectionManager {
  private whitelist: Map<string, IPRule> = new Map()
  private blacklist: Map<string, IPRule> = new Map()
  private geoIPCache: Map<string, GeoIPInfo> = new Map()

  constructor() {
    logger.debug({ type: 'ip_protection_init' }, 'IP Protection Manager inicializado')
  }

  /**
   * Agregar IP a whitelist
   */
  whitelistIP(ipAddress: string, reason: string = '', expiresAt?: Date): IPRule {
    const rule: IPRule = {
      id: `whitelist_${Date.now()}`,
      ipAddress,
      type: 'whitelist',
      reason,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    }

    this.whitelist.set(ipAddress, rule)
    logger.info({ type: 'ip_whitelisted', ipAddress, reason }, `IP agregada a whitelist: ${ipAddress}`)

    return rule
  }

  /**
   * Agregar IP a blacklist
   */
  blacklistIP(ipAddress: string, reason: string = '', expiresAt?: Date): IPRule {
    const rule: IPRule = {
      id: `blacklist_${Date.now()}`,
      ipAddress,
      type: 'blacklist',
      reason,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    }

    this.blacklist.set(ipAddress, rule)
    logger.warn({ type: 'ip_blacklisted', ipAddress, reason }, `IP agregada a blacklist: ${ipAddress}`)

    return rule
  }

  /**
   * Verificar si IP está permitida
   */
  isIPAllowed(ipAddress: string): { allowed: boolean; reason: string } {
    const now = new Date()

    // Verificar blacklist primero
    const blacklistRule = this.blacklist.get(ipAddress)
    if (blacklistRule && blacklistRule.isActive) {
      if (!blacklistRule.expiresAt || blacklistRule.expiresAt > now) {
        return { allowed: false, reason: `IP en blacklist: ${blacklistRule.reason}` }
      } else {
        // Remover regla expirada
        this.blacklist.delete(ipAddress)
      }
    }

    // Verificar whitelist
    const whitelistRule = this.whitelist.get(ipAddress)
    if (whitelistRule && whitelistRule.isActive) {
      if (!whitelistRule.expiresAt || whitelistRule.expiresAt > now) {
        return { allowed: true, reason: 'IP en whitelist' }
      } else {
        // Remover regla expirada
        this.whitelist.delete(ipAddress)
      }
    }

    // Si no hay regla explícita, permitir por defecto
    return { allowed: true, reason: 'Sin restricción específica' }
  }

  /**
   * Remover IP de whitelist
   */
  removeFromWhitelist(ipAddress: string): boolean {
    const removed = this.whitelist.delete(ipAddress)
    if (removed) {
      logger.info({ type: 'ip_removed_whitelist', ipAddress }, `IP removida de whitelist: ${ipAddress}`)
    }
    return removed
  }

  /**
   * Remover IP de blacklist
   */
  removeFromBlacklist(ipAddress: string): boolean {
    const removed = this.blacklist.delete(ipAddress)
    if (removed) {
      logger.info({ type: 'ip_removed_blacklist', ipAddress }, `IP removida de blacklist: ${ipAddress}`)
    }
    return removed
  }

  /**
   * Registrar información GeoIP
   */
  cacheGeoIPInfo(ipAddress: string, info: GeoIPInfo): void {
    this.geoIPCache.set(ipAddress, info)
  }

  /**
   * Obtener información GeoIP
   */
  getGeoIPInfo(ipAddress: string): GeoIPInfo | null {
    return this.geoIPCache.get(ipAddress) || null
  }

  /**
   * Validar IP (formato)
   */
  isValidIP(ipAddress: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

    return ipv4Regex.test(ipAddress) || ipv6Regex.test(ipAddress)
  }

  /**
   * Obtener todas las reglas de whitelist
   */
  getWhitelistRules(): IPRule[] {
    return Array.from(this.whitelist.values()).filter((r) => r.isActive)
  }

  /**
   * Obtener todas las reglas de blacklist
   */
  getBlacklistRules(): IPRule[] {
    return Array.from(this.blacklist.values()).filter((r) => r.isActive)
  }

  /**
   * Generar reporte
   */
  generateIPProtectionReport(): string {
    const whitelistRules = this.getWhitelistRules()
    const blacklistRules = this.getBlacklistRules()

    const report = `
=== REPORTE DE PROTECCIÓN POR IP ===

WHITELIST:
- Total: ${whitelistRules.length}
${whitelistRules.slice(0, 10).map((r) => `- ${r.ipAddress}: ${r.reason || 'Sin razón'}`).join('\n')}

BLACKLIST:
- Total: ${blacklistRules.length}
${blacklistRules.slice(0, 10).map((r) => `- ${r.ipAddress}: ${r.reason || 'Sin razón'}`).join('\n')}

GEO IP CACHE:
- Entradas: ${this.geoIPCache.size}
    `

    logger.info({ type: 'ip_protection_report_generated' }, 'Reporte de protección por IP generado')
    return report
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    totalWhitelisted: number
    totalBlacklisted: number
    cachedGeoIPs: number
  } {
    return {
      totalWhitelisted: this.whitelist.size,
      totalBlacklisted: this.blacklist.size,
      cachedGeoIPs: this.geoIPCache.size,
    }
  }

  /**
   * Limpiar reglas expiradas
   */
  cleanupExpiredRules(): number {
    const now = new Date()
    let cleaned = 0

    for (const [ip, rule] of this.whitelist) {
      if (rule.expiresAt && rule.expiresAt <= now) {
        this.whitelist.delete(ip)
        cleaned++
      }
    }

    for (const [ip, rule] of this.blacklist) {
      if (rule.expiresAt && rule.expiresAt <= now) {
        this.blacklist.delete(ip)
        cleaned++
      }
    }

    logger.info({ type: 'expired_rules_cleaned', count: cleaned }, `${cleaned} reglas expiradas limpias`)
    return cleaned
  }
}

let globalIPProtectionManager: IPProtectionManager | null = null

export function initializeIPProtectionManager(): IPProtectionManager {
  if (!globalIPProtectionManager) {
    globalIPProtectionManager = new IPProtectionManager()
  }
  return globalIPProtectionManager
}

export function getIPProtectionManager(): IPProtectionManager {
  if (!globalIPProtectionManager) {
    return initializeIPProtectionManager()
  }
  return globalIPProtectionManager
}
