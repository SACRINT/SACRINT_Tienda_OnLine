/**
 * Autocomplete & Search Suggestions
 * Semana 39, Tarea 39.5: Autocomplete & Search Suggestions
 */

import { logger } from '@/lib/monitoring'

export interface AutocompleteSuggestion {
  text: string
  type: 'search_term' | 'product' | 'category' | 'brand'
  popularity: number
  resultCount: number
  metadata?: Record<string, any>
}

export interface AutocompleteRequest {
  query: string
  limit?: number
  types?: string[]
  context?: 'category' | 'price_range'
  contextValue?: string
}

export interface AutocompleteResponse {
  query: string
  suggestions: AutocompleteSuggestion[]
  timestamp: Date
  responseTime: number
}

export interface SearchSuggestion {
  id: string
  type: 'typo_correction' | 'expansion' | 'related' | 'trending'
  original: string
  suggestion: string
  confidence: number
  clicks: number
}

export class AutocompleteManager {
  private suggestions: Map<string, AutocompleteSuggestion> = new Map()
  private trie: Map<string, string[]> = new Map() // Trie para autocomplete
  private searchSuggestions: Map<string, SearchSuggestion> = new Map()
  private popularQueries: Map<string, number> = new Map()

  constructor() {
    logger.debug({ type: 'autocomplete_init' }, 'Autocomplete Manager inicializado')
  }

  /**
   * Registrar búsqueda
   */
  recordSearch(query: string, resultCount: number): void {
    this.popularQueries.set(query, (this.popularQueries.get(query) || 0) + 1)

    // Agregar a sugerencias
    if (!this.suggestions.has(query)) {
      this.suggestions.set(query, {
        text: query,
        type: 'search_term',
        popularity: 1,
        resultCount,
      })
    } else {
      const suggestion = this.suggestions.get(query)!
      suggestion.popularity++
      suggestion.resultCount = resultCount
    }

    // Actualizar trie
    this.updateTrie(query)
  }

  /**
   * Actualizar estructura Trie
   */
  private updateTrie(query: string): void {
    const lower = query.toLowerCase()

    for (let i = 1; i <= lower.length; i++) {
      const prefix = lower.substring(0, i)
      if (!this.trie.has(prefix)) {
        this.trie.set(prefix, [])
      }

      const suggestions = this.trie.get(prefix)!
      if (!suggestions.includes(lower)) {
        suggestions.push(lower)
      }
    }
  }

  /**
   * Obtener autocomplete
   */
  getAutocomplete(request: AutocompleteRequest): AutocompleteResponse {
    const startTime = Date.now()

    try {
      const limit = request.limit || 10
      const query = request.query.toLowerCase()

      // Obtener de trie
      const trieMatches = this.trie.get(query) || []

      // Convertir a sugerencias y ordenar por popularidad
      let results = trieMatches
        .map((match) => this.suggestions.get(match))
        .filter((s): s is AutocompleteSuggestion => s !== null)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit)

      // Filtrar por tipo si se especifica
      if (request.types && request.types.length > 0) {
        results = results.filter((r) => request.types!.includes(r.type))
      }

      // Aplicar contexto si existe
      if (request.context === 'price_range' && request.contextValue) {
        const priceRange = request.contextValue.split('-').map(Number)
        results = results.filter(
          (r) => r.metadata?.minPrice >= priceRange[0] && r.metadata?.maxPrice <= priceRange[1],
        )
      }

      const responseTime = Date.now() - startTime

      logger.debug(
        { type: 'autocomplete_executed', query: request.query, resultCount: results.length, responseTime },
        `Autocomplete ejecutado: ${results.length} sugerencias`,
      )

      return {
        query: request.query,
        suggestions: results,
        timestamp: new Date(),
        responseTime,
      }
    } catch (error) {
      logger.error({ type: 'autocomplete_error', query: request.query, error: String(error) }, 'Error en autocomplete')
      return {
        query: request.query,
        suggestions: [],
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Agregar sugerencia personalizada
   */
  addSuggestion(suggestion: AutocompleteSuggestion): void {
    this.suggestions.set(suggestion.text, suggestion)
    this.updateTrie(suggestion.text)

    logger.debug(
      { type: 'suggestion_added', text: suggestion.text, type: suggestion.type },
      `Sugerencia agregada: ${suggestion.text}`,
    )
  }

  /**
   * Corregir typos
   */
  correctTypo(misspelled: string, correct: string, confidence: number): void {
    const suggestion: SearchSuggestion = {
      id: `typo_${Date.now()}`,
      type: 'typo_correction',
      original: misspelled,
      suggestion: correct,
      confidence,
      clicks: 0,
    }

    this.searchSuggestions.set(misspelled, suggestion)

    logger.debug({ type: 'typo_correction_added', misspelled, correct }, `Corrección de typo: ${misspelled} → ${correct}`)
  }

  /**
   * Obtener búsquedas populares
   */
  getPopularSearches(limit: number = 10): AutocompleteSuggestion[] {
    return Array.from(this.suggestions.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  /**
   * Obtener sugerencias relacionadas
   */
  getRelatedSuggestions(query: string, limit: number = 5): AutocompleteSuggestion[] {
    const queryLower = query.toLowerCase()

    return Array.from(this.suggestions.values())
      .filter((s) => s.text !== queryLower && s.text.includes(queryLower))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  /**
   * Registrar click en sugerencia
   */
  recordSuggestionClick(suggestion: string): void {
    const searchSuggestion = this.searchSuggestions.get(suggestion)
    if (searchSuggestion) {
      searchSuggestion.clicks++
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalSuggestions: number
    popularQueries: number
    averagePopularity: number
    uniquePrefixes: number
  } {
    const suggestions = Array.from(this.suggestions.values())

    return {
      totalSuggestions: suggestions.length,
      popularQueries: Array.from(this.popularQueries.values()).filter((count) => count > 1).length,
      averagePopularity: suggestions.length > 0 ? suggestions.reduce((sum, s) => sum + s.popularity, 0) / suggestions.length : 0,
      uniquePrefixes: this.trie.size,
    }
  }
}

let globalAutocompleteManager: AutocompleteManager | null = null

export function initializeAutocompleteManager(): AutocompleteManager {
  if (!globalAutocompleteManager) {
    globalAutocompleteManager = new AutocompleteManager()
  }
  return globalAutocompleteManager
}

export function getAutocompleteManager(): AutocompleteManager {
  if (!globalAutocompleteManager) {
    return initializeAutocompleteManager()
  }
  return globalAutocompleteManager
}
