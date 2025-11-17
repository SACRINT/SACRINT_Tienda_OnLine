'use client'

// Cart Page - Página del carrito de compras
// Muestra items del carrito, permite editar cantidades, y mostrar resumen

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store/useCart'

export default function CartPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const items = useCart((state) => state.items)
  const removeItem = useCart((state) => state.removeItem)
  const updateQuantity = useCart((state) => state.updateQuantity)
  const subtotal = useCart((state) => state.subtotal)
  const tax = useCart((state) => state.tax)
  const shipping = useCart((state) => state.shipping)
  const total = useCart((state) => state.total)

  // Hidratar store (evitar mismatch SSR)
  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true)
  }, [])

  const handleQuantityChange = (productId: string, newQuantity: number, variantId?: string | null) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId, variantId)
    } else {
      updateQuantity(productId, newQuantity, variantId)
    }
  }

  const handleRemoveItem = (productId: string, variantId?: string | null) => {
    if (confirm('¿Estás seguro de eliminar este producto del carrito?')) {
      removeItem(productId, variantId)
    }
  }

  // No mostrar nada hasta que esté montado (evitar hydration mismatch)
  if (!mounted) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🛒</div>
        <p className="text-gray-600">Cargando carrito...</p>
      </div>
    )
  }

  // Carrito vacío
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-6">¡Agrega productos para comenzar a comprar!</p>
        <Link
          href="/shop"
          className="inline-block bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-primary-dark transition-colors"
        >
          Continuar comprando
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-8">Carrito de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Lista de items (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'no-variant'}`}
              className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4"
            >
              {/* Imagen */}
              <div className="relative w-full sm:w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={item.image || '/placeholder.jpg'}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              {/* Información */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-dark mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Precio: ${item.price.toFixed(2)}
                  </p>
                </div>

                {/* Selector de cantidad */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.productId, item.quantity - 1, item.variantId)
                    }
                    className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      handleQuantityChange(item.productId, val, item.variantId)
                    }}
                    min="1"
                    className="w-16 h-8 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() =>
                      handleQuantityChange(item.productId, item.quantity + 1, item.variantId)
                    }
                    className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Subtotal y eliminar */}
              <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-2">
                <p className="text-lg font-bold text-primary">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => handleRemoveItem(item.productId, item.variantId)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Eliminar"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}

          {/* Link continuar comprando */}
          <Link
            href="/shop"
            className="inline-block text-accent hover:text-accent-dark transition-colors mt-4"
          >
            ← Continuar comprando
          </Link>
        </div>

        {/* Columna derecha - Resumen de orden (1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-light border border-gray-200 rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-bold text-primary mb-4">Resumen de Orden</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Impuesto (16%):</span>
                <span className="font-semibold">${tax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Envío:</span>
                <span className="font-semibold">
                  {shipping() === 0 ? (
                    <span className="text-green-600">Gratis</span>
                  ) : (
                    `$${shipping().toFixed(2)}`
                  )}
                </span>
              </div>
              {subtotal() < 100 && shipping() > 0 && (
                <p className="text-xs text-gray-500">
                  Envío gratis en compras mayores a $100
                </p>
              )}
            </div>

            <div className="border-t border-gray-300 pt-3 mb-6">
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>Total:</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/shop/checkout')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-bold text-lg hover:bg-green-700 transition-colors"
            >
              Ir al Checkout →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
