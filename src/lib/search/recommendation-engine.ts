/**
 * Product Recommendation Engine
 * Semana 39, Tarea 39.2: Product Recommendation Engine
 */

import { logger } from '@/lib/monitoring'

export interface RecommendationStrategy {
  name: 'collaborative' | 'content-based' | 'hybrid' | 'trending' | 'personalized'
  weight: number
  config?: Record<string, any>
}

export interface UserProfile {
  userId: string
  viewedProducts: string[]
  purchasedProducts: string[]
  ratings: Record<string, number>
  categories: Record<string, number>
  preferences: Record<string, any>
  lastUpdated: Date
}

export interface RecommendationScore {
  productId: string
  score: number
  reason: string
  strategy: string
  confidence: number
}

export interface RecommendationResult {
  userId: string
  recommendations: RecommendationScore[]
  strategy: string
  timestamp: Date
  customizationLevel: 'basic' | 'intermediate' | 'advanced'
}

export class RecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map()
  private productCatalog: Map<string, Record<string, any>> = new Map()
  private strategies: Map<string, RecommendationStrategy> = new Map()
  private recommendations: Map<string, RecommendationResult> = new Map()

  constructor() {
    logger.debug({ type: 'recommendation_engine_init' }, 'Recommendation Engine inicializado')
    this.initializeDefaultStrategies()
  }

  /**
   * Inicializar estrategias por defecto
   */
  private initializeDefaultStrategies(): void {
    this.strategies.set('collaborative', {
      name: 'collaborative',
      weight: 0.3,
      config: { minSimilarity: 0.5 },
    })

    this.strategies.set('content-based', {
      name: 'content-based',
      weight: 0.3,
      config: { maxResults: 5 },
    })

    this.strategies.set('trending', {
      name: 'trending',
      weight: 0.2,
      config: { period: '7d' },
    })

    this.strategies.set('personalized', {
      name: 'personalized',
      weight: 0.2,
      config: { useHistory: true },
    })
  }

  /**
   * Crear perfil de usuario
   */
  createUserProfile(userId: string): UserProfile {
    const profile: UserProfile = {
      userId,
      viewedProducts: [],
      purchasedProducts: [],
      ratings: {},
      categories: {},
      preferences: {},
      lastUpdated: new Date(),
    }

    this.userProfiles.set(userId, profile)
    logger.debug({ type: 'user_profile_created', userId }, `Perfil de usuario creado: ${userId}`)

    return profile
  }

  /**
   * Obtener perfil de usuario
   */
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null
  }

  /**
   * Registrar vista de producto
   */
  recordProductView(userId: string, productId: string): void {
    let profile = this.getUserProfile(userId)
    if (!profile) {
      profile = this.createUserProfile(userId)
    }

    if (!profile.viewedProducts.includes(productId)) {
      profile.viewedProducts.push(productId)
    }

    profile.lastUpdated = new Date()
    logger.debug({ type: 'product_view_recorded', userId, productId }, 'Vista de producto registrada')
  }

  /**
   * Registrar compra
   */
  recordPurchase(userId: string, productId: string, category: string): void {
    let profile = this.getUserProfile(userId)
    if (!profile) {
      profile = this.createUserProfile(userId)
    }

    if (!profile.purchasedProducts.includes(productId)) {
      profile.purchasedProducts.push(productId)
    }

    profile.categories[category] = (profile.categories[category] || 0) + 1
    profile.lastUpdated = new Date()

    logger.debug({ type: 'purchase_recorded', userId, productId, category }, 'Compra registrada')
  }

  /**
   * Registrar calificación
   */
  recordRating(userId: string, productId: string, rating: number): void {
    let profile = this.getUserProfile(userId)
    if (!profile) {
      profile = this.createUserProfile(userId)
    }

    profile.ratings[productId] = rating
    profile.lastUpdated = new Date()

    logger.debug({ type: 'rating_recorded', userId, productId, rating }, 'Calificación registrada')
  }

  /**
   * Agregar producto al catálogo
   */
  addProduct(productId: string, data: Record<string, any>): void {
    this.productCatalog.set(productId, data)
  }

  /**
   * Obtener recomendaciones para usuario
   */
  getRecommendations(userId: string, limit: number = 10): RecommendationResult {
    try {
      const profile = this.getUserProfile(userId) || this.createUserProfile(userId)

      let allScores: RecommendationScore[] = []

      // Aplicar cada estrategia
      for (const [, strategy] of this.strategies) {
        const scores = this.applyStrategy(strategy, profile)
        allScores = allScores.concat(scores)
      }

      // Ponderar y deduplicar
      const weighted = this.weightScores(allScores)
      const topRecommendations = weighted.sort((a, b) => b.score - a.score).slice(0, limit)

      const result: RecommendationResult = {
        userId,
        recommendations: topRecommendations,
        strategy: 'hybrid',
        timestamp: new Date(),
        customizationLevel: profile.purchasedProducts.length > 5 ? 'advanced' : 'basic',
      }

      this.recommendations.set(`${userId}_${Date.now()}`, result)

      logger.info(
        { type: 'recommendations_generated', userId, count: topRecommendations.length },
        `${topRecommendations.length} recomendaciones generadas para ${userId}`,
      )

      return result
    } catch (error) {
      logger.error({ type: 'recommendation_error', userId, error: String(error) }, 'Error al generar recomendaciones')
      return {
        userId,
        recommendations: [],
        strategy: 'hybrid',
        timestamp: new Date(),
        customizationLevel: 'basic',
      }
    }
  }

  /**
   * Aplicar estrategia de recomendación
   */
  private applyStrategy(strategy: RecommendationStrategy, profile: UserProfile): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    switch (strategy.name) {
      case 'collaborative':
        scores.push(...this.collaborativeFiltering(profile))
        break
      case 'content-based':
        scores.push(...this.contentBasedFiltering(profile))
        break
      case 'trending':
        scores.push(...this.trendingProducts(profile))
        break
      case 'personalized':
        scores.push(...this.personalizedFiltering(profile))
        break
    }

    return scores.map((s) => ({
      ...s,
      strategy: strategy.name,
      score: s.score * strategy.weight,
    }))
  }

  /**
   * Collaborative Filtering
   */
  private collaborativeFiltering(profile: UserProfile): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    // Encontrar usuarios similares basado en historial
    for (const [userId, otherProfile] of this.userProfiles) {
      if (userId === profile.userId) continue

      // Calcular similitud
      const similarity = this.calculateSimilarity(profile, otherProfile)
      if (similarity > 0.5) {
        // Recomendar productos que el usuario similar compró pero nosotros no
        for (const productId of otherProfile.purchasedProducts) {
          if (!profile.purchasedProducts.includes(productId) && !profile.viewedProducts.includes(productId)) {
            scores.push({
              productId,
              score: similarity * 10,
              reason: 'Usuarios similares lo compraron',
              strategy: 'collaborative',
              confidence: similarity,
            })
          }
        }
      }
    }

    return scores
  }

  /**
   * Content-Based Filtering
   */
  private contentBasedFiltering(profile: UserProfile): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    // Basado en productos vistos y comprados
    const viewedProducts = profile.viewedProducts.slice(-5)

    for (const [productId, product] of this.productCatalog) {
      if (profile.viewedProducts.includes(productId) || profile.purchasedProducts.includes(productId)) {
        continue
      }

      let similarity = 0
      for (const viewedId of viewedProducts) {
        const viewedProduct = this.productCatalog.get(viewedId)
        if (viewedProduct) {
          similarity += this.calculateProductSimilarity(product, viewedProduct)
        }
      }

      if (similarity > 0) {
        scores.push({
          productId,
          score: (similarity / viewedProducts.length) * 10,
          reason: 'Similar a productos que viste',
          strategy: 'content-based',
          confidence: Math.min(1, similarity / viewedProducts.length),
        })
      }
    }

    return scores
  }

  /**
   * Trending Products
   */
  private trendingProducts(profile: UserProfile): RecommendationScore[] {
    // Simular productos en tendencia
    const trendingProductIds = Array.from(this.productCatalog.keys()).slice(0, 5)

    return trendingProductIds
      .filter((id) => !profile.viewedProducts.includes(id) && !profile.purchasedProducts.includes(id))
      .map((productId) => ({
        productId,
        score: Math.random() * 8,
        reason: 'Producto en tendencia',
        strategy: 'trending',
        confidence: 0.7,
      }))
  }

  /**
   * Personalized Filtering
   */
  private personalizedFiltering(profile: UserProfile): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    // Basado en categorías preferidas
    const topCategories = Object.entries(profile.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat)

    for (const [productId, product] of this.productCatalog) {
      if (profile.viewedProducts.includes(productId) || profile.purchasedProducts.includes(productId)) {
        continue
      }

      if (topCategories.includes(product.category)) {
        scores.push({
          productId,
          score: Math.random() * 9,
          reason: 'En tu categoría favorita',
          strategy: 'personalized',
          confidence: 0.8,
        })
      }
    }

    return scores
  }

  /**
   * Calcular similitud entre usuarios
   */
  private calculateSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    const intersection = profile1.purchasedProducts.filter((p) => profile2.purchasedProducts.includes(p)).length
    const union = new Set([...profile1.purchasedProducts, ...profile2.purchasedProducts]).size

    return union === 0 ? 0 : intersection / union
  }

  /**
   * Calcular similitud entre productos
   */
  private calculateProductSimilarity(product1: Record<string, any>, product2: Record<string, any>): number {
    let similarity = 0

    if (product1.category === product2.category) similarity += 0.5
    if (product1.tags?.some((t: string) => product2.tags?.includes(t))) similarity += 0.3
    if (Math.abs((product1.price || 0) - (product2.price || 0)) < 100) similarity += 0.2

    return Math.min(1, similarity)
  }

  /**
   * Ponderar scores
   */
  private weightScores(scores: RecommendationScore[]): RecommendationScore[] {
    const grouped = new Map<string, RecommendationScore[]>()

    for (const score of scores) {
      if (!grouped.has(score.productId)) {
        grouped.set(score.productId, [])
      }
      grouped.get(score.productId)!.push(score)
    }

    const weighted: RecommendationScore[] = []

    for (const [productId, scores] of grouped) {
      const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      const avgConfidence = scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length

      weighted.push({
        productId,
        score: avgScore,
        reason: `Recomendado por ${scores.length} estrategias`,
        strategy: 'hybrid',
        confidence: avgConfidence,
      })
    }

    return weighted
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalUsers: number
    totalProducts: number
    averageRecommendationsPerUser: number
    totalRecommendations: number
  } {
    return {
      totalUsers: this.userProfiles.size,
      totalProducts: this.productCatalog.size,
      averageRecommendationsPerUser: this.recommendations.size > 0 ? this.userProfiles.size / this.recommendations.size : 0,
      totalRecommendations: this.recommendations.size,
    }
  }
}

let globalRecommendationEngine: RecommendationEngine | null = null

export function initializeRecommendationEngine(): RecommendationEngine {
  if (!globalRecommendationEngine) {
    globalRecommendationEngine = new RecommendationEngine()
  }
  return globalRecommendationEngine
}

export function getRecommendationEngine(): RecommendationEngine {
  if (!globalRecommendationEngine) {
    return initializeRecommendationEngine()
  }
  return globalRecommendationEngine
}
