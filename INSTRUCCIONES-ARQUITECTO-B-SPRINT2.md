# 📋 INSTRUCCIONES PRECISAS - ARQUITECTO B - SPRINT 2
## Frontend: Products UI & Shopping

**Fecha**: 16 de Noviembre, 2025
**Arquitecto**: B (Frontend)
**Sprint**: 2 - Products UI & Shopping
**Duración estimada**: 4-5 días
**Status**: LISTO PARA COMENZAR

---

## 🎯 RESUMEN EJECUTIVO

Tu misión es crear toda la experiencia de compra en el frontend:
1. **Shop layout responsivo** - Header, sidebar, footer
2. **Listado de productos** - Con filtros y paginación
3. **Detalle de producto** - Con galería de imágenes
4. **Carrito de compras** - Zustand store
5. **Página del carrito** - Editar cantidades
6. **Checkout** - Integración con Stripe Elements

**Todos los archivos que necesitas crear/modificar ya están documentados aquí CON CÓDIGO EXACTO.**

---

## ⚡ PASO 0: PREPARACIÓN (5 MINUTOS)

### En tu navegador claude.ai/code:

```
1. Abre el proyecto: C:\03_Tienda digital
2. Abre la terminal integrada (Ctrl + `)
3. Verifica rama develop:
   git branch

   Deberías ver: * develop (con asterisco)

4. Si NO ves develop, hazlo:
   git checkout develop

5. Trae cambios recientes:
   git pull origin develop

6. Crea tu rama de trabajo:
   git checkout -b claude/frontend-sprint-2-products

7. Verifica que estés en tu rama:
   git branch

   Deberías ver: * claude/frontend-sprint-2-products
```

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### ✅ ARCHIVO 1: src/lib/store/useCart.ts
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
// Zustand Store for Shopping Cart
// Client-side state management with localStorage persistence

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  variantId?: string | null
  quantity: number
  price: number // Current price (sale or base)
  name: string
  image: string
  sku: string
}

export interface CartStore {
  items: CartItem[]

  // Core actions
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQuantity: (productId: string, variantId?: string | null, qty: number) => void
  clear: () => void

  // Computed values
  itemCount: () => number
  subtotal: () => number
  tax: () => number // 16%
  shipping: () => number // $9.99 or free if > $100
  total: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              i.variantId === item.variantId
          )

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId &&
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }

          return { items: [...state.items, item] }
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      updateQuantity: (productId, variantId, qty) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: Math.max(0, qty) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      tax: () => {
        const subtotal = get().subtotal()
        return Math.round(subtotal * 0.16 * 100) / 100
      },

      shipping: () => {
        const subtotal = get().subtotal()
        return subtotal > 100 ? 0 : 9.99
      },

      total: () => {
        const state = get()
        return (
          Math.round((state.subtotal() + state.tax() + state.shipping()) * 100) /
          100
        )
      },
    }),
    {
      name: 'cart-storage',
      skipHydration: true, // Important for Next.js SSR
    }
  )
)
```

---

### ✅ ARCHIVO 2: src/app/(shop)/layout.tsx
**CREAR CARPETA PRIMERO**: src/app/(shop)/
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/store/useCart'
import { ShoppingCart, Menu, X, LogOut, Home } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const cartItemCount = useCart((state) => state.itemCount())

  // Hydration fix for Zustand
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/shop" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded" />
            <span className="font-bold text-lg hidden sm:inline">Tienda</span>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xs mx-8">
            <form className="w-full" action="/shop/search" method="get">
              <input
                type="text"
                name="q"
                placeholder="Buscar productos..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/shop"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Productos
            </Link>
            <Link href="/shop/cart" className="relative">
              <ShoppingCart className="w-6 h-6" />
              {isMounted && cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600"
              >
                Mi Cuenta
              </Link>
            ) : (
              <Link href="/login" className="text-blue-600 font-medium">
                Ingresar
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-gray-50 border-t border-gray-200 p-4 space-y-3">
            <form action="/shop/search" method="get">
              <input
                type="text"
                name="q"
                placeholder="Buscar..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </form>
            <Link href="/shop" className="block text-gray-700">
              Productos
            </Link>
            <Link href="/shop/cart" className="block text-gray-700">
              Carrito ({isMounted ? cartItemCount : 0})
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block text-gray-700">
                  Mi Cuenta
                </Link>
              </>
            ) : (
              <Link href="/login" className="block text-blue-600 font-medium">
                Ingresar
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block">
            <div className="space-y-6 sticky top-24">
              {/* Categories */}
              <div>
                <h3 className="font-bold text-lg mb-3">Categorías</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/shop"
                      className="text-gray-700 hover:text-blue-600"
                    >
                      Todos los productos
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-bold text-lg mb-3">Precio</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600">
                    $0 - $10,000
                  </div>
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <h3 className="font-bold text-lg mb-3">Disponibilidad</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" />
                  En stock
                </label>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="md:col-span-3">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Tienda</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/shop" className="hover:text-white">
                    Productos
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="hover:text-white">
                    Nuevos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Ayuda</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Envíos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Términos
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            © 2025 Tienda Online. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
```

---

### ✅ ARCHIVO 3: src/app/(shop)/page.tsx
**CREAR NUEVO ARCHIVO** (en la carpeta que ya existe)

Copia y pega EXACTAMENTE este código:

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/store/useCart'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  basePrice: number
  salePrice: number | null
  stock: number
  images: Array<{ url: string; alt: string }>
  rating?: number
  reviewCount?: number
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const addItem = useCart((state) => state.addItem)

  const limit = 12

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(
          `/api/products?page=${page}&limit=${limit}`
        )
        if (!response.ok) throw new Error('Failed to fetch products')

        const data = await response.json()
        setProducts(data.products || [])
        setTotal(data.total || 0)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar productos'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [page])

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      quantity: 1,
      price: product.salePrice || product.basePrice,
      name: product.name,
      image: product.images[0]?.url || '/placeholder.jpg',
      sku: product.slug,
    })
  }

  if (loading) return <div className="text-center py-12">Cargando...</div>
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>

  return (
    <div>
      {/* Grid de Productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            {/* Imagen */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                src={product.images[0]?.url || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition"
              />
              {product.salePrice && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded font-bold">
                  -{Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)}%
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <Link
                href={`/shop/products/${product.id}`}
                className="block font-semibold text-sm hover:text-blue-600 truncate"
              >
                {product.name}
              </Link>

              {/* Rating */}
              <div className="flex items-center gap-1 my-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.round(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ({product.reviewCount || 0})
                </span>
              </div>

              {/* Precio */}
              <div className="my-2">
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-lg">
                    ${product.salePrice || product.basePrice}
                  </span>
                  {product.salePrice && (
                    <span className="text-xs text-gray-500 line-through">
                      ${product.basePrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock & Botón */}
              <div className="flex gap-2 items-center mb-2">
                <span
                  className={`text-xs font-semibold ${
                    product.stock > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {product.stock > 0 ? 'En stock' : 'Agotado'}
                </span>
              </div>

              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
                className="w-full bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {total > limit && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2">Página {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={products.length < limit}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
```

---

### ✅ ARCHIVO 4: src/app/(shop)/products/[id]/page.tsx
**CREAR CARPETA PRIMERO**: src/app/(shop)/products/[id]/
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/lib/store/useCart'

interface ProductImage {
  url: string
  alt: string
}

interface Product {
  id: string
  name: string
  description: string
  basePrice: number
  salePrice: number | null
  stock: number
  sku: string
  images: ProductImage[]
  categoryId: string
  category?: { name: string }
  rating?: number
  reviewCount?: number
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const addItem = useCart((state) => state.addItem)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`)
        if (!response.ok) throw new Error('Producto no encontrado')
        const data = await response.json()
        setProduct(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  if (loading) return <div className="text-center py-12">Cargando...</div>
  if (!product) return <div className="text-center py-12">Producto no encontrado</div>

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      quantity,
      price: product.salePrice || product.basePrice,
      name: product.name,
      image: product.images[0]?.url || '/placeholder.jpg',
      sku: product.sku,
    })
    setQuantity(1)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Galería */}
      <div>
        {/* Imagen Principal */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative mb-4">
          <img
            src={product.images[imageIndex]?.url || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setImageIndex(
                    (imageIndex - 1 + product.images.length) %
                    product.images.length
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() =>
                  setImageIndex((imageIndex + 1) % product.images.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setImageIndex(idx)}
                className={`w-16 h-16 rounded border-2 flex-shrink-0 ${
                  idx === imageIndex ? 'border-blue-600' : 'border-gray-200'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Información */}
      <div>
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/shop" className="hover:text-blue-600">
            Productos
          </Link>
          {' > '}
          <span>{product.name}</span>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(product.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-gray-600">({product.reviewCount || 0} reseñas)</span>
        </div>

        {/* Precio */}
        <div className="mb-6">
          <div className="flex gap-3 items-baseline">
            <span className="text-4xl font-bold">
              ${product.salePrice || product.basePrice}
            </span>
            {product.salePrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  ${product.basePrice}
                </span>
                <span className="text-lg font-bold text-red-600">
                  -{Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Descripción */}
        <p className="text-gray-600 mb-6">{product.description}</p>

        {/* Stock */}
        <div className="mb-6">
          <span
            className={`font-semibold ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
          </span>
        </div>

        {/* Cantidad y Carrito */}
        {product.stock > 0 && (
          <div className="mb-6 flex gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                max={product.stock}
                className="w-16 text-center border-l border-r border-gray-300 outline-none"
              />
              <button
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="px-4 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Agregar al carrito
            </button>
          </div>
        )}

        {/* SKU y Categoría */}
        <div className="border-t border-b border-gray-200 py-4 space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">SKU:</span>
            <span className="font-mono text-sm">{product.sku}</span>
          </div>
          {product.category && (
            <div className="flex justify-between">
              <span className="text-gray-600">Categoría:</span>
              <span>{product.category.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

### ✅ ARCHIVO 5: src/app/(shop)/cart/page.tsx
**CREAR CARPETA PRIMERO**: src/app/(shop)/cart/
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/lib/store/useCart'
import { Trash2, Plus, Minus } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false)
  const items = useCart((state) => state.items)
  const removeItem = useCart((state) => state.removeItem)
  const updateQuantity = useCart((state) => state.updateQuantity)
  const subtotal = useCart((state) => state.subtotal())
  const tax = useCart((state) => state.tax())
  const shipping = useCart((state) => state.shipping())
  const total = useCart((state) => state.total())

  // Hydration fix
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div>Cargando...</div>

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
        <Link href="/shop" className="text-blue-600 hover:underline font-medium">
          Continuar comprando
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Items */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold mb-6">Carrito de Compras</h1>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="border border-gray-200 rounded-lg p-4 flex gap-4"
            >
              {/* Imagen */}
              <div className="w-24 h-24 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Detalles */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-gray-500 text-sm">{item.sku}</p>
                <p className="text-lg font-bold mt-2">${item.price}</p>
              </div>

              {/* Cantidad */}
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.variantId, item.quantity - 1)
                  }
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.variantId, item.quantity + 1)
                  }
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right">
                <p className="font-bold text-lg">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Eliminar */}
              <button
                onClick={() =>
                  removeItem(item.productId, item.variantId)
                }
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link
            href="/shop"
            className="text-blue-600 hover:underline font-medium"
          >
            ← Continuar comprando
          </Link>
        </div>
      </div>

      {/* Resumen de Orden */}
      <div className="lg:col-span-1">
        <div className="border border-gray-200 rounded-lg p-6 sticky top-24">
          <h2 className="text-xl font-bold mb-4">Resumen</h2>

          <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Impuesto (16%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Envío:</span>
              <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
            </div>
          </div>

          <div className="flex justify-between text-xl font-bold mb-6">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Link
            href="/shop/checkout"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 text-center block"
          >
            Ir al Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

### ✅ ARCHIVO 6: src/app/(shop)/checkout/page.tsx
**CREAR CARPETA PRIMERO**: src/app/(shop)/checkout/
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/store/useCart'
import { loadStripe } from '@stripe/js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

function CheckoutForm() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>(
    'shipping'
  )

  const items = useCart((state) => state.items)
  const total = useCart((state) => state.total())

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return
    if (!session?.user?.id) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: 'temp-cart-id', // In real app, get from API
          shippingAddressId: 'address-id',
          paymentMethod: 'STRIPE',
        }),
      })

      if (!response.ok) throw new Error('Checkout failed')

      const { clientSecret } = await response.json()

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: session.user.name || 'Guest',
            email: session.user.email || '',
          },
        },
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      } else if (result.paymentIntent?.status === 'succeeded') {
        router.push('/shop/order-confirmation')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return <div className="text-center py-12">Carrito vacío</div>
  }

  return (
    <form onSubmit={handleCheckout} className="space-y-6">
      {/* Step 1: Shipping */}
      {step === 'shipping' && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Dirección de Envío</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full px-4 py-2 border border-gray-300 rounded"
              required
            />
            <input
              type="text"
              placeholder="Calle"
              className="w-full px-4 py-2 border border-gray-300 rounded"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Ciudad"
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
              <input
                type="text"
                placeholder="Código Postal"
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setStep('payment')}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 'payment' && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Método de Pago</h2>
          <div className="p-4 border border-gray-300 rounded mb-4 bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                  },
                },
              }}
            />
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setStep('review')}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded font-semibold hover:bg-gray-400"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep('review')}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
            >
              Revisar Orden
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Revisar Orden</h2>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setStep('payment')}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded font-semibold hover:bg-gray-400"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={loading || !stripe}
              className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : `Pagar $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') return <div>Cargando...</div>
  if (!session) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  )
}
```

---

## 🔄 PASO 1: CREAR ARCHIVOS EN claude.ai/code

**En tu editor de claude.ai/code:**

1. Crea carpeta: `src/lib/store/`
2. Crea archivo: `useCart.ts` - Copia EXACTAMENTE el código de ARCHIVO 1
3. Crea carpeta: `src/app/(shop)/`
4. Crea archivo: `layout.tsx` - Copia EXACTAMENTE el código de ARCHIVO 2
5. Crea archivo: `page.tsx` - Copia EXACTAMENTE el código de ARCHIVO 3
6. Crea carpeta: `src/app/(shop)/products/[id]/`
7. Crea archivo: `src/app/(shop)/products/[id]/page.tsx` - Copia EXACTAMENTE el código de ARCHIVO 4
8. Crea carpeta: `src/app/(shop)/cart/`
9. Crea archivo: `src/app/(shop)/cart/page.tsx` - Copia EXACTAMENTE el código de ARCHIVO 5
10. Crea carpeta: `src/app/(shop)/checkout/`
11. Crea archivo: `src/app/(shop)/checkout/page.tsx` - Copia EXACTAMENTE el código de ARCHIVO 6

---

## ✅ PASO 2: VERIFICACIÓN

En la terminal de claude.ai/code:

```bash
# Compilar para ver si hay errores
npm run build

# Deberías ver: ✓ Compiled successfully
# SI VES ERRORES, NO HAGAS COMMIT. Avísame inmediatamente.
```

---

## 🎯 PASO 3: COMMIT Y PUSH

En la terminal de claude.ai/code:

```bash
# Ver qué archivos cambiaron
git status

# Deberías ver los 6 archivos nuevos como "untracked"

# Agregar todos los archivos
git add .

# Hacer commit con mensaje descriptivo
git commit -m "feat(frontend): Implement Products UI & Shopping - Sprint 2

- Add Zustand cart store with persistence
- Add shop layout with responsive design
- Add products listing page with pagination
- Add product detail page with gallery
- Add shopping cart page
- Add checkout flow with Stripe integration
- Multi-tenant ready, auth required for checkout"

# Push a tu rama
git push origin claude/frontend-sprint-2-products

# Resultado esperado:
# [new branch] claude/frontend-sprint-2-products -> claude/frontend-sprint-2-products
```

---

## 🚨 CHECKLIST FINAL

Antes de decir que terminaste:

- [ ] Creé EXACTAMENTE 6 archivos nuevos
- [ ] Copié el código EXACTAMENTE como está (sin cambios)
- [ ] Ejecuté `npm run build` y pasó ✅
- [ ] Ejecuté `git add . && git commit && git push`
- [ ] No hay errores en la compilación
- [ ] Mi rama está en remoto: `claude/frontend-sprint-2-products`

---

## ⚠️ RESTRICCIONES CRÍTICAS

**NUNCA HAGAS:**
- ❌ No cambies nombres de funciones o componentes
- ❌ No agregues props a componentes que no estén documentados
- ❌ No hagas imports que no estén en el código
- ❌ No uses colores diferentes al diseño
- ❌ No dejes console.log sin propósito
- ❌ No commits sin pasar `npm run build`

---

## ❓ SI ALGO SALE MAL

Si ves errores en `npm run build`:

1. **NO hagas commit**
2. **Copia el error exacto**
3. **Avisa: "Error en ARCHIVO X, línea Y: [copia del error]"**
4. **NO intentes arreglarlo solo** - Avísame para que lo corrija

---

**¡Listo para comenzar Sprint 2? ¡Adelante!** 🚀
