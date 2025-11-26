/**
 * Memory Management
 * Semana 43, Tarea 43.7: Memory Management
 */

import { logger } from '@/lib/monitoring'

export interface MemorySnapshot {
  timestamp: Date
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  gcDuration: number
}

export interface MemoryWarning {
  level: 'warning' | 'critical'
  message: string
  threshold: number
  currentUsage: number
  timestamp: Date
}

export class MemoryManagementManager {
  private snapshots: MemorySnapshot[] = []
  private warnings: MemoryWarning[] = []
  private warningThreshold: number = 0.8 // 80% de uso
  private criticalThreshold: number = 0.95 // 95% de uso

  constructor() {
    logger.debug({ type: 'memory_management_init' }, 'Memory Management Manager inicializado')
    this.startMonitoring()
  }

  /**
   * Tomar snapshot de memoria
   */
  captureSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage()

    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      gcDuration: 0,
    }

    this.snapshots.push(snapshot)

    // Mantener últimos 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift()
    }

    // Verificar umbrales
    this.checkMemoryThresholds(snapshot)

    return snapshot
  }

  /**
   * Verificar umbrales de memoria
   */
  private checkMemoryThresholds(snapshot: MemorySnapshot): void {
    const heapUsageRatio = snapshot.heapUsed / snapshot.heapTotal

    if (heapUsageRatio > this.criticalThreshold) {
      this.createWarning('critical', `Memoria crítica: ${(heapUsageRatio * 100).toFixed(2)}%`, this.criticalThreshold, heapUsageRatio)
    } else if (heapUsageRatio > this.warningThreshold) {
      this.createWarning('warning', `Advertencia de memoria: ${(heapUsageRatio * 100).toFixed(2)}%`, this.warningThreshold, heapUsageRatio)
    }
  }

  /**
   * Crear advertencia
   */
  private createWarning(level: 'warning' | 'critical', message: string, threshold: number, currentUsage: number): void {
    const warning: MemoryWarning = {
      level,
      message,
      threshold,
      currentUsage,
      timestamp: new Date(),
    }

    this.warnings.push(warning)

    logger.warn({ type: 'memory_warning', level, usage: (currentUsage * 100).toFixed(2) }, message)
  }

  /**
   * Forzar recolección de basura
   */
  forceGarbageCollection(): void {
    if (global.gc) {
      const before = process.memoryUsage()
      global.gc()
      const after = process.memoryUsage()
      const freed = before.heapUsed - after.heapUsed

      logger.info({ type: 'garbage_collection_forced', freed }, `Recolección de basura: ${(freed / 1024 / 1024).toFixed(2)}MB liberados`)
    }
  }

  /**
   * Obtener estadísticas actuales
   */
  getCurrentMemoryStats(): {
    heapUsed: number
    heapTotal: number
    heapUsagePercent: number
    externalMemory: number
    rss: number
  } {
    const memUsage = process.memoryUsage()
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
      externalMemory: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    }
  }

  /**
   * Obtener tendencias
   */
  getMemoryTrends(): {
    avg: number
    min: number
    max: number
    trend: 'stable' | 'increasing' | 'decreasing'
  } {
    if (this.snapshots.length < 2) {
      return { avg: 0, min: 0, max: 0, trend: 'stable' }
    }

    const heapUsages = this.snapshots.map((s) => s.heapUsed)
    const avg = heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length
    const min = Math.min(...heapUsages)
    const max = Math.max(...heapUsages)

    // Determinar tendencia
    const recent = heapUsages.slice(-10)
    const older = heapUsages.slice(-20, -10)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable'
    if (recentAvg > olderAvg * 1.1) trend = 'increasing'
    else if (recentAvg < olderAvg * 0.9) trend = 'decreasing'

    return {
      avg: Math.round(avg / 1024 / 1024),
      min: Math.round(min / 1024 / 1024),
      max: Math.round(max / 1024 / 1024),
      trend,
    }
  }

  /**
   * Iniciar monitoreo automático
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.captureSnapshot()
    }, 60000) // Cada minuto
  }

  /**
   * Generar reporte
   */
  generateMemoryReport(): string {
    const stats = this.getCurrentMemoryStats()
    const trends = this.getMemoryTrends()

    return `
=== REPORTE DE GESTIÓN DE MEMORIA ===

ESTADO ACTUAL:
- Heap Usado: ${stats.heapUsed}MB
- Heap Total: ${stats.heapTotal}MB
- Uso: ${stats.heapUsagePercent}%
- Memoria Externa: ${stats.externalMemory}MB
- RSS: ${stats.rss}MB

TENDENCIAS:
- Promedio: ${trends.avg}MB
- Mínimo: ${trends.min}MB
- Máximo: ${trends.max}MB
- Tendencia: ${trends.trend}

ADVERTENCIAS:
- Total: ${this.warnings.length}
- Críticas: ${this.warnings.filter((w) => w.level === 'critical').length}
    `
  }
}

let globalMemoryManagementManager: MemoryManagementManager | null = null

export function initializeMemoryManagementManager(): MemoryManagementManager {
  if (!globalMemoryManagementManager) {
    globalMemoryManagementManager = new MemoryManagementManager()
  }
  return globalMemoryManagementManager
}

export function getMemoryManagementManager(): MemoryManagementManager {
  if (!globalMemoryManagementManager) {
    return initializeMemoryManagementManager()
  }
  return globalMemoryManagementManager
}
