/**
 * Database Connection Pooling
 * Semana 43, Tarea 43.4: Database Connection Pooling
 */

import { logger } from '@/lib/monitoring'

export interface PoolConnection {
  id: string
  connectionString: string
  isActive: boolean
  inUse: boolean
  createdAt: Date
  lastUsedAt: Date
  queryCount: number
}

export interface PoolConfig {
  min: number
  max: number
  idleTimeout: number
  acquireTimeout: number
}

export class ConnectionPoolingManager {
  private connections: Map<string, PoolConnection> = new Map()
  private config: PoolConfig
  private waitQueue: Array<{ resolve: (conn: PoolConnection) => void; reject: () => void }> = []

  constructor(config?: PoolConfig) {
    this.config = config || {
      min: 5,
      max: 20,
      idleTimeout: 300000, // 5 min
      acquireTimeout: 30000, // 30 sec
    }
    logger.debug({ type: 'connection_pooling_init' }, 'Connection Pooling Manager inicializado')
    this.initializePool()
  }

  /**
   * Inicializar pool
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.min; i++) {
      this.createConnection()
    }
    logger.info({ type: 'pool_initialized', size: this.config.min }, `Pool inicializado con ${this.config.min} conexiones`)
  }

  /**
   * Crear conexión
   */
  private createConnection(): PoolConnection {
    const connection: PoolConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connectionString: '',
      isActive: true,
      inUse: false,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      queryCount: 0,
    }

    this.connections.set(connection.id, connection)
    return connection
  }

  /**
   * Adquirir conexión
   */
  async acquireConnection(): Promise<PoolConnection> {
    // Buscar conexión disponible
    for (const conn of this.connections.values()) {
      if (conn.isActive && !conn.inUse) {
        conn.inUse = true
        conn.lastUsedAt = new Date()
        return conn
      }
    }

    // Crear nueva si hay espacio
    if (this.connections.size < this.config.max) {
      const newConn = this.createConnection()
      newConn.inUse = true
      return newConn
    }

    // Esperar en cola
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(reject, this.config.acquireTimeout)
      this.waitQueue.push({
        resolve: (conn) => {
          clearTimeout(timeout)
          resolve(conn)
        },
        reject,
      })
    })
  }

  /**
   * Liberar conexión
   */
  releaseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.inUse = false
    connection.queryCount++

    // Procesar cola de espera
    if (this.waitQueue.length > 0) {
      const { resolve } = this.waitQueue.shift()!
      connection.inUse = true
      resolve(connection)
    }

    logger.debug({ type: 'connection_released', connectionId }, 'Conexión liberada')
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    total: number
    active: number
    inUse: number
    available: number
    waitingQueue: number
  } {
    const total = this.connections.size
    const active = Array.from(this.connections.values()).filter((c) => c.isActive).length
    const inUse = Array.from(this.connections.values()).filter((c) => c.inUse).length
    const available = active - inUse

    return {
      total,
      active,
      inUse,
      available,
      waitingQueue: this.waitQueue.length,
    }
  }

  /**
   * Limpiar conexiones inactivas
   */
  cleanupIdleConnections(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [id, conn] of this.connections) {
      const idle = now - conn.lastUsedAt.getTime()
      if (idle > this.config.idleTimeout && !conn.inUse) {
        this.connections.delete(id)
        cleaned++
      }
    }

    logger.info({ type: 'idle_connections_cleaned', count: cleaned }, `${cleaned} conexiones inactivas limpias`)
    return cleaned
  }

  /**
   * Generar reporte
   */
  generatePoolReport(): string {
    const stats = this.getStatistics()

    return `
=== REPORTE DE CONNECTION POOL ===

CONFIGURACIÓN:
- Mínimo: ${this.config.min}
- Máximo: ${this.config.max}
- Timeout Ocioso: ${this.config.idleTimeout}ms
- Timeout Adquisición: ${this.config.acquireTimeout}ms

ESTADO:
- Total de Conexiones: ${stats.total}
- Conexiones Activas: ${stats.active}
- En Uso: ${stats.inUse}
- Disponibles: ${stats.available}
- Esperando en Cola: ${stats.waitingQueue}

UTILIZACIÓN: ${((stats.inUse / stats.active) * 100).toFixed(2)}%
    `
  }
}

let globalConnectionPoolingManager: ConnectionPoolingManager | null = null

export function initializeConnectionPoolingManager(config?: PoolConfig): ConnectionPoolingManager {
  if (!globalConnectionPoolingManager) {
    globalConnectionPoolingManager = new ConnectionPoolingManager(config)
  }
  return globalConnectionPoolingManager
}

export function getConnectionPoolingManager(): ConnectionPoolingManager {
  if (!globalConnectionPoolingManager) {
    return initializeConnectionPoolingManager()
  }
  return globalConnectionPoolingManager
}
