/**
 * Load Balancing
 * Semana 43, Tarea 43.5: Load Balancing
 */

import { logger } from '@/lib/monitoring'

export interface Server {
  id: string
  address: string
  port: number
  weight: number
  isHealthy: boolean
  connectionCount: number
  totalRequests: number
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash'
  servers: Server[]
}

export class LoadBalancingManager {
  private servers: Map<string, Server> = new Map()
  private strategy: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' = 'round-robin'
  private currentIndex: number = 0
  private requestLogs: Array<{ serverId: string; timestamp: Date; responseTime: number }> = []

  constructor() {
    logger.debug({ type: 'load_balancing_init' }, 'Load Balancing Manager inicializado')
  }

  /**
   * Registrar servidor
   */
  registerServer(id: string, address: string, port: number, weight: number = 1): Server {
    const server: Server = {
      id,
      address,
      port,
      weight,
      isHealthy: true,
      connectionCount: 0,
      totalRequests: 0,
    }

    this.servers.set(id, server)
    logger.info({ type: 'server_registered', serverId: id }, `Servidor registrado: ${address}:${port}`)

    return server
  }

  /**
   * Establecer estrategia de balanceo
   */
  setStrategy(strategy: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash'): void {
    this.strategy = strategy
    logger.info({ type: 'strategy_changed', strategy }, `Estrategia cambiada a: ${strategy}`)
  }

  /**
   * Seleccionar servidor
   */
  selectServer(clientIp?: string): Server | null {
    const healthyServers = Array.from(this.servers.values()).filter((s) => s.isHealthy)
    if (healthyServers.length === 0) return null

    if (this.strategy === 'round-robin') {
      return this.roundRobin(healthyServers)
    } else if (this.strategy === 'least-connections') {
      return this.leastConnections(healthyServers)
    } else if (this.strategy === 'weighted') {
      return this.weighted(healthyServers)
    } else if (this.strategy === 'ip-hash' && clientIp) {
      return this.ipHash(healthyServers, clientIp)
    }

    return healthyServers[0]
  }

  /**
   * Round Robin
   */
  private roundRobin(servers: Server[]): Server {
    const server = servers[this.currentIndex % servers.length]
    this.currentIndex++
    return server
  }

  /**
   * Least Connections
   */
  private leastConnections(servers: Server[]): Server {
    return servers.reduce((min, server) => (server.connectionCount < min.connectionCount ? server : min))
  }

  /**
   * Weighted
   */
  private weighted(servers: Server[]): Server {
    const totalWeight = servers.reduce((sum, s) => sum + s.weight, 0)
    let random = Math.random() * totalWeight
    let selected = servers[0]

    for (const server of servers) {
      random -= server.weight
      if (random <= 0) {
        selected = server
        break
      }
    }

    return selected
  }

  /**
   * IP Hash
   */
  private ipHash(servers: Server[], clientIp: string): Server {
    const hash = clientIp.split('.').reduce((sum, part) => sum + parseInt(part), 0)
    return servers[hash % servers.length]
  }

  /**
   * Registrar solicitud
   */
  logRequest(serverId: string, responseTime: number): void {
    const server = this.servers.get(serverId)
    if (server) {
      server.totalRequests++
      this.requestLogs.push({ serverId, timestamp: new Date(), responseTime })
    }
  }

  /**
   * Marcar servidor como no saludable
   */
  markUnhealthy(serverId: string): void {
    const server = this.servers.get(serverId)
    if (server) {
      server.isHealthy = false
      logger.warn({ type: 'server_unhealthy', serverId }, `Servidor marcado como no saludable: ${serverId}`)
    }
  }

  /**
   * Marcar servidor como saludable
   */
  markHealthy(serverId: string): void {
    const server = this.servers.get(serverId)
    if (server) {
      server.isHealthy = true
      logger.info({ type: 'server_healthy', serverId }, `Servidor marcado como saludable: ${serverId}`)
    }
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    totalServers: number
    healthyServers: number
    totalRequests: number
    avgResponseTime: number
  } {
    const servers = Array.from(this.servers.values())
    const totalRequests = servers.reduce((sum, s) => sum + s.totalRequests, 0)
    const avgResponseTime = this.requestLogs.length > 0 ? this.requestLogs.reduce((sum, r) => sum + r.responseTime, 0) / this.requestLogs.length : 0

    return {
      totalServers: servers.length,
      healthyServers: servers.filter((s) => s.isHealthy).length,
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
    }
  }
}

let globalLoadBalancingManager: LoadBalancingManager | null = null

export function initializeLoadBalancingManager(): LoadBalancingManager {
  if (!globalLoadBalancingManager) {
    globalLoadBalancingManager = new LoadBalancingManager()
  }
  return globalLoadBalancingManager
}

export function getLoadBalancingManager(): LoadBalancingManager {
  if (!globalLoadBalancingManager) {
    return initializeLoadBalancingManager()
  }
  return globalLoadBalancingManager
}
