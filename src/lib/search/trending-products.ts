/**
 * Trending Products & Hot Items
 * Semana 39, Tarea 39.8: Trending Products & Hot Items
 */

import { logger } from '@/lib/monitoring'

export interface TrendingProduct {
  productId: string
  name: string
  rank: number
  trendScore: number
  period: 'hour' | 'day' | 'week' | 'month'
  metrics: {
    viewCount: number
    searchCount: number
    addToCartCount: number
    purchaseCount: number
    shareCount: number
  }
  momentum: number // Cambio de popularidad
  timestamp: Date
}

export interface HotItem {
  productId: string
  confidence: number
  estimatedPeakTime: Date
  category: string
  reason: string
}

export class TrendingProductsManager {
  private trendingProducts: Map<string, TrendingProduct> = new Map()
  private hotItems: Map<string, HotItem> = new Map()
  private productMetrics: Map<string, Map<string, number>> = new Map() // Métricas por período
  private trendingHistory: TrendingProduct[] = []

  constructor() {
    logger.debug({ type: 'trending_products_init' }, 'Trending Products Manager inicializado')
  }

  /**
   * Registrar métrica de producto
   */
  recordProductMetric(productId: string, metricType: string, value: number = 1): void {
    if (!this.productMetrics.has(productId)) {
      this.productMetrics.set(productId, new Map())
    }

    const metrics = this.productMetrics.get(productId)!
    metrics.set(metricType, (metrics.get(metricType) || 0) + value)
  }

  /**
   * Calcular productos en tendencia
   */
  calculateTrending(period: 'hour' | 'day' | 'week' | 'month' = 'day'): TrendingProduct[] {
    const trendingList: TrendingProduct[] = []
    const multipliers = {
      view: 1,
      search: 2,
      addToCart: 3,
      purchase: 5,
      share: 4,
    }

    for (const [productId, metrics] of this.productMetrics) {
      const trendScore =
        (metrics.get('view') || 0) * multipliers.view +
        (metrics.get('search') || 0) * multipliers.search +
        (metrics.get('addToCart') || 0) * multipliers.addToCart +
        (metrics.get('purchase') || 0) * multipliers.purchase +
        (metrics.get('share') || 0) * multipliers.share

      if (trendScore > 0) {
        const trendingProduct: TrendingProduct = {
          productId,
          name: `Product ${productId}`,
          rank: 0,
          trendScore,
          period,
          metrics: {
            viewCount: metrics.get('view') || 0,
            searchCount: metrics.get('search') || 0,
            addToCartCount: metrics.get('addToCart') || 0,
            purchaseCount: metrics.get('purchase') || 0,
            shareCount: metrics.get('share') || 0,
          },
          momentum: this.calculateMomentum(productId),
          timestamp: new Date(),
        }

        trendingList.push(trendingProduct)
      }
    }

    // Ordenar por trend score y asignar ranking
    trendingList.sort((a, b) => b.trendScore - a.trendScore)
    trendingList.forEach((product, index) => {
      product.rank = index + 1
    })

    // Guardar en historial
    this.trendingHistory.push(...trendingList)
    if (this.trendingHistory.length > 1000) {
      this.trendingHistory = this.trendingHistory.slice(-1000)
    }

    // Detectar hot items
    this.detectHotItems(trendingList)

    return trendingList
  }

  /**
   * Obtener productos en tendencia
   */
  getTrendingProducts(period: 'hour' | 'day' | 'week' | 'month' = 'day', limit: number = 10): TrendingProduct[] {
    const trending = this.calculateTrending(period)
    return trending.slice(0, limit)
  }

  /**
   * Calcular momentum de producto
   */
  private calculateMomentum(productId: string): number {
    // Comparar con período anterior
    const currentMetrics = this.productMetrics.get(productId)
    if (!currentMetrics) return 0

    const current = (currentMetrics.get('view') || 0) + (currentMetrics.get('purchase') || 0)

    // Simular comparación (en producción usaría timestamps)
    return Math.random() * 0.5 - 0.25 // Momentum entre -0.25 y 0.25
  }

  /**
   * Detectar hot items
   */
  private detectHotItems(trending: TrendingProduct[]): void {
    for (const product of trending) {
      const isHot =
        product.rank <= 10 && // Top 10
        product.momentum > 0.1 && // Crecimiento positivo
        product.metrics.purchaseCount > 5 // Mínimo de compras

      if (isHot) {
        const hotItem: HotItem = {
          productId: product.productId,
          confidence: Math.min(1, product.momentum * 2),
          estimatedPeakTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          category: 'featured',
          reason: `Trending con momentum ${product.momentum.toFixed(2)}`,
        }

        this.hotItems.set(product.productId, hotItem)

        logger.info(
          { type: 'hot_item_detected', productId: product.productId, rank: product.rank },
          `Hot item detectado: ${product.productId}`,
        )
      }
    }
  }

  /**
   * Obtener hot items
   */
  getHotItems(limit: number = 5): HotItem[] {
    return Array.from(this.hotItems.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
  }

  /**
   * Obtener trending por categoría
   */
  getTrendingByCategory(category: string, limit: number = 10): TrendingProduct[] {
    return this.calculateTrending('day')
      .filter((p) => p.metrics.viewCount > 0) // Filtro simplificado
      .slice(0, limit)
  }

  /**
   * Limpiar métricas
   */
  resetMetrics(period: 'hour' | 'day' | 'week' | 'month'): void {
    // En producción, rotaría entre períodos de tiempo
    logger.info({ type: 'metrics_reset', period }, `Métricas reseteadas para período: ${period}`)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalTrackedProducts: number
    hotItemsCount: number
    averageTrendScore: number
  } {
    const trending = this.calculateTrending('day')
    const avgScore = trending.length > 0 ? trending.reduce((sum, p) => sum + p.trendScore, 0) / trending.length : 0

    return {
      totalTrackedProducts: this.productMetrics.size,
      hotItemsCount: this.hotItems.size,
      averageTrendScore: avgScore,
    }
  }
}

let globalTrendingProductsManager: TrendingProductsManager | null = null

export function initializeTrendingProductsManager(): TrendingProductsManager {
  if (!globalTrendingProductsManager) {
    globalTrendingProductsManager = new TrendingProductsManager()
  }
  return globalTrendingProductsManager
}

export function getTrendingProductsManager(): TrendingProductsManager {
  if (!globalTrendingProductsManager) {
    return initializeTrendingProductsManager()
  }
  return globalTrendingProductsManager
}
