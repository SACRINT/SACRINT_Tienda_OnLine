/**
 * Index Management
 * Semana 44, Tarea 44.2: Index Management
 */

import { logger } from '@/lib/monitoring'

export interface DbIndex {
  id: string
  name: string
  table: string
  columns: string[]
  type: 'btree' | 'hash' | 'fulltext'
  isActive: boolean
  createdAt: Date
  usageCount: number
}

export interface IndexAnalysis {
  indexId: string
  usagePercent: number
  redundant: boolean
  suggestion: string
}

export class IndexManagementManager {
  private indexes: Map<string, DbIndex> = new Map()
  private usageStats: Map<string, number> = new Map()

  constructor() {
    logger.debug({ type: 'index_management_init' }, 'Index Management Manager inicializado')
  }

  /**
   * Crear índice
   */
  createIndex(name: string, table: string, columns: string[], type: 'btree' | 'hash' | 'fulltext' = 'btree'): DbIndex {
    const index: DbIndex = {
      id: `idx_${Date.now()}`,
      name,
      table,
      columns,
      type,
      isActive: true,
      createdAt: new Date(),
      usageCount: 0,
    }

    this.indexes.set(index.id, index)
    logger.info({ type: 'index_created', name, table, columns }, `Índice creado: ${name}`)

    return index
  }

  /**
   * Registrar uso
   */
  recordIndexUsage(indexId: string): void {
    const index = this.indexes.get(indexId)
    if (index) {
      index.usageCount++
      this.usageStats.set(indexId, (this.usageStats.get(indexId) || 0) + 1)
    }
  }

  /**
   * Analizar índices
   */
  analyzeIndexes(): IndexAnalysis[] {
    const totalUsage = Array.from(this.usageStats.values()).reduce((a, b) => a + b, 0)
    const analyses: IndexAnalysis[] = []

    for (const [id, index] of this.indexes) {
      const usage = this.usageStats.get(id) || 0
      const usagePercent = totalUsage > 0 ? (usage / totalUsage) * 100 : 0
      const redundant = usagePercent < 5 && index.usageCount < 100

      analyses.push({
        indexId: id,
        usagePercent: Math.round(usagePercent * 100) / 100,
        redundant,
        suggestion: redundant ? `Considerar eliminar índice no usado: ${index.name}` : 'Índice en uso óptimo',
      })
    }

    return analyses
  }

  /**
   * Obtener índices no usados
   */
  getUnusedIndexes(): DbIndex[] {
    return Array.from(this.indexes.values()).filter((idx) => idx.usageCount === 0)
  }

  /**
   * Generar reporte
   */
  generateIndexReport(): string {
    const analyses = this.analyzeIndexes()
    const unused = this.getUnusedIndexes()

    const report = `
=== REPORTE DE GESTIÓN DE ÍNDICES ===

TOTAL DE ÍNDICES: ${this.indexes.size}
ÍNDICES NO USADOS: ${unused.length}

RECOMENDACIONES:
${analyses.filter((a) => a.redundant).map((a) => `- ${a.suggestion}`).join('\n')}

ANÁLISIS DE USO:
${analyses.slice(0, 5).map((a) => `- ${a.usagePercent}% de uso`).join('\n')}
    `

    logger.info({ type: 'index_report_generated' }, 'Reporte de índices generado')
    return report
  }
}

let globalIndexManagementManager: IndexManagementManager | null = null

export function initializeIndexManagementManager(): IndexManagementManager {
  if (!globalIndexManagementManager) {
    globalIndexManagementManager = new IndexManagementManager()
  }
  return globalIndexManagementManager
}

export function getIndexManagementManager(): IndexManagementManager {
  if (!globalIndexManagementManager) {
    return initializeIndexManagementManager()
  }
  return globalIndexManagementManager
}
