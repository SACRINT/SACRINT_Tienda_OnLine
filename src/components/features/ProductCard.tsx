'use client'

// ProductCard - Tarjeta de producto para grid de listado
// Muestra imagen, precio, stock, y permite agregar al carrito

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/store/useCart'
import { useState } from 'react'

export interface ProductCardData {
  id: string
  slug: string
  name: string
  description?: string
  basePrice: number
  salePrice?: number | null
  image: string
  sku: string
  stock: number
  reserved?: number
  featured?: boolean
  _count?: {
    reviews: number
  }
}

interface ProductCardProps {
  product: ProductCardData
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem)
  const [showNotification, setShowNotification] = useState(false)

  const isInStock = product.stock > (product.reserved || 0)
  const currentPrice = product.salePrice || product.basePrice
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice

  const discountPercentage = hasDiscount
    ? Math.round(((product.basePrice - (product.salePrice || 0)) / product.basePrice) * 100)
    : 0

  const handleAddToCart = () => {
    if (!isInStock) return

    addItem({
      productId: product.id,
      variantId: null,
      quantity: 1,
      price: currentPrice,
      name: product.name,
      image: product.image || '/placeholder.jpg',
      sku: product.sku,
    })

    // Mostrar notificación
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
      {/* Badge de descuento */}
      {hasDiscount && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold z-10">
          -{discountPercentage}%
        </div>
      )}

      {/* Badge destacado */}
      {product.featured && (
        <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded-md text-xs font-bold z-10">
          ⭐ Destacado
        </div>
      )}

      {/* Notificación agregado */}
      {showNotification && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-20 text-sm font-bold">
          ✓ Agregado al carrito
        </div>
      )}

      {/* Imagen */}
      <Link href={`/shop/products/${product.id}`} className="block relative aspect-square overflow-hidden group">
        <Image
          src={product.image || '/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>

      {/* Contenido */}
      <div className="p-4">
        {/* Nombre */}
        <Link
          href={`/shop/products/${product.id}`}
          className="text-lg font-semibold text-neutral-dark hover:text-accent transition-colors line-clamp-2 mb-2"
        >
          {product.name}
        </Link>

        {/* Rating (placeholder - se puede implementar después con reviews reales) */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400">
            {'★★★★★'.split('').map((star, i) => (
              <span key={i} className={i < 4 ? 'text-yellow-400' : 'text-gray-300'}>
                {star}
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            ({product._count?.reviews || 0} reseñas)
          </span>
        </div>

        {/* Precio */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                ${product.basePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Stock badge */}
        <div className="mb-3">
          {isInStock ? (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              En stock ({product.stock - (product.reserved || 0)} disponibles)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-red-600 font-medium">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              Agotado
            </span>
          )}
        </div>

        {/* Botón agregar */}
        <button
          onClick={handleAddToCart}
          disabled={!isInStock}
          className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
            isInStock
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isInStock ? '🛒 Agregar al carrito' : 'Sin stock'}
        </button>
      </div>
    </div>
  )
}
