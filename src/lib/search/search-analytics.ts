/**
 * Search Analytics & Insights
 * Semana 39, Tarea 39.3: Search Analytics & Insights
 */

import { logger } from '@/lib/monitoring'

export interface SearchEvent {
  id: string
  query: string
  userId?: string
  resultsCount: number
  clickedResultIndex?: number
  clickedProductId?: string
  conversionValue?: number
  durationMs: number
  timestamp: Date
}

export interface SearchTerm {
  term: string
  searchCount: number
  resultCount: number
  clickThroughRate: number
  conversionRate: number
  averageDuration: number
  lastSearched: Date
}

export interface SearchInsight {
  id: string
  type: 'trending' | 'declining' | 'no-results' | 'low-ctr' | 'opportunity'
  term?: string
  metric: number
  recommendation: string
  timestamp: Date
}

export interface SearchMetrics {
  totalSearches: number
  uniqueTerms: number
  averageResultsPerSearch: number
  clickThroughRate: number
  conversionRate: number
  averageSearchDuration: number
  zeroResultsRate: number
}

export class SearchAnalyticsManager {
  private events: Map<string, SearchEvent> = new Map()
  private searchTerms: Map<string, SearchTerm> = new Map()
  private insights: Map<string, SearchInsight> = new Map()
  private sessionData: Map<string, SearchEvent[]> = new Map()

  constructor() {
    logger.debug({ type: 'search_analytics_init' }, 'Search Analytics Manager inicializado')
  }

  /**
   * Registrar evento de búsqueda
   */
  recordSearchEvent(event: Omit<SearchEvent, 'id'>): SearchEvent {
    try {
      const searchEvent: SearchEvent = {
        id: `search_${Date.now()}_${Math.random()}`,
        ...event,
        timestamp: new Date(),
      }

      this.events.set(searchEvent.id, searchEvent)

      // Actualizar términos de búsqueda
      this.updateSearchTerm(event.query, event)

      // Registrar en sesión
      const sessionKey = event.userId || 'anonymous'
      const session = this.sessionData.get(sessionKey) || []
      session.push(searchEvent)
      this.sessionData.set(sessionKey, session)

      // Generar insights automáticos
      this.generateInsights(event.query)

      logger.debug(
        { type: 'search_event_recorded', query: event.query, resultsCount: event.resultsCount },
        `Evento de búsqueda registrado: ${event.query}`,
      )

      return searchEvent
    } catch (error) {
      logger.error({ type: 'search_event_error', error: String(error) }, 'Error al registrar evento de búsqueda')
      throw error
    }
  }

  /**
   * Actualizar término de búsqueda
   */
  private updateSearchTerm(term: string, event: Omit<SearchEvent, 'id'>): void {
    const current = this.searchTerms.get(term) || {
      term,
      searchCount: 0,
      resultCount: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      averageDuration: 0,
      lastSearched: new Date(),
    }

    current.searchCount++
    current.resultCount = event.resultsCount
    current.averageDuration = (current.averageDuration * (current.searchCount - 1) + event.durationMs) / current.searchCount
    current.lastSearched = new Date()

    if (event.clickedProductId) {
      current.clickThroughRate = (current.clickThroughRate * (current.searchCount - 1) + 1) / current.searchCount
    }

    if (event.conversionValue) {
      current.conversionRate = (current.conversionRate * (current.searchCount - 1) + 1) / current.searchCount
    }

    this.searchTerms.set(term, current)
  }

  /**
   * Generar insights automáticos
   */
  private generateInsights(term: string): void {
    const searchTerm = this.searchTerms.get(term)
    if (!searchTerm) return

    // Detectar búsquedas sin resultados
    if (searchTerm.resultCount === 0) {
      this.addInsight({
        id: `insight_${Date.now()}`,
        type: 'no-results',
        term,
        metric: searchTerm.searchCount,
        recommendation: `Considera mejorar el índice para "${term}" o agregar productos similares`,
        timestamp: new Date(),
      })
    }

    // Detectar bajo CTR
    if (searchTerm.clickThroughRate < 0.2 && searchTerm.searchCount > 5) {
      this.addInsight({
        id: `insight_${Date.now()}`,
        type: 'low-ctr',
        term,
        metric: searchTerm.clickThroughRate,
        recommendation: `La búsqueda "${term}" tiene bajo CTR. Revisa la relevancia de los resultados`,
        timestamp: new Date(),
      })
    }
  }

  /**
   * Agregar insight
   */
  private addInsight(insight: SearchInsight): void {
    this.insights.set(insight.id, insight)
  }

  /**
   * Obtener término de búsqueda
   */
  getSearchTerm(term: string): SearchTerm | null {
    return this.searchTerms.get(term) || null
  }

  /**
   * Obtener términos principales
   */
  getTopSearchTerms(limit: number = 10): SearchTerm[] {
    return Array.from(this.searchTerms.values())
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, limit)
  }

  /**
   * Obtener términos sin resultados
   */
  getNoResultsTerms(): SearchTerm[] {
    return Array.from(this.searchTerms.values()).filter((t) => t.resultCount === 0)
  }

  /**
   * Obtener términos tendencia
   */
  getTrendingTerms(limit: number = 10, timeWindowHours: number = 24): SearchTerm[] {
    const cutoff = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000)

    const recentSearches = Array.from(this.events.values()).filter((e) => e.timestamp > cutoff)

    const grouped = new Map<string, number>()
    for (const search of recentSearches) {
      grouped.set(search.query, (grouped.get(search.query) || 0) + 1)
    }

    return Array.from(grouped.entries())
      .map(([term]) => this.getSearchTerm(term))
      .filter((t): t is SearchTerm => t !== null)
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, limit)
  }

  /**
   * Obtener insights
   */
  getInsights(type?: string): SearchInsight[] {
    const insights = Array.from(this.insights.values())
    return type ? insights.filter((i) => i.type === type) : insights
  }

  /**
   * Obtener métricas de búsqueda
   */
  getMetrics(): SearchMetrics {
    const events = Array.from(this.events.values())
    const uniqueTerms = new Set(events.map((e) => e.query)).size

    let totalClicks = 0
    let totalConversions = 0
    let totalZeroResults = 0
    let totalDuration = 0

    for (const event of events) {
      if (event.clickedProductId) totalClicks++
      if (event.conversionValue) totalConversions++
      if (event.resultsCount === 0) totalZeroResults++
      totalDuration += event.durationMs
    }

    return {
      totalSearches: events.length,
      uniqueTerms,
      averageResultsPerSearch: events.length > 0 ? events.reduce((sum, e) => sum + e.resultsCount, 0) / events.length : 0,
      clickThroughRate: events.length > 0 ? totalClicks / events.length : 0,
      conversionRate: events.length > 0 ? totalConversions / events.length : 0,
      averageSearchDuration: events.length > 0 ? totalDuration / events.length : 0,
      zeroResultsRate: events.length > 0 ? totalZeroResults / events.length : 0,
    }
  }

  /**
   * Obtener sesiones de usuario
   */
  getUserSearchSession(userId: string): SearchEvent[] {
    return this.sessionData.get(userId) || []
  }

  /**
   * Generar reporte de búsqueda
   */
  generateSearchReport(days: number = 30): string {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const recentEvents = Array.from(this.events.values()).filter((e) => e.timestamp > cutoff)

    const topTerms = this.getTopSearchTerms(10)
    const noResultTerms = this.getNoResultsTerms()
    const metrics = this.getMetrics()

    let report = `
╔════════════════════════════════════════════════════════════╗
║             SEARCH ANALYTICS REPORT
╚════════════════════════════════════════════════════════════╝

Period: Last ${days} days
Total Searches: ${recentEvents.length}
Unique Terms: ${metrics.uniqueTerms}

Performance Metrics:
  Click-Through Rate: ${(metrics.clickThroughRate * 100).toFixed(2)}%
  Conversion Rate: ${(metrics.conversionRate * 100).toFixed(2)}%
  Zero Results Rate: ${(metrics.zeroResultsRate * 100).toFixed(2)}%
  Avg Search Duration: ${metrics.averageSearchDuration.toFixed(0)}ms

Top 10 Search Terms:
${topTerms.map((t) => `  ${t.term}: ${t.searchCount} searches (CTR: ${(t.clickThroughRate * 100).toFixed(1)}%)`).join('\n')}

${noResultTerms.length > 0 ? `\nNo Results Terms (${noResultTerms.length}):\n${noResultTerms.map((t) => `  ${t.term}`).join('\n')}` : ''}

════════════════════════════════════════════════════════════
    `

    return report
  }
}

let globalSearchAnalyticsManager: SearchAnalyticsManager | null = null

export function initializeSearchAnalyticsManager(): SearchAnalyticsManager {
  if (!globalSearchAnalyticsManager) {
    globalSearchAnalyticsManager = new SearchAnalyticsManager()
  }
  return globalSearchAnalyticsManager
}

export function getSearchAnalyticsManager(): SearchAnalyticsManager {
  if (!globalSearchAnalyticsManager) {
    return initializeSearchAnalyticsManager()
  }
  return globalSearchAnalyticsManager
}
