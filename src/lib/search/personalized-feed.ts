/**
 * Personalized Product Feed
 * Semana 39, Tarea 39.7: Personalized Product Feed
 */

import { logger } from '@/lib/monitoring'

export interface PersonalizedFeedItem {
  productId: string
  rank: number
  score: number
  reason: string
  personalizedAt: Date
}

export interface UserFeedPreferences {
  userId: string
  categories: string[]
  priceRange: { min: number; max: number }
  brands: string[]
  excludeOutOfStock: boolean
  sortBy: 'relevance' | 'price' | 'rating' | 'newness'
}

export interface FeedContext {
  pageSize: number
  page: number
  includeMetadata: boolean
}

export class PersonalizedFeedManager {
  private userFeeds: Map<string, PersonalizedFeedItem[]> = new Map()
  private feedPreferences: Map<string, UserFeedPreferences> = new Map()
  private products: Map<string, Record<string, any>> = new Map()
  private feedMetrics: Map<string, { impressions: number; clicks: number; conversions: number }> = new Map()

  constructor() {
    logger.debug({ type: 'personalized_feed_init' }, 'Personalized Feed Manager inicializado')
  }

  /**
   * Agregar producto al catálogo
   */
  addProduct(productId: string, product: Record<string, any>): void {
    this.products.set(productId, product)
  }

  /**
   * Crear preferencias de usuario
   */
  setUserPreferences(userId: string, preferences: UserFeedPreferences): void {
    this.feedPreferences.set(userId, preferences)
    this.generateUserFeed(userId)

    logger.debug({ type: 'user_preferences_set', userId }, `Preferencias de feed establecidas para ${userId}`)
  }

  /**
   * Generar feed personalizado
   */
  private generateUserFeed(userId: string): void {
    try {
      const preferences = this.feedPreferences.get(userId)
      if (!preferences) return

      const feedItems: PersonalizedFeedItem[] = []

      for (const [productId, product] of this.products) {
        let score = 0
        let reason = ''

        // Verificar categoría
        if (preferences.categories.includes(product.category)) {
          score += 0.3
          reason += 'Categoría favorita. '
        }

        // Verificar precio
        if (product.price >= preferences.priceRange.min && product.price <= preferences.priceRange.max) {
          score += 0.2
          reason += 'Rango de precio. '
        }

        // Verificar marca
        if (preferences.brands.includes(product.brand)) {
          score += 0.25
          reason += 'Marca preferida. '
        }

        // Verificar stock
        if (preferences.excludeOutOfStock && !product.inStock) {
          score = 0
          reason = 'Agotado'
        }

        // Calificación
        if (product.rating >= 4) {
          score += 0.15
          reason += 'Alto rating. '
        }

        if (score > 0) {
          feedItems.push({
            productId,
            rank: feedItems.length + 1,
            score,
            reason: reason.trim(),
            personalizedAt: new Date(),
          })
        }
      }

      // Ordenar por score
      feedItems.sort((a, b) => b.score - a.score)

      // Aplicar ranking
      feedItems.forEach((item, index) => {
        item.rank = index + 1
      })

      this.userFeeds.set(userId, feedItems)

      logger.info({ type: 'user_feed_generated', userId, itemCount: feedItems.length }, `Feed generado: ${feedItems.length} productos`)
    } catch (error) {
      logger.error({ type: 'feed_generation_error', userId, error: String(error) }, 'Error al generar feed')
    }
  }

  /**
   * Obtener feed personalizado
   */
  getUserFeed(userId: string, context: FeedContext = { pageSize: 20, page: 1, includeMetadata: false }): PersonalizedFeedItem[] {
    const feedItems = this.userFeeds.get(userId) || []

    const start = (context.page - 1) * context.pageSize
    const end = start + context.pageSize

    return feedItems.slice(start, end)
  }

  /**
   * Registrar impresión de feed
   */
  recordFeedImpression(userId: string, productId: string): void {
    const key = `${userId}:${productId}`
    const metrics = this.feedMetrics.get(key) || { impressions: 0, clicks: 0, conversions: 0 }

    metrics.impressions++
    this.feedMetrics.set(key, metrics)

    logger.debug({ type: 'feed_impression', userId, productId }, 'Impresión de feed registrada')
  }

  /**
   * Registrar click en feed
   */
  recordFeedClick(userId: string, productId: string): void {
    const key = `${userId}:${productId}`
    const metrics = this.feedMetrics.get(key) || { impressions: 0, clicks: 0, conversions: 0 }

    metrics.clicks++
    this.feedMetrics.set(key, metrics)

    logger.debug({ type: 'feed_click', userId, productId }, 'Click de feed registrado')
  }

  /**
   * Registrar conversión
   */
  recordFeedConversion(userId: string, productId: string): void {
    const key = `${userId}:${productId}`
    const metrics = this.feedMetrics.get(key) || { impressions: 0, clicks: 0, conversions: 0 }

    metrics.conversions++
    this.feedMetrics.set(key, metrics)

    logger.debug({ type: 'feed_conversion', userId, productId }, 'Conversión de feed registrada')
  }

  /**
   * Obtener métricas de producto en feed
   */
  getProductMetrics(userId: string, productId: string): { impressions: number; ctr: number; conversionRate: number } | null {
    const key = `${userId}:${productId}`
    const metrics = this.feedMetrics.get(key)

    if (!metrics) return null

    return {
      impressions: metrics.impressions,
      ctr: metrics.impressions > 0 ? metrics.clicks / metrics.impressions : 0,
      conversionRate: metrics.clicks > 0 ? metrics.conversions / metrics.clicks : 0,
    }
  }

  /**
   * Actualizar feed en tiempo real
   */
  refreshUserFeed(userId: string): void {
    this.generateUserFeed(userId)
    logger.debug({ type: 'feed_refreshed', userId }, `Feed actualizado para ${userId}`)
  }

  /**
   * Obtener estadísticas de feed
   */
  getStats(): { totalUsers: number; totalProducts: number; avgFeedSize: number } {
    let totalFeedSize = 0
    for (const feed of this.userFeeds.values()) {
      totalFeedSize += feed.length
    }

    return {
      totalUsers: this.feedPreferences.size,
      totalProducts: this.products.size,
      avgFeedSize: this.userFeeds.size > 0 ? totalFeedSize / this.userFeeds.size : 0,
    }
  }
}

let globalPersonalizedFeedManager: PersonalizedFeedManager | null = null

export function initializePersonalizedFeedManager(): PersonalizedFeedManager {
  if (!globalPersonalizedFeedManager) {
    globalPersonalizedFeedManager = new PersonalizedFeedManager()
  }
  return globalPersonalizedFeedManager
}

export function getPersonalizedFeedManager(): PersonalizedFeedManager {
  if (!globalPersonalizedFeedManager) {
    return initializePersonalizedFeedManager()
  }
  return globalPersonalizedFeedManager
}
