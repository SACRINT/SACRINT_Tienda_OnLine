/**
 * Customer Support Portal
 * Semana 41, Tarea 41.2: Customer Support Portal
 */

import { logger } from '@/lib/monitoring'

export interface SupportPortalUser {
  userId: string
  email: string
  name: string
  registeredAt: Date
  lastLogin: Date
}

export interface SupportCategory {
  id: string
  name: string
  description: string
  icon?: string
  articles: string[]
  avgResolutionTime: number
}

export interface SupportSearch {
  query: string
  results: { type: 'article' | 'faq' | 'ticket'; id: string; title: string; relevance: number }[]
  timestamp: Date
}

export class SupportPortalManager {
  private users: Map<string, SupportPortalUser> = new Map()
  private categories: Map<string, SupportCategory> = new Map()
  private searchHistory: SupportSearch[] = []

  constructor() {
    logger.debug({ type: 'support_portal_init' }, 'Support Portal Manager inicializado')
    this.initializeCategories()
  }

  /**
   * Inicializar categorías
   */
  private initializeCategories(): void {
    const categories: SupportCategory[] = [
      { id: 'billing', name: 'Facturación', description: 'Preguntas sobre pagos e invoices', articles: [], avgResolutionTime: 3600000 },
      { id: 'technical', name: 'Soporte Técnico', description: 'Problemas técnicos y errores', articles: [], avgResolutionTime: 7200000 },
      { id: 'general', name: 'General', description: 'Preguntas generales', articles: [], avgResolutionTime: 1800000 },
      { id: 'features', name: 'Características', description: 'Consultas sobre features', articles: [], avgResolutionTime: 5400000 },
    ]

    for (const category of categories) {
      this.categories.set(category.id, category)
    }
  }

  /**
   * Registrar usuario
   */
  registerUser(userId: string, email: string, name: string): SupportPortalUser {
    const user: SupportPortalUser = {
      userId,
      email,
      name,
      registeredAt: new Date(),
      lastLogin: new Date(),
    }

    this.users.set(userId, user)
    logger.debug({ type: 'user_registered', userId }, `Usuario registrado en portal: ${userId}`)

    return user
  }

  /**
   * Buscar en portal
   */
  search(userId: string, query: string): SupportSearch {
    const results = this.performSearch(query)

    const search: SupportSearch = {
      query,
      results,
      timestamp: new Date(),
    }

    this.searchHistory.push(search)

    logger.debug({ type: 'portal_search', userId, query, resultCount: results.length }, `Búsqueda realizada: ${query}`)

    return search
  }

  /**
   * Realizar búsqueda
   */
  private performSearch(query: string): SupportSearch['results'] {
    const results: SupportSearch['results'] = []
    const queryLower = query.toLowerCase()

    // Simular búsqueda de artículos y FAQs
    for (const category of this.categories.values()) {
      if (category.name.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'faq',
          id: category.id,
          title: category.name,
          relevance: Math.random() * 0.5 + 0.5,
        })
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * Obtener categorías
   */
  getCategories(): SupportCategory[] {
    return Array.from(this.categories.values())
  }

  /**
   * Obtener categoría
   */
  getCategory(categoryId: string): SupportCategory | null {
    return this.categories.get(categoryId) || null
  }

  /**
   * Obtener historial de búsqueda
   */
  getSearchHistory(userId: string, limit: number = 20): SupportSearch[] {
    return this.searchHistory.slice(-limit)
  }

  /**
   * Registrar login
   */
  recordLogin(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      user.lastLogin = new Date()
    }
  }
}

let globalSupportPortalManager: SupportPortalManager | null = null

export function initializeSupportPortalManager(): SupportPortalManager {
  if (!globalSupportPortalManager) {
    globalSupportPortalManager = new SupportPortalManager()
  }
  return globalSupportPortalManager
}

export function getSupportPortalManager(): SupportPortalManager {
  if (!globalSupportPortalManager) {
    return initializeSupportPortalManager()
  }
  return globalSupportPortalManager
}
