/**
 * Elasticsearch Integration & Full-Text Search
 * Semana 39, Tarea 39.1: Elasticsearch Integration & Full-Text Search
 */

import { logger } from '@/lib/monitoring'

export interface SearchIndex {
  id: string
  name: string
  type: 'products' | 'customers' | 'orders' | 'content'
  mappings: Record<string, any>
  settings: Record<string, any>
  analyzer?: string
  createdAt: Date
}

export interface SearchQuery {
  id: string
  query: string
  filters?: Record<string, any>
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>
  pagination?: { page: number; size: number }
  highlight?: string[]
  timestamp: Date
}

export interface SearchResult<T = any> {
  id: string
  score: number
  source: T
  highlights?: Record<string, string[]>
}

export interface SearchResponse<T = any> {
  queryId: string
  total: number
  results: SearchResult<T>[]
  took: number
  aggregations?: Record<string, any>
  facets?: Record<string, { count: number; value: string }[]>
}

export interface IndexDocument {
  id: string
  index: string
  type: string
  document: Record<string, any>
  timestamp: Date
}

export class ElasticsearchManager {
  private indices: Map<string, SearchIndex> = new Map()
  private documents: Map<string, IndexDocument[]> = new Map()
  private queries: Map<string, SearchQuery> = new Map()
  private searchStats: Map<string, { count: number; avgTime: number }> = new Map()

  constructor() {
    logger.debug({ type: 'elasticsearch_init' }, 'Elasticsearch Manager inicializado')
    this.initializeDefaultIndices()
  }

  /**
   * Inicializar índices por defecto
   */
  private initializeDefaultIndices(): void {
    const defaultIndices: SearchIndex[] = [
      {
        id: 'products_index',
        name: 'products',
        type: 'products',
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            category: { type: 'keyword' },
            price: { type: 'float' },
            rating: { type: 'float' },
            tags: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              standard: {
                type: 'standard',
                stopwords: '_english_',
              },
            },
          },
        },
        analyzer: 'standard',
        createdAt: new Date(),
      },
    ]

    for (const index of defaultIndices) {
      this.indices.set(index.id, index)
      this.documents.set(index.name, [])
    }

    logger.info({ type: 'default_indices_created' }, 'Índices por defecto creados')
  }

  /**
   * Crear índice
   */
  createIndex(index: SearchIndex): void {
    try {
      this.indices.set(index.id, index)
      this.documents.set(index.name, [])

      logger.info({ type: 'index_created', indexId: index.id, name: index.name }, `Índice creado: ${index.name}`)
    } catch (error) {
      logger.error({ type: 'index_creation_error', error: String(error) }, 'Error al crear índice')
    }
  }

  /**
   * Indexar documento
   */
  indexDocument(indexName: string, document: Record<string, any>): IndexDocument {
    try {
      const indexDoc: IndexDocument = {
        id: `doc_${Date.now()}_${Math.random()}`,
        index: indexName,
        type: 'document',
        document,
        timestamp: new Date(),
      }

      const docs = this.documents.get(indexName) || []
      docs.push(indexDoc)
      this.documents.set(indexName, docs)

      logger.debug({ type: 'document_indexed', indexName, docId: indexDoc.id }, `Documento indexado: ${indexName}`)

      return indexDoc
    } catch (error) {
      logger.error({ type: 'indexing_error', indexName, error: String(error) }, 'Error al indexar documento')
      throw error
    }
  }

  /**
   * Búsqueda full-text
   */
  search<T = any>(query: SearchQuery): SearchResponse<T> {
    const startTime = Date.now()

    try {
      const index = Array.from(this.indices.values()).find((i) => i.type === 'products')
      if (!index) {
        return {
          queryId: query.id,
          total: 0,
          results: [],
          took: 0,
        }
      }

      const docs = this.documents.get(index.name) || []

      // Filtrar por query
      let results = docs.filter((doc) => {
        const docText = JSON.stringify(doc.document).toLowerCase()
        const queryText = query.query.toLowerCase()

        // Búsqueda por palabras clave
        return queryText.split(' ').some((word) => docText.includes(word))
      })

      // Aplicar filtros
      if (query.filters) {
        results = results.filter((doc) => {
          for (const [key, value] of Object.entries(query.filters!)) {
            if (doc.document[key] !== value) {
              return false
            }
          }
          return true
        })
      }

      // Ordenar
      if (query.sort) {
        results.sort((a, b) => {
          for (const sort of query.sort!) {
            const aVal = a.document[sort.field]
            const bVal = b.document[sort.field]

            if (sort.order === 'asc') {
              if (aVal < bVal) return -1
              if (aVal > bVal) return 1
            } else {
              if (aVal > bVal) return -1
              if (aVal < bVal) return 1
            }
          }
          return 0
        })
      }

      // Paginar
      const { page = 1, size = 10 } = query.pagination || {}
      const start = (page - 1) * size
      const paginatedResults = results.slice(start, start + size)

      // Convertir a SearchResult
      const searchResults: SearchResult<T>[] = paginatedResults.map((doc) => ({
        id: doc.id,
        score: Math.random() * 10, // Simular relevancia
        source: doc.document as T,
      }))

      const took = Date.now() - startTime
      this.recordSearchMetric(index.name, took)

      return {
        queryId: query.id,
        total: results.length,
        results: searchResults,
        took,
      }
    } catch (error) {
      logger.error({ type: 'search_error', query: query.query, error: String(error) }, 'Error en búsqueda')
      return {
        queryId: query.id,
        total: 0,
        results: [],
        took: Date.now() - startTime,
      }
    }
  }

  /**
   * Búsqueda avanzada con agregaciones
   */
  advancedSearch<T = any>(
    query: SearchQuery,
    aggregations?: Record<string, { field: string; size?: number }>,
  ): SearchResponse<T> {
    const response = this.search<T>(query)

    // Agregar agregaciones
    if (aggregations) {
      response.aggregations = {}

      for (const [key, agg] of Object.entries(aggregations)) {
        const docs = this.documents.get(Array.from(this.indices.values())[0]?.name || '') || []
        const values = docs.map((d) => d.document[agg.field])
        const grouped = values.reduce(
          (acc, val) => {
            acc[val] = (acc[val] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        response.aggregations[key] = grouped
      }
    }

    return response
  }

  /**
   * Registrar métrica de búsqueda
   */
  private recordSearchMetric(indexName: string, time: number): void {
    const current = this.searchStats.get(indexName) || { count: 0, avgTime: 0 }
    const newCount = current.count + 1
    const newAvgTime = (current.avgTime * current.count + time) / newCount

    this.searchStats.set(indexName, { count: newCount, avgTime: newAvgTime })
  }

  /**
   * Obtener estadísticas de búsqueda
   */
  getSearchStats(indexName: string): { count: number; avgTime: number } | null {
    return this.searchStats.get(indexName) || null
  }

  /**
   * Eliminar documento
   */
  deleteDocument(indexName: string, docId: string): boolean {
    try {
      const docs = this.documents.get(indexName) || []
      const filtered = docs.filter((d) => d.id !== docId)
      this.documents.set(indexName, filtered)

      logger.debug({ type: 'document_deleted', indexName, docId }, `Documento eliminado`)
      return true
    } catch (error) {
      logger.error({ type: 'delete_error', indexName, error: String(error) }, 'Error al eliminar documento')
      return false
    }
  }

  /**
   * Actualizar documento
   */
  updateDocument(indexName: string, docId: string, updates: Record<string, any>): boolean {
    try {
      const docs = this.documents.get(indexName) || []
      const doc = docs.find((d) => d.id === docId)

      if (!doc) return false

      doc.document = { ...doc.document, ...updates }
      doc.timestamp = new Date()

      logger.debug({ type: 'document_updated', indexName, docId }, `Documento actualizado`)
      return true
    } catch (error) {
      logger.error({ type: 'update_error', indexName, error: String(error) }, 'Error al actualizar documento')
      return false
    }
  }

  /**
   * Bulk indexing
   */
  bulkIndex(indexName: string, documents: Record<string, any>[]): number {
    try {
      let count = 0

      for (const doc of documents) {
        this.indexDocument(indexName, doc)
        count++
      }

      logger.info({ type: 'bulk_index_completed', indexName, count }, `${count} documentos indexados en masa`)
      return count
    } catch (error) {
      logger.error({ type: 'bulk_index_error', indexName, error: String(error) }, 'Error en bulk indexing')
      return 0
    }
  }

  /**
   * Obtener índice
   */
  getIndex(indexId: string): SearchIndex | null {
    return this.indices.get(indexId) || null
  }

  /**
   * Obtener todos los índices
   */
  getAllIndices(): SearchIndex[] {
    return Array.from(this.indices.values())
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalIndices: number
    totalDocuments: number
    documentsByIndex: Record<string, number>
    averageSearchTime: number
  } {
    let totalDocuments = 0
    const documentsByIndex: Record<string, number> = {}
    let totalSearchTime = 0
    let searchCount = 0

    for (const [indexName, docs] of this.documents) {
      documentsByIndex[indexName] = docs.length
      totalDocuments += docs.length
    }

    for (const stat of this.searchStats.values()) {
      totalSearchTime += stat.avgTime
      searchCount++
    }

    return {
      totalIndices: this.indices.size,
      totalDocuments,
      documentsByIndex,
      averageSearchTime: searchCount > 0 ? totalSearchTime / searchCount : 0,
    }
  }
}

let globalElasticsearchManager: ElasticsearchManager | null = null

export function initializeElasticsearchManager(): ElasticsearchManager {
  if (!globalElasticsearchManager) {
    globalElasticsearchManager = new ElasticsearchManager()
  }
  return globalElasticsearchManager
}

export function getElasticsearchManager(): ElasticsearchManager {
  if (!globalElasticsearchManager) {
    return initializeElasticsearchManager()
  }
  return globalElasticsearchManager
}
