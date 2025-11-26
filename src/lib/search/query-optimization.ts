/**
 * Search Query Analysis & Optimization
 * Semana 39, Tarea 39.10: Search Query Analysis & Optimization
 */

import { logger } from '@/lib/monitoring'

export interface QueryOptimization {
  id: string
  originalQuery: string
  optimizedQuery: string
  optimizationType: 'expansion' | 'synonym' | 'correction' | 'stemming' | 'removal'
  improvement: number
  appliedDate: Date
}

export interface QueryNormalization {
  original: string
  normalized: string
  removedWords: string[]
  expandedTerms: string[]
}

export class QueryOptimizationManager {
  private synonyms: Map<string, string[]> = new Map()
  private stopWords: Set<string> = new Set()
  private optimizations: Map<string, QueryOptimization> = new Map()
  private queryLog: Array<{ query: string; timestamp: Date; resultCount: number }> = []

  constructor() {
    logger.debug({ type: 'query_optimization_init' }, 'Query Optimization Manager inicializado')
    this.initializeStopWords()
    this.initializeSynonyms()
  }

  /**
   * Inicializar stop words
   */
  private initializeStopWords(): void {
    const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y', 'o', 'que', 'por', 'para', 'con', 'en']

    for (const word of stopWords) {
      this.stopWords.add(word)
    }
  }

  /**
   * Inicializar sinónimos
   */
  private initializeSynonyms(): void {
    this.synonyms.set('laptop', ['computadora', 'notebook', 'pc'])
    this.synonyms.set('teléfono', ['celular', 'móvil', 'smartphone'])
    this.synonyms.set('tv', ['televisor', 'pantalla'])
    this.synonyms.set('cámara', ['cámara digital', 'cámara fotográfica'])
  }

  /**
   * Normalizar query
   */
  normalizeQuery(query: string): QueryNormalization {
    const original = query
    let normalized = query.toLowerCase().trim()

    const removedWords: string[] = []
    const expandedTerms: string[] = []

    // Remover stop words
    const words = normalized.split(' ')
    const filteredWords = words.filter((word) => {
      if (this.stopWords.has(word)) {
        removedWords.push(word)
        return false
      }
      return true
    })

    // Expandir sinónimos
    for (let i = 0; i < filteredWords.length; i++) {
      const synonyms = this.synonyms.get(filteredWords[i])
      if (synonyms) {
        expandedTerms.push(...synonyms)
      }
    }

    normalized = filteredWords.join(' ')

    return {
      original,
      normalized,
      removedWords,
      expandedTerms,
    }
  }

  /**
   * Optimizar query
   */
  optimizeQuery(query: string, resultCount: number): QueryOptimization {
    try {
      const normalized = this.normalizeQuery(query)

      let optimizedQuery = normalized.normalized
      let optimizationType: QueryOptimization['optimizationType'] = 'removal'
      let improvement = 0

      // Si hay términos expandibles, sugerirlos
      if (normalized.expandedTerms.length > 0) {
        optimizedQuery = `${normalized.normalized} OR ${normalized.expandedTerms.join(' OR ')}`
        optimizationType = 'expansion'
        improvement = 0.2
      }

      // Si no hay resultados, remover más palabras
      if (resultCount === 0 && normalized.removedWords.length === 0) {
        optimizedQuery = normalized.normalized.split(' ')[0]
        optimizationType = 'removal'
        improvement = 0.15
      }

      const optimization: QueryOptimization = {
        id: `opt_${Date.now()}`,
        originalQuery: query,
        optimizedQuery,
        optimizationType,
        improvement,
        appliedDate: new Date(),
      }

      this.optimizations.set(optimization.id, optimization)

      logger.info(
        { type: 'query_optimized', original: query, optimized: optimizedQuery, type: optimizationType },
        `Query optimizada: ${query} → ${optimizedQuery}`,
      )

      return optimization
    } catch (error) {
      logger.error({ type: 'optimization_error', query, error: String(error) }, 'Error al optimizar query')
      throw error
    }
  }

  /**
   * Registrar query
   */
  recordQuery(query: string, resultCount: number): void {
    this.queryLog.push({ query, timestamp: new Date(), resultCount })

    // Limitar historial
    if (this.queryLog.length > 10000) {
      this.queryLog = this.queryLog.slice(-10000)
    }
  }

  /**
   * Obtener queries sin resultados
   */
  getZeroResultQueries(): Array<{ query: string; count: number }> {
    const grouped = new Map<string, number>()

    for (const entry of this.queryLog) {
      if (entry.resultCount === 0) {
        grouped.set(entry.query, (grouped.get(entry.query) || 0) + 1)
      }
    }

    return Array.from(grouped.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Agregar sinónimo
   */
  addSynonym(term: string, synonyms: string[]): void {
    this.synonyms.set(term, synonyms)
    logger.debug({ type: 'synonym_added', term, synonyms: synonyms.join(', ') }, `Sinónimo agregado: ${term}`)
  }

  /**
   * Obtener mejores optimizaciones
   */
  getBestOptimizations(limit: number = 10): QueryOptimization[] {
    return Array.from(this.optimizations.values())
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, limit)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalQueries: number
    zeroResultQueries: number
    averageResultCount: number
    uniqueQueries: number
  } {
    const unique = new Set(this.queryLog.map((q) => q.query))
    let zeroResults = 0
    let totalResults = 0

    for (const entry of this.queryLog) {
      if (entry.resultCount === 0) zeroResults++
      totalResults += entry.resultCount
    }

    return {
      totalQueries: this.queryLog.length,
      zeroResultQueries: zeroResults,
      averageResultCount: this.queryLog.length > 0 ? totalResults / this.queryLog.length : 0,
      uniqueQueries: unique.size,
    }
  }
}

let globalQueryOptimizationManager: QueryOptimizationManager | null = null

export function initializeQueryOptimizationManager(): QueryOptimizationManager {
  if (!globalQueryOptimizationManager) {
    globalQueryOptimizationManager = new QueryOptimizationManager()
  }
  return globalQueryOptimizationManager
}

export function getQueryOptimizationManager(): QueryOptimizationManager {
  if (!globalQueryOptimizationManager) {
    return initializeQueryOptimizationManager()
  }
  return globalQueryOptimizationManager
}
