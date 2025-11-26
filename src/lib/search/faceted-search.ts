/**
 * Faceted Search & Filtering
 * Semana 39, Tarea 39.4: Faceted Search & Filtering
 */

import { logger } from '@/lib/monitoring'

export interface Facet {
  name: string
  field: string
  type: 'term' | 'range' | 'date' | 'boolean'
  values?: { value: string; count: number }[]
  rangeConfig?: { min: number; max: number; step: number }
}

export interface FacetFilter {
  field: string
  values: string[]
  operator: 'AND' | 'OR'
}

export interface FacetedSearchQuery {
  query: string
  filters: FacetFilter[]
  facets: string[]
  pagination?: { page: number; size: number }
  sort?: { field: string; order: 'asc' | 'desc' }
}

export interface FacetedSearchResult {
  queryId: string
  total: number
  results: any[]
  facets: Record<string, Facet>
  appliedFilters: FacetFilter[]
  took: number
}

export class FacetedSearchManager {
  private products: Map<string, Record<string, any>> = new Map()
  private facetConfigs: Map<string, Facet> = new Map()
  private filterHistory: Map<string, FacetFilter[]> = new Map()

  constructor() {
    logger.debug({ type: 'faceted_search_init' }, 'Faceted Search Manager inicializado')
    this.initializeDefaultFacets()
  }

  /**
   * Inicializar facetas por defecto
   */
  private initializeDefaultFacets(): void {
    const defaultFacets: Facet[] = [
      {
        name: 'Category',
        field: 'category',
        type: 'term',
        values: [],
      },
      {
        name: 'Price',
        field: 'price',
        type: 'range',
        rangeConfig: { min: 0, max: 10000, step: 100 },
      },
      {
        name: 'Rating',
        field: 'rating',
        type: 'range',
        rangeConfig: { min: 0, max: 5, step: 0.5 },
      },
      {
        name: 'Brand',
        field: 'brand',
        type: 'term',
        values: [],
      },
      {
        name: 'In Stock',
        field: 'inStock',
        type: 'boolean',
        values: [
          { value: 'true', count: 0 },
          { value: 'false', count: 0 },
        ],
      },
    ]

    for (const facet of defaultFacets) {
      this.facetConfigs.set(facet.field, facet)
    }
  }

  /**
   * Agregar producto
   */
  addProduct(productId: string, product: Record<string, any>): void {
    this.products.set(productId, product)
    this.updateFacetCounts()
  }

  /**
   * Actualizar conteos de facetas
   */
  private updateFacetCounts(): void {
    // Reset facets
    for (const facet of this.facetConfigs.values()) {
      if (facet.type === 'term' && facet.values) {
        facet.values = []
      }
    }

    // Contar valores para cada faceta
    for (const product of this.products.values()) {
      for (const [fieldName, facet] of this.facetConfigs) {
        if (facet.type === 'term') {
          const value = product[fieldName]
          if (value !== undefined) {
            if (!facet.values) facet.values = []

            const existing = facet.values.find((v) => v.value === String(value))
            if (existing) {
              existing.count++
            } else {
              facet.values.push({ value: String(value), count: 1 })
            }
          }
        }
      }
    }

    // Ordenar valores por count descendente
    for (const facet of this.facetConfigs.values()) {
      if (facet.values) {
        facet.values.sort((a, b) => b.count - a.count)
      }
    }
  }

  /**
   * Búsqueda facetada
   */
  search(query: FacetedSearchQuery): FacetedSearchResult {
    const startTime = Date.now()

    try {
      let results = Array.from(this.products.entries())

      // Filtrar por query de texto
      if (query.query) {
        const queryLower = query.query.toLowerCase()
        results = results.filter(([, product]) => {
          const text = `${product.name} ${product.description} ${product.category}`.toLowerCase()
          return text.includes(queryLower)
        })
      }

      // Aplicar filtros facetados
      for (const filter of query.filters) {
        results = results.filter(([, product]) => {
          const value = String(product[filter.field])

          if (filter.operator === 'OR') {
            return filter.values.includes(value)
          } else {
            return filter.values.every((v) => {
              // Para rangos numéricos
              if (filter.field === 'price' || filter.field === 'rating') {
                const [min, max] = v.split('-').map(Number)
                const productValue = parseFloat(value)
                return productValue >= min && productValue <= max
              }
              return value === v
            })
          }
        })
      }

      // Ordenar
      if (query.sort) {
        results.sort(([, a], [, b]) => {
          const aVal = a[query.sort!.field]
          const bVal = b[query.sort!.field]

          if (query.sort!.order === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      // Paginar
      const { page = 1, size = 10 } = query.pagination || {}
      const start = (page - 1) * size
      const paginatedResults = results.slice(start, start + size).map(([, product]) => product)

      // Generar facetas para resultados
      const resultFacets: Record<string, Facet> = {}
      for (const facetName of query.facets) {
        const facetConfig = this.facetConfigs.get(facetName)
        if (facetConfig) {
          resultFacets[facetName] = { ...facetConfig }

          if (facetConfig.type === 'term' && facetConfig.values) {
            // Actualizar conteos solo para resultados
            const counts: Record<string, number> = {}
            for (const [, product] of results) {
              const value = String(product[facetName])
              counts[value] = (counts[value] || 0) + 1
            }

            resultFacets[facetName].values = Object.entries(counts).map(([value, count]) => ({ value, count }))
          }
        }
      }

      const took = Date.now() - startTime

      logger.info(
        { type: 'faceted_search_executed', query: query.query, resultCount: paginatedResults.length, took },
        `Búsqueda facetada ejecutada: ${paginatedResults.length} resultados`,
      )

      return {
        queryId: `search_${Date.now()}`,
        total: results.length,
        results: paginatedResults,
        facets: resultFacets,
        appliedFilters: query.filters,
        took,
      }
    } catch (error) {
      logger.error({ type: 'faceted_search_error', error: String(error) }, 'Error en búsqueda facetada')
      return {
        queryId: `search_${Date.now()}`,
        total: 0,
        results: [],
        facets: {},
        appliedFilters: [],
        took: Date.now() - startTime,
      }
    }
  }

  /**
   * Obtener facetas disponibles
   */
  getAvailableFacets(): Facet[] {
    return Array.from(this.facetConfigs.values())
  }

  /**
   * Obtener faceta específica
   */
  getFacet(fieldName: string): Facet | null {
    return this.facetConfigs.get(fieldName) || null
  }

  /**
   * Crear faceta personalizada
   */
  createCustomFacet(facet: Facet): void {
    this.facetConfigs.set(facet.field, facet)
    logger.debug({ type: 'custom_facet_created', field: facet.field }, `Faceta personalizada creada: ${facet.name}`)
  }

  /**
   * Refinar búsqueda
   */
  refineSearch(previousResult: FacetedSearchResult, newFilter: FacetFilter): FacetedSearchResult {
    const updatedFilters = [...previousResult.appliedFilters, newFilter]

    // Re-ejecutar búsqueda con nuevos filtros
    const query: FacetedSearchQuery = {
      query: '',
      filters: updatedFilters,
      facets: Object.keys(previousResult.facets),
      pagination: { page: 1, size: 10 },
    }

    return this.search(query)
  }

  /**
   * Remover filtro
   */
  removeFilter(result: FacetedSearchResult, filterField: string): FacetedSearchResult {
    const updatedFilters = result.appliedFilters.filter((f) => f.field !== filterField)

    const query: FacetedSearchQuery = {
      query: '',
      filters: updatedFilters,
      facets: Object.keys(result.facets),
      pagination: { page: 1, size: 10 },
    }

    return this.search(query)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalProducts: number
    totalFacets: number
    facetsWithValues: number
  } {
    const facetsWithValues = Array.from(this.facetConfigs.values()).filter((f) => f.values && f.values.length > 0).length

    return {
      totalProducts: this.products.size,
      totalFacets: this.facetConfigs.size,
      facetsWithValues,
    }
  }
}

let globalFacetedSearchManager: FacetedSearchManager | null = null

export function initializeFacetedSearchManager(): FacetedSearchManager {
  if (!globalFacetedSearchManager) {
    globalFacetedSearchManager = new FacetedSearchManager()
  }
  return globalFacetedSearchManager
}

export function getFacetedSearchManager(): FacetedSearchManager {
  if (!globalFacetedSearchManager) {
    return initializeFacetedSearchManager()
  }
  return globalFacetedSearchManager
}
