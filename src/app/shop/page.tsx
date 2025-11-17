'use client'

// Shop Page - Listado de productos con filtros y paginación
// Muestra grid de productos, filtros, y paginación

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductCard, type ProductCardData } from '@/components/features/ProductCard'

interface ProductsResponse {
  products: ProductCardData[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ShopPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<ProductCardData[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get('page') || '1')
  const searchQuery = searchParams.get('search') || ''
  const categoryFilter = searchParams.get('category') || ''
  const sortFilter = searchParams.get('sort') || 'newest'

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchQuery, categoryFilter, sortFilter])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        published: 'true', // Solo mostrar productos publicados
      })

      if (searchQuery) params.set('search', searchQuery)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (sortFilter) params.set('sort', sortFilter)

      const res = await fetch(`/api/products?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Error al cargar productos')
      }

      const data: ProductsResponse = await res.json()
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/shop?${params.toString()}`)
  }

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    params.set('page', '1') // Reset a página 1 al cambiar filtro
    router.push(`/shop?${params.toString()}`)
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-neutral-dark mb-2">Error al cargar productos</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold text-neutral-dark mb-2">No hay productos disponibles</h2>
        <p className="text-gray-600 mb-4">
          {searchQuery
            ? `No encontramos productos para "${searchQuery}"`
            : 'Pronto tendremos productos disponibles'}
        </p>
        {searchQuery && (
          <button
            onClick={() => router.push('/shop')}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Ver todos los productos
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con título y filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
          </h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} {pagination.total === 1 ? 'producto' : 'productos'} encontrados
          </p>
        </div>

        {/* Selector de orden */}
        <select
          value={sortFilter}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="price-asc">Precio: Menor a Mayor</option>
          <option value="price-desc">Precio: Mayor a Menor</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
        </select>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            ← Anterior
          </button>

          <span className="text-gray-700">
            Página {currentPage} de {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentPage === pagination.pages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
