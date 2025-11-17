'use client'

// Product Detail Page - Vista completa del producto
// Muestra galería, información, selector de cantidad, y botón agregar al carrito

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductGallery } from '@/components/features/ProductGallery'
import { useCart } from '@/lib/store/useCart'

interface ProductImage {
  id: string
  url: string
  alt?: string | null
  order: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string | null
  sku: string
  basePrice: number
  salePrice?: number | null
  stock: number
  reserved: number
  published: boolean
  featured: boolean
  images: ProductImage[]
  category: Category
  _count?: {
    reviews: number
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showNotification, setShowNotification] = useState(false)

  const addItem = useCart((state) => state.addItem)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/products/${productId}`)

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Producto no encontrado')
        }
        throw new Error('Error al cargar el producto')
      }

      const data = await res.json()
      setProduct(data.product)
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product || !isInStock) return

    addItem({
      productId: product.id,
      variantId: null,
      quantity,
      price: currentPrice,
      name: product.name,
      image: product.images[0]?.url || '/placeholder.jpg',
      sku: product.sku,
    })

    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 2000)
    setQuantity(1) // Reset cantidad
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-neutral-dark mb-2">{error}</h2>
        <button
          onClick={() => router.push('/shop')}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors mt-4"
        >
          Volver a productos
        </button>
      </div>
    )
  }

  const availableStock = product.stock - product.reserved
  const isInStock = availableStock > 0
  const currentPrice = product.salePrice || product.basePrice
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice
  const discountPercentage = hasDiscount
    ? Math.round(((product.basePrice - (product.salePrice || 0)) / product.basePrice) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-accent transition-colors">
          Inicio
        </Link>
        <span>›</span>
        <Link href="/shop" className="hover:text-accent transition-colors">
          Productos
        </Link>
        <span>›</span>
        <span className="text-neutral-dark font-medium">{product.name}</span>
      </nav>

      {/* Notificación */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          ✓ Agregado al carrito
        </div>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería de imágenes */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Información del producto */}
        <div className="space-y-4">
          {/* Título */}
          <h1 className="text-3xl font-bold text-primary">{product.name}</h1>

          {/* Rating y reseñas */}
          <div className="flex items-center gap-3">
            <div className="flex text-yellow-400 text-lg">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i} className={i < 4 ? 'text-yellow-400' : 'text-gray-300'}>
                  {star}
                </span>
              ))}
            </div>
            <span className="text-gray-600">
              ({product._count?.reviews || 0} reseñas)
            </span>
          </div>

          {/* Precio */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-primary">
              ${currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-2xl text-gray-400 line-through">
                  ${product.basePrice.toFixed(2)}
                </span>
                <span className="text-xl font-bold text-red-500">
                  -{discountPercentage}%
                </span>
              </>
            )}
          </div>

          {/* Descripción */}
          <div className="border-t border-b border-gray-200 py-4">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Stock y SKU */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Estado:</span>
              {isInStock ? (
                <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  En stock ({availableStock} disponibles)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  Agotado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">SKU:</span>
              <span className="text-gray-600">{product.sku}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Categoría:</span>
              <Link
                href={`/shop?category=${product.category.id}`}
                className="text-accent hover:underline"
              >
                {product.category.name}
              </Link>
            </div>
          </div>

          {/* Selector de cantidad */}
          {isInStock && (
            <div className="space-y-3">
              <label className="font-semibold text-gray-700">Cantidad:</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    setQuantity(Math.min(availableStock, Math.max(1, val)))
                  }}
                  min="1"
                  max={availableStock}
                  className="w-20 h-10 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Botón agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`w-full py-4 px-6 rounded-md font-bold text-lg transition-colors ${
              isInStock
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isInStock ? '🛒 Agregar al carrito' : 'Sin stock'}
          </button>
        </div>
      </div>

      {/* Reviews Section (básico placeholder) */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-primary mb-4">Reseñas</h2>
        <p className="text-gray-600">
          {product._count?.reviews || 0} reseñas de clientes
        </p>
        <p className="text-gray-500 mt-2 text-sm">
          Las reseñas se mostrarán en una próxima versión.
        </p>
      </div>
    </div>
  )
}
