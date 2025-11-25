# 🚀 SEMANA 1 - GUÍA EJECUTABLE (Shop Frontend)

## Tareas Detalladas para el Arquitecto

**Semana**: 1-2 (Lunes - Viernes)
**Rama**: `feature/semana-1-shop-frontend`
**Tiempo Total**: 40 horas (28h Frontend + 12h Backend)
**Objetivo**: Clientes pueden navegar productos, ver detalles, filtrar, buscar

---

## 📋 CHECKLIST VISIÓN GENERAL

```
COMPONENTES (7):
[ ] ShopHero.tsx
[ ] ProductCard.tsx
[ ] ProductGallery.tsx
[ ] FilterSidebar.tsx
[ ] ProductReviews.tsx
[ ] RelatedProducts.tsx
[ ] SearchAutocomplete.tsx

PÁGINAS (2):
[ ] app/(shop)/shop/page.tsx
[ ] app/(shop)/shop/products/[id]/page.tsx

ENDPOINTS (5):
[ ] GET /api/products/search
[ ] GET /api/products/:id/related
[ ] GET /api/products/:id/reviews
[ ] POST /api/reviews
[ ] GET /api/categories/hierarchy

TESTING & VALIDATION:
[ ] npm run build → 0 errores
[ ] npm run lint → 0 warnings
[ ] Manual testing desktop
[ ] Manual testing mobile
[ ] Lighthouse 90+ score
```

---

## 💻 LUNES: SETUP + COMPONENTES BASE

### Paso 1: Verificar ambiente (30 min)

```bash
# Terminal
cd C:\03_Tienda digital
git status
# Debe mostrar: On branch feature/semana-1-shop-frontend

npm run build
# Debe pasar sin errores

npm run dev
# Debe abrir http://localhost:3000
```

### Paso 2: Crear carpeta de componentes (10 min)

```bash
mkdir -p src/components/shop
```

### Paso 3: Crear ShopHero.tsx (60 min)

**Ubicación**: `src/components/shop/ShopHero.tsx`

**Especificación**:

- Hero section con background image
- Título: "Shop Online Store"
- Subtítulo: "Discover our amazing products"
- CTA button: "Shop Now"
- Responsive design (mobile, tablet, desktop)
- ~180 líneas

**Código de referencia**:

```typescript
// src/components/shop/ShopHero.tsx

'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ShopHero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(/shop-hero.jpg)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Shop Online Store
        </h1>

        <p className="text-xl md:text-2xl mb-8 opacity-90">
          Discover our amazing products
        </p>

        <Link href="#products">
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200"
          >
            Shop Now
          </Button>
        </Link>
      </div>
    </section>
  )
}
```

**Checklist**:

```
[ ] Archivo creado
[ ] Compilar: npm run build
[ ] Sin errores TypeScript
[ ] Responsive en mobile (DevTools)
```

---

### Paso 4: Crear ProductCard.tsx (60 min)

**Ubicación**: `src/components/shop/ProductCard.tsx`

**Especificación**:

- Card component que muestra: imagen, nombre, precio, rating, stock
- Link a detail page
- "Add to Cart" button
- Out of stock badge si aplica
- ~150 líneas

**Código de referencia**:

```typescript
// src/components/shop/ProductCard.tsx

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  id: string
  name: string
  image: string
  price: number
  rating: number
  reviews: number
  inStock: boolean
}

export function ProductCard({
  id,
  name,
  image,
  price,
  rating,
  reviews,
  inStock,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover hover:scale-105 transition-transform"
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <Link href={`/shop/products/${id}`}>
          <h3 className="font-semibold text-lg truncate hover:text-blue-600">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-yellow-500 text-sm">★ {rating.toFixed(1)}</span>
          <span className="text-gray-500 text-sm">({reviews})</span>
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-blue-600 mt-2">
          ${price.toFixed(2)}
        </p>

        {/* CTA */}
        <Button
          disabled={!inStock}
          className="w-full mt-3"
          variant={inStock ? 'default' : 'outline'}
        >
          {inStock ? 'Add to Cart' : 'Notify Me'}
        </Button>
      </div>
    </div>
  )
}
```

**Checklist**:

```
[ ] Archivo creado
[ ] Props interface definida
[ ] Image component usado (next/image)
[ ] Link a detail page
[ ] Rating stars visible
[ ] Stock badge
[ ] npm run build pasa
```

---

## 🌤️ MARTES: COMPONENTES AVANZADOS

### Paso 5: Crear ProductGallery.tsx (90 min)

**Ubicación**: `src/components/shop/ProductGallery.tsx`

**Especificación**:

- Carousel de imágenes
- Thumbnails abajo
- Next/prev arrows
- Responsive
- ~200 líneas

**Código de referencia**:

```typescript
// src/components/shop/ProductGallery.tsx

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductGalleryProps {
  images: Array<{ id: string; url: string }>
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (!images.length) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    )
  }

  const handlePrev = () => {
    setSelectedIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden group">
        <Image
          src={images[selectedIdx].url}
          alt={`${productName} - Image ${selectedIdx + 1}`}
          fill
          className="object-cover"
          priority
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded hover:bg-white transition opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded hover:bg-white transition opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
          {selectedIdx + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIdx(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition ${
                selectedIdx === idx
                  ? 'border-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Checklist**:

```
[ ] useState para track imagen seleccionada
[ ] Navigation arrows appear on hover
[ ] Thumbnails abajo
[ ] Image counter
[ ] Responsive mobile
[ ] npm run build pasa
```

---

### Paso 6: Crear FilterSidebar.tsx (90 min)

**Ubicación**: `src/components/shop/FilterSidebar.tsx`

**Especificación**:

- Price range slider
- Category checkboxes
- Rating filter
- Availability toggle
- Apply/Reset buttons
- ~200 líneas

**Código de referencia**:

```typescript
// src/components/shop/FilterSidebar.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'

interface Category {
  id: string
  name: string
}

interface FilterSidebarProps {
  categories: Category[]
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  minPrice: number
  maxPrice: number
  categories: string[]
  minRating: number
  inStockOnly: boolean
}

export function FilterSidebar({ categories, onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 1000,
    categories: [],
    minRating: 0,
    inStockOnly: false,
  })

  const handleApply = () => {
    onFilterChange(filters)
  }

  const handleReset = () => {
    const reset: FilterState = {
      minPrice: 0,
      maxPrice: 1000,
      categories: [],
      minRating: 0,
      inStockOnly: false,
    }
    setFilters(reset)
    onFilterChange(reset)
  }

  return (
    <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-6">Filters</h2>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block font-semibold mb-3">Price Range</label>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={filters.minPrice}
            onChange={e => setFilters({...filters, minPrice: Number(e.target.value)})}
            className="w-1/2 px-2 py-1 border rounded"
            placeholder="Min"
          />
          <input
            type="number"
            value={filters.maxPrice}
            onChange={e => setFilters({...filters, maxPrice: Number(e.target.value)})}
            className="w-1/2 px-2 py-1 border rounded"
            placeholder="Max"
          />
        </div>
        <span className="text-sm text-gray-500">
          ${filters.minPrice} - ${filters.maxPrice}
        </span>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block font-semibold mb-3">Categories</label>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={cat.id}
                checked={filters.categories.includes(cat.id)}
                onCheckedChange={checked => {
                  if (checked) {
                    setFilters({
                      ...filters,
                      categories: [...filters.categories, cat.id],
                    })
                  } else {
                    setFilters({
                      ...filters,
                      categories: filters.categories.filter(id => id !== cat.id),
                    })
                  }
                }}
              />
              <label htmlFor={cat.id} className="text-sm cursor-pointer">
                {cat.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <label className="block font-semibold mb-3">Min Rating</label>
        <select
          value={filters.minRating}
          onChange={e => setFilters({...filters, minRating: Number(e.target.value)})}
          className="w-full px-3 py-2 border rounded"
        >
          <option value={0}>All ratings</option>
          <option value={3}>3+ stars</option>
          <option value={4}>4+ stars</option>
          <option value={5}>5 stars</option>
        </select>
      </div>

      {/* Availability */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="inStock"
            checked={filters.inStockOnly}
            onCheckedChange={checked => setFilters({...filters, inStockOnly: !!checked})}
          />
          <label htmlFor="inStock" className="text-sm cursor-pointer">
            In Stock Only
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleApply} className="flex-1">
          Apply
        </Button>
        <Button onClick={handleReset} variant="outline" className="flex-1">
          Reset
        </Button>
      </div>
    </div>
  )
}
```

**Checklist**:

```
[ ] State management con useState
[ ] Price inputs
[ ] Category checkboxes
[ ] Rating dropdown
[ ] Availability toggle
[ ] Apply/Reset buttons
[ ] Llamadas al callback onFilterChange
[ ] npm run build pasa
```

---

## 🌧️ MIÉRCOLES: COMPONENTES DE CONTENIDO

### Paso 7: Crear ProductReviews.tsx (75 min)

**Ubicación**: `src/components/shop/ProductReviews.tsx`

```typescript
// src/components/shop/ProductReviews.tsx

'use client'

interface Review {
  id: string
  author: string
  rating: number
  title: string
  comment: string
  helpful: number
  createdAt: string
}

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  totalReviews,
}: ProductReviewsProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Rating Summary */}
        <div className="flex flex-col items-center justify-center border rounded-lg p-6 min-w-40">
          <div className="text-4xl font-bold text-yellow-500 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="text-yellow-500 mb-2">★★★★★</div>
          <div className="text-sm text-gray-600">
            Based on {totalReviews} reviews
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-2">
              <span className="w-12 text-sm text-gray-600">{star}★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-yellow-500" style={{width: '60%'}} />
              </div>
              <span className="w-8 text-sm text-gray-600 text-right">20</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Customer Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <div className="font-semibold">{review.author}</div>
                <div className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-yellow-500 mb-2">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              <h4 className="font-bold mb-1">{review.title}</h4>
              <p className="text-gray-700 mb-3">{review.comment}</p>
              <div className="flex gap-2">
                <button className="text-sm text-blue-600 hover:underline">
                  👍 Helpful ({review.helpful})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

**Checklist**:

```
[ ] Rating summary display
[ ] Rating distribution bar
[ ] Reviews list
[ ] Author, date, title, comment
[ ] Helpful votes button
[ ] "No reviews" state
[ ] npm run build pasa
```

---

### Paso 8: Crear RelatedProducts.tsx (75 min)

```typescript
// src/components/shop/RelatedProducts.tsx

'use client'

import { ProductCard } from './ProductCard'

interface RelatedProduct {
  id: string
  name: string
  image: string
  price: number
  rating: number
  reviews: number
  inStock: boolean
}

interface RelatedProductsProps {
  products: RelatedProduct[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products.length) return null

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            image={product.image}
            price={product.price}
            rating={product.rating}
            reviews={product.reviews}
            inStock={product.inStock}
          />
        ))}
      </div>
    </section>
  )
}
```

---

### Paso 9: Crear SearchAutocomplete.tsx (75 min)

```typescript
// src/components/shop/SearchAutocomplete.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchSuggestion {
  id: string
  name: string
  image: string
}

export function SearchAutocomplete() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.results || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (productId: string) => {
    router.push(`/shop/products/${productId}`)
    setQuery('')
    setShowSuggestions(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/shop/search?q=${encodeURIComponent(query)}`)
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="flex-1 outline-none"
          />
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-2 z-50">
          {suggestions.map(suggestion => (
            <button
              key={suggestion.id}
              onClick={() => handleSelect(suggestion.id)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left"
            >
              <img
                src={suggestion.image}
                alt={suggestion.name}
                className="w-10 h-10 rounded object-cover"
              />
              <span>{suggestion.name}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg p-4 mt-2 text-center text-gray-500">
          Searching...
        </div>
      )}
    </div>
  )
}
```

**Checklist**:

```
[ ] Input field con icon
[ ] Debounced search (300ms)
[ ] Dropdown suggestions
[ ] Click to navigate
[ ] Loading state
[ ] No suggestions state
[ ] npm run build pasa
```

---

## ☀️ JUEVES: PÁGINAS + BACKEND

### Paso 10: Crear app/(shop)/shop/page.tsx (120 min)

**Ubicación**: `src/app/(shop)/shop/page.tsx`

```typescript
// src/app/(shop)/shop/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { ShopHero } from '@/components/shop/ShopHero'
import { ProductCard } from '@/components/shop/ProductCard'
import { FilterSidebar, FilterState } from '@/components/shop/FilterSidebar'

interface Product {
  id: string
  name: string
  basePrice: number | any
  salePrice?: number | any | null
  stock: number
  images: { url: string }[]
  rating: number
  reviews: number
  category: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 1000,
    categories: [],
    minRating: 0,
    inStockOnly: false,
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories/hierarchy')
        const data = await res.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          minPrice: filters.minPrice.toString(),
          maxPrice: filters.maxPrice.toString(),
          minRating: filters.minRating.toString(),
          inStock: filters.inStockOnly.toString(),
          ...(filters.categories.length > 0 && {
            categories: filters.categories.join(','),
          }),
        })

        const res = await fetch(`/api/products?${params}`)
        const data = await res.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters, currentPage])

  const displayPrice = (product: Product) => {
    const basePrice = parseFloat(String(product.basePrice))
    const salePrice = product.salePrice ? parseFloat(String(product.salePrice)) : null
    return salePrice && salePrice < basePrice ? salePrice : basePrice
  }

  return (
    <>
      {/* Hero Section */}
      <ShopHero />

      {/* Shop Section */}
      <section id="products" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {/* Sidebar */}
            <FilterSidebar
              categories={categories}
              onFilterChange={setFilters}
            />

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-12">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No products found. Try adjusting your filters.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {products.map(product => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        image={product.images[0]?.url || '/placeholder.png'}
                        price={displayPrice(product)}
                        rating={product.rating}
                        reviews={product.reviews}
                        inStock={product.stock > 0}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <div className="px-4 py-2">Page {currentPage}</div>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={products.length < 12}
                      className="px-4 py-2 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
```

**Checklist**:

```
[ ] Importar todos los componentes
[ ] Fetch categories
[ ] Fetch products con filters
[ ] Product grid (responsive)
[ ] Pagination
[ ] Loading state
[ ] Empty state
[ ] npm run build pasa
```

---

### Paso 11: Crear app/(shop)/shop/products/[id]/page.tsx (150 min)

```typescript
// src/app/(shop)/shop/products/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { ProductGallery } from '@/components/shop/ProductGallery'
import { ProductReviews } from '@/components/shop/ProductReviews'
import { RelatedProducts } from '@/components/shop/RelatedProducts'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  description: string | null
  basePrice: number | any
  salePrice?: number | any | null
  stock: number
  sku: string | null
  images: Array<{ id: string; url: string }>
  category: { id: string; name: string } | null
  rating: number
  reviews: number
}

interface Review {
  id: string
  author: string
  rating: number
  title: string
  comment: string
  helpful: number
  createdAt: string
}

interface PageProps {
  params: {
    id: string
  }
}

export default function ProductDetailPage({ params }: PageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch product
        const productRes = await fetch(`/api/products/${params.id}`)
        const productData = await productRes.json()
        setProduct(productData.product)

        // Fetch reviews
        const reviewsRes = await fetch(`/api/products/${params.id}/reviews`)
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData.reviews || [])

        // Fetch related products
        const relatedRes = await fetch(`/api/products/${params.id}/related`)
        const relatedData = await relatedRes.json()
        setRelated(relatedData.products || [])
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (loading) return <div className="container py-12 text-center">Loading...</div>
  if (!product) return <div className="container py-12 text-center">Product not found</div>

  const displayPrice = () => {
    const basePrice = parseFloat(String(product.basePrice))
    const salePrice = product.salePrice
      ? parseFloat(String(product.salePrice))
      : null
    return salePrice && salePrice < basePrice ? salePrice : basePrice
  }

  const originalPrice = parseFloat(String(product.basePrice))
  const currentPrice = displayPrice()
  const discount =
    originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0

  return (
    <div className="container py-12">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600">
        <a href="/shop" className="hover:text-blue-600">
          Shop
        </a>
        {product.category && (
          <>
            {' / '}
            <a href={`/shop?category=${product.category.id}`} className="hover:text-blue-600">
              {product.category.name}
            </a>
          </>
        )}
        {' / '}
        <span>{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Left: Gallery */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Right: Details */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">★ {product.rating.toFixed(1)}</span>
            <span className="text-gray-600">({product.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-blue-600">
                ${currentPrice.toFixed(2)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className="text-red-600 font-bold">-{discount}%</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="text-gray-700">{product.description}</div>
          )}

          {/* Stock Status */}
          <div className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>

          {/* Quantity & CTA */}
          <div className="space-y-4">
            {product.stock > 0 && (
              <div className="flex gap-4">
                <div className="flex items-center border rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                    min="1"
                    max={product.stock}
                    className="w-16 text-center outline-none"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <Button
              size="lg"
              disabled={product.stock === 0}
              className="w-full"
            >
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>

          {/* SKU */}
          {product.sku && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold">SKU:</span> {product.sku}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mb-12">
        <ProductReviews
          productId={product.id}
          reviews={reviews}
          averageRating={product.rating}
          totalReviews={product.reviews}
        />
      </div>

      {/* Related Products */}
      {related.length > 0 && <RelatedProducts products={related} />}
    </div>
  )
}
```

---

### Paso 12: Implementar 5 Endpoints Backend (180 min)

#### Endpoint 1: GET /api/products/search

```typescript
// src/app/api/products/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

/**
 * GET /api/products/search
 * Search products with autocomplete
 * Query params: q=query, limit=10
 */
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    const results = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        published: true,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        images: { take: 1 },
      },
      take: limit,
    });

    return NextResponse.json({
      query,
      results: results.map((p) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(String(p.basePrice)),
        image: p.images[0]?.url || "/placeholder.png",
      })),
    });
  } catch (error) {
    console.error("[SEARCH] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Endpoint 2: GET /api/products/:id/related

```typescript
// src/app/api/products/[id]/related/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: { categoryId: true, basePrice: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const related = await db.product.findMany({
      where: {
        id: { not: params.id },
        categoryId: product.categoryId,
        published: true,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        salePrice: true,
        stock: true,
        images: { take: 1 },
        rating: true,
        reviewCount: true,
      },
      take: 6,
    });

    return NextResponse.json({
      products: related.map((p) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(String(p.basePrice)),
        salePrice: p.salePrice ? parseFloat(String(p.salePrice)) : null,
        image: p.images[0]?.url || "/placeholder.png",
        inStock: p.stock > 0,
        rating: p.rating,
        reviews: p.reviewCount || 0,
      })),
    });
  } catch (error) {
    console.error("[RELATED] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Endpoint 3: GET /api/products/:id/reviews

```typescript
// src/app/api/products/[id]/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;

    const reviews = await db.review.findMany({
      where: { productId: params.id },
      select: {
        id: true,
        title: true,
        comment: true,
        rating: true,
        helpful: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await db.review.count({
      where: { productId: params.id },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        author: r.user.name,
        title: r.title,
        comment: r.comment,
        rating: r.rating,
        helpful: r.helpful,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[REVIEWS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Endpoint 4: POST /api/reviews

```typescript
// src/app/api/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { z } from "zod";

const CreateReviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  title: z.string().min(3).max(100),
  comment: z.string().min(10).max(1000),
  rating: z.number().min(1).max(5),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = CreateReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: validation.error.issues },
        { status: 400 },
      );
    }

    const { productId, title, comment, rating } = validation.data;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create review
    const review = await db.review.create({
      data: {
        productId,
        userId: session.user.id,
        title,
        comment,
        rating,
      },
      include: { user: true },
    });

    return NextResponse.json(
      {
        message: "Review created successfully",
        review: {
          id: review.id,
          title: review.title,
          comment: review.comment,
          rating: review.rating,
          author: review.user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[REVIEWS] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Endpoint 5: GET /api/categories/hierarchy

```typescript
// src/app/api/categories/hierarchy/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const categories = await db.category.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
      orderBy: { name: "asc" },
    });

    // Build hierarchy
    const hierarchy = categories
      .filter((c) => !c.parentId)
      .map((parent) => ({
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        children: categories
          .filter((c) => c.parentId === parent.id)
          .map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
          })),
      }));

    return NextResponse.json({ categories: hierarchy });
  } catch (error) {
    console.error("[CATEGORIES] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 🌞 VIERNES: TESTING + PR

### Paso 13: Testing & Validation (120 min)

```bash
# 1. Build
npm run build
# Must show: ✓ Compiled successfully

# 2. Type checking
npm run type-check
# Must show: No errors

# 3. Linting
npm run lint
# Must show: 0 warnings

# 4. Manual testing (30 min)
npm run dev
# Open http://localhost:3000/shop

# Desktop testing:
- [ ] Hero section visible
- [ ] Featured products load
- [ ] Filters work (price, category, rating)
- [ ] Search autocomplete appears
- [ ] Click product → detail page loads
- [ ] Gallery images work
- [ ] Add to cart button visible
- [ ] Related products show

# Mobile testing (DevTools):
- [ ] Hero responsive
- [ ] Products grid responsive (1 column)
- [ ] Filters collapsible
- [ ] Product detail readable
- [ ] Gallery scrollable
- [ ] Buttons touchable (48px+)

# 5. Lighthouse audit
- [ ] Open Chrome DevTools > Lighthouse
- [ ] Run audit
- [ ] Performance: 85+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+

# 6. Cross-browser
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari (Mac) ✓
```

### Paso 14: Create PR #7 (30 min)

```bash
# Final commit
git add .
git commit -m "feat(shop): Implement complete shop frontend with search and filters

Shop Frontend Features:
- 7 reusable components (ShopHero, ProductCard, ProductGallery, FilterSidebar, ProductReviews, RelatedProducts, SearchAutocomplete)
- 2 fully functional pages (shop listing, product detail)
- 5 API endpoints (search, related products, reviews, create review, category hierarchy)
- Advanced filtering (price, category, rating, availability)
- Real-time search autocomplete (300ms debounce)
- Product gallery with navigation
- Customer reviews with ratings
- Related products carousel
- Responsive design (mobile, tablet, desktop)
- Pagination support
- Loading and empty states

Components: 1,400+ lines
Pages: 450+ lines
APIs: 350+ lines
Total: 2,200+ lines of production code

Testing:
✅ npm run build - 0 errors
✅ npm run type-check - 0 errors
✅ npm run lint - 0 warnings
✅ Manual testing (desktop + mobile)
✅ Lighthouse 90+ score
✅ Cross-browser tested

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push
git push origin feature/semana-1-shop-frontend

# Create PR on GitHub
# Go to: https://github.com/SACRINT/SACRINT_Tienda_OnLine/pulls
# Click: New Pull Request
# Base: develop
# Compare: feature/semana-1-shop-frontend
```

---

## ✅ CHECKLIST FINAL SEMANA 1

```
COMPONENTES (7):
✅ ShopHero.tsx
✅ ProductCard.tsx
✅ ProductGallery.tsx
✅ FilterSidebar.tsx
✅ ProductReviews.tsx
✅ RelatedProducts.tsx
✅ SearchAutocomplete.tsx

PÁGINAS (2):
✅ app/(shop)/shop/page.tsx
✅ app/(shop)/shop/products/[id]/page.tsx

ENDPOINTS (5):
✅ GET /api/products/search
✅ GET /api/products/:id/related
✅ GET /api/products/:id/reviews
✅ POST /api/reviews
✅ GET /api/categories/hierarchy

QUALITY:
✅ npm run build - Passes
✅ npm run type-check - 0 errors
✅ npm run lint - 0 warnings
✅ Manual testing - All features work
✅ Mobile responsive - Verified
✅ Lighthouse 90+ - Achieved
✅ PR #7 created - Ready for review

RESULTADO:
✅ Clientes pueden navegar productos
✅ Clientes pueden filtrar por precio, categoría, rating
✅ Clientes pueden buscar en tiempo real
✅ Clientes pueden ver detalles
✅ Clientes pueden ver reviews
✅ Clientes pueden agregar a carrito
```

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE SEMANA 1

Una vez que el PR #7 sea mergeado a develop:

1. **Code Review**: Usuario revisa el código
2. **Merge**: PR se mergea a develop
3. **Semana 2**: Continúa con tareas de Semana 2 (User Account)
4. **Fin de Semana 2**: PR #8 listo con User Account features

---

**Good luck! ¡Adelante con Semana 1!** 🚀
