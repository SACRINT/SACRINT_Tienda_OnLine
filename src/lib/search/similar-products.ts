/**
 * Similar Products Detection
 * Semana 39, Tarea 39.9: Similar Products Detection
 */

import { logger } from '@/lib/monitoring'

export interface SimilarProduct {
  productId: string
  similarity: number
  reason: string
}

export interface SimilarityScore {
  categoryMatch: number
  priceMatch: number
  tagMatch: number
  brandMatch: number
  overall: number
}

export class SimilarProductsManager {
  private products: Map<string, Record<string, any>> = new Map()
  private similarityCache: Map<string, SimilarProduct[]> = new Map()

  constructor() {
    logger.debug({ type: 'similar_products_init' }, 'Similar Products Manager inicializado')
  }

  /**
   * Agregar producto
   */
  addProduct(productId: string, product: Record<string, any>): void {
    this.products.set(productId, product)
    this.similarityCache.clear() // Invalidar caché
  }

  /**
   * Encontrar productos similares
   */
  findSimilarProducts(productId: string, limit: number = 5): SimilarProduct[] {
    if (this.similarityCache.has(productId)) {
      return this.similarityCache.get(productId)!.slice(0, limit)
    }

    const baseProduct = this.products.get(productId)
    if (!baseProduct) return []

    const similarities: SimilarProduct[] = []

    for (const [otherId, other] of this.products) {
      if (otherId === productId) continue

      const score = this.calculateSimilarity(baseProduct, other)

      if (score.overall > 0.3) {
        const reasons: string[] = []
        if (score.categoryMatch > 0.5) reasons.push('Misma categoría')
        if (score.priceMatch > 0.5) reasons.push('Precio similar')
        if (score.tagMatch > 0.5) reasons.push('Tags similares')
        if (score.brandMatch > 0) reasons.push('Misma marca')

        similarities.push({
          productId: otherId,
          similarity: score.overall,
          reason: reasons.join(', '),
        })
      }
    }

    // Ordenar por similaridad descendente
    similarities.sort((a, b) => b.similarity - a.similarity)

    this.similarityCache.set(productId, similarities)

    logger.debug({ type: 'similar_products_found', productId, count: similarities.length }, `${similarities.length} productos similares encontrados`)

    return similarities.slice(0, limit)
  }

  /**
   * Calcular similaridad entre productos
   */
  private calculateSimilarity(product1: Record<string, any>, product2: Record<string, any>): SimilarityScore {
    const score: SimilarityScore = {
      categoryMatch: product1.category === product2.category ? 1 : 0,
      priceMatch: this.calculatePriceSimilarity(product1.price, product2.price),
      tagMatch: this.calculateTagSimilarity(product1.tags || [], product2.tags || []),
      brandMatch: product1.brand === product2.brand ? 1 : 0,
      overall: 0,
    }

    score.overall = (score.categoryMatch * 0.3 + score.priceMatch * 0.2 + score.tagMatch * 0.3 + score.brandMatch * 0.2) / 1
    return score
  }

  /**
   * Calcular similaridad de precio
   */
  private calculatePriceSimilarity(price1: number, price2: number): number {
    const diff = Math.abs(price1 - price2)
    const avg = (price1 + price2) / 2
    const percentDiff = avg > 0 ? diff / avg : 0

    // Si la diferencia es menor al 20%, considerar similares
    return Math.max(0, 1 - percentDiff * 5)
  }

  /**
   * Calcular similaridad de tags
   */
  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    if (tags1.length === 0 && tags2.length === 0) return 1
    if (tags1.length === 0 || tags2.length === 0) return 0

    const intersection = tags1.filter((t) => tags2.includes(t)).length
    const union = new Set([...tags1, ...tags2]).size

    return union > 0 ? intersection / union : 0
  }

  /**
   * Obtener productos en el bundle
   */
  getProductBundle(productId: string, bundleSize: number = 3): SimilarProduct[] {
    return this.findSimilarProducts(productId, bundleSize)
  }

  /**
   * Obtener cadena de productos relacionados
   */
  getRelatedProductChain(productId: string, depth: number = 2): SimilarProduct[] {
    const chain: SimilarProduct[] = []
    const visited = new Set<string>()

    let current = [productId]

    for (let i = 0; i < depth; i++) {
      for (const id of current) {
        if (visited.has(id)) continue
        visited.add(id)

        const similar = this.findSimilarProducts(id, 2)
        chain.push(...similar.filter((s) => !visited.has(s.productId)))
      }

      current = chain.map((s) => s.productId)
    }

    return chain.slice(0, 10)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalProducts: number; cacheSize: number; averageSimilarity: number } {
    let totalSimilarity = 0
    let totalComparisons = 0

    for (const similar of this.similarityCache.values()) {
      for (const item of similar) {
        totalSimilarity += item.similarity
        totalComparisons++
      }
    }

    return {
      totalProducts: this.products.size,
      cacheSize: this.similarityCache.size,
      averageSimilarity: totalComparisons > 0 ? totalSimilarity / totalComparisons : 0,
    }
  }
}

let globalSimilarProductsManager: SimilarProductsManager | null = null

export function initializeSimilarProductsManager(): SimilarProductsManager {
  if (!globalSimilarProductsManager) {
    globalSimilarProductsManager = new SimilarProductsManager()
  }
  return globalSimilarProductsManager
}

export function getSimilarProductsManager(): SimilarProductsManager {
  if (!globalSimilarProductsManager) {
    return initializeSimilarProductsManager()
  }
  return globalSimilarProductsManager
}
