/**
 * Offline Product Browsing
 * Semana 30, Tarea 30.7: Cache de productos para browsing offline
 */

import { saveProductOffline, getOfflineProducts } from './offline'

export interface CachedProduct {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  inStock: boolean
  rating?: number
  reviews?: number
}

/**
 * Cachear productos cuando se cargan
 */
export async function cacheProductsFromAPI(products: CachedProduct[]): Promise<void> {
  for (const product of products) {
    try {
      await saveProductOffline({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        inStock: product.inStock,
        cachedAt: Date.now(),
      })
    } catch (error) {
      console.error('[Offline Products] Error cacheando:', product.id, error)
    }
  }

  console.log('[Offline Products] ', products.length, ' productos cacheados')
}

/**
 * Obtener productos para búsqueda offline
 */
export async function searchOfflineProducts(query: string): Promise<CachedProduct[]> {
  const products = await getOfflineProducts()

  if (!query.trim()) {
    return products as CachedProduct[]
  }

  const lowercase = query.toLowerCase()

  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(lowercase) ||
        p.category.toLowerCase().includes(lowercase),
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: '',
      price: p.price,
      image: p.image,
      category: p.category,
      inStock: p.inStock,
    } as CachedProduct))
}

/**
 * Obtener categorías disponibles offline
 */
export async function getOfflineCategories(): Promise<string[]> {
  const products = await getOfflineProducts()
  const categories = new Set(products.map((p) => p.category))
  return Array.from(categories).sort()
}

/**
 * Filtrar productos por categoría offline
 */
export async function filterProductsByCategory(category: string): Promise<CachedProduct[]> {
  const products = await getOfflineProducts(category)

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: '',
    price: p.price,
    image: p.image,
    category: p.category,
    inStock: p.inStock,
  } as CachedProduct))
}

/**
 * Obtener producto individual offline
 */
export async function getOfflineProduct(id: string): Promise<CachedProduct | null> {
  const products = await getOfflineProducts()
  const product = products.find((p) => p.id === id)

  if (!product) {
    return null
  }

  return {
    id: product.id,
    name: product.name,
    description: '',
    price: product.price,
    image: product.image,
    category: product.category,
    inStock: product.inStock,
  } as CachedProduct
}

/**
 * Marcar productos como descargados
 */
export async function markProductsAsDownloaded(): Promise<void> {
  try {
    const products = await getOfflineProducts()
    localStorage.setItem('offline-products-count', String(products.length))
    localStorage.setItem('offline-products-updated', new Date().toISOString())
    console.log('[Offline Products] Productos marcados como descargados:', products.length)
  } catch (error) {
    console.error('[Offline Products] Error marcando como descargados:', error)
  }
}

/**
 * Obtener estadísticas de productos offline
 */
export async function getOfflineProductsStats(): Promise<{
  totalProducts: number
  totalCategories: number
  lastUpdated: string | null
  size: string
}> {
  try {
    const products = await getOfflineProducts()
    const categories = await getOfflineCategories()
    const lastUpdated = localStorage.getItem('offline-products-updated')

    // Estimar tamaño
    const dataSize = JSON.stringify(products).length
    const sizeInKB = (dataSize / 1024).toFixed(2)

    return {
      totalProducts: products.length,
      totalCategories: categories.length,
      lastUpdated,
      size: `${sizeInKB} KB`,
    }
  } catch (error) {
    console.error('[Offline Products] Error obteniendo estadísticas:', error)
    return {
      totalProducts: 0,
      totalCategories: 0,
      lastUpdated: null,
      size: '0 KB',
    }
  }
}
