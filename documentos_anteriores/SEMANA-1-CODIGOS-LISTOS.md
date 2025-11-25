# 📝 SEMANA 1 - CÓDIGOS LISTOS PARA COPIAR-PEGAR

**Para**: Arquitecto
**Uso**: Copia cada código a su archivo correspondiente
**Total componentes**: 7
**Total páginas**: 2
**Total endpoints**: 5

---

## 🎨 COMPONENTES (7)

### 1. ShopHero.tsx

**Ubicación**: `src/components/shop/ShopHero.tsx`

```typescript
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

---

### 2. ProductCard.tsx

**Ubicación**: `src/components/shop/ProductCard.tsx`

```typescript
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

---

### 3. ProductGallery.tsx

**Ubicación**: `src/components/shop/ProductGallery.tsx`

```typescript
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
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded hover:bg-white transition opacity-0 group-hover:opacity-100 z-10"
              aria-label="Next image"
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
              aria-label={`View image ${idx + 1}`}
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

---

### 4. FilterSidebar.tsx

**Ubicación**: `src/components/shop/FilterSidebar.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
            onChange={e => setFilters({ ...filters, minPrice: Number(e.target.value) })}
            className="w-1/2 px-2 py-1 border rounded"
            placeholder="Min"
          />
          <input
            type="number"
            value={filters.maxPrice}
            onChange={e => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
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
          onChange={e => setFilters({ ...filters, minRating: Number(e.target.value) })}
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
            onCheckedChange={checked => setFilters({ ...filters, inStockOnly: !!checked })}
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

---

### 5. ProductReviews.tsx

**Ubicación**: `src/components/shop/ProductReviews.tsx`

```typescript
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
                <div className="h-full bg-yellow-500" style={{ width: '60%' }} />
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

---

### 6. RelatedProducts.tsx

**Ubicación**: `src/components/shop/RelatedProducts.tsx`

```typescript
'use client'

import { ProductCard } from './ProductCard'

interface Product {
  id: string
  name: string
  basePrice: number | string
  images: Array<{ url: string }>
  stock: number | string
  reviewCount?: number
  rating?: number
}

interface RelatedProductsProps {
  products: Product[]
  title?: string
}

export function RelatedProducts({
  products,
  title = 'Related Products',
}: RelatedProductsProps) {
  if (!products.length) {
    return null
  }

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            image={product.images[0]?.url || '/placeholder.jpg'}
            price={Number(product.basePrice)}
            rating={product.rating || 4.5}
            reviews={product.reviewCount || 0}
            inStock={Number(product.stock) > 0}
          />
        ))}
      </div>
    </section>
  )
}
```

---

### 7. SearchAutocomplete.tsx

**Ubicación**: `src/components/shop/SearchAutocomplete.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  id: string
  name: string
  slug: string
}

export function SearchAutocomplete() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`)
        if (!response.ok) throw new Error('Search failed')

        const data = await response.json()
        setResults(data.data || [])
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query)}`)
      setShowResults(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          {isLoading && <Loader2 size={18} className="absolute right-3 top-2.5 animate-spin text-blue-600" />}
        </div>
      </form>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
          {results.map(result => (
            <Link
              key={result.id}
              href={`/shop/products/${result.id}`}
              className="block px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
              onClick={() => {
                setQuery('')
                setShowResults(false)
              }}
            >
              {result.name}
            </Link>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm z-50">
          No results found for "{query}"
        </div>
      )}
    </div>
  )
}
```

---

## 📄 PÁGINAS (2)

### 1. Shop Listing Page

**Ubicación**: `src/app/(shop)/shop/page.tsx`

```typescript
import { Suspense } from 'react'
import { db } from '@/lib/db/client'
import { auth } from '@/lib/auth/auth'
import { ShopHero } from '@/components/shop/ShopHero'
import { ProductCard } from '@/components/shop/ProductCard'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { SearchAutocomplete } from '@/components/shop/SearchAutocomplete'
import { Loader } from '@/components/ui/loader'

async function getCategories(tenantId: string) {
  try {
    const categories = await db.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    })
    return categories
  } catch (error) {
    console.error('[SHOP] Error fetching categories:', error)
    return []
  }
}

async function getProducts(tenantId: string) {
  try {
    const products = await db.product.findMany({
      where: { tenantId, published: true },
      select: {
        id: true,
        name: true,
        basePrice: true,
        images: { take: 1, select: { url: true } },
        stock: true,
        reviewCount: true,
        rating: true,
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
    })
    return products
  } catch (error) {
    console.error('[SHOP] Error fetching products:', error)
    return []
  }
}

export default async function ShopPage() {
  const session = await auth()
  const tenantId = session?.user?.tenantId

  if (!tenantId) {
    return <div className="text-center py-20">Please log in to browse products</div>
  }

  const [categories, products] = await Promise.all([
    getCategories(tenantId),
    getProducts(tenantId),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <ShopHero />

      {/* Search Bar */}
      <div className="sticky top-0 bg-white border-b py-4 px-4 md:px-8 z-10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <SearchAutocomplete />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 flex-shrink-0">
            <FilterSidebar
              categories={categories}
              onFilterChange={(filters) => {
                console.log('[SHOP] Filters applied:', filters)
                // TODO: Implement filter logic with URL params
              }}
            />
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-3xl font-bold">Products</h1>
              <p className="text-gray-600">{products.length} products</p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No products available yet
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    image={product.images[0]?.url || '/placeholder.jpg'}
                    price={Number(product.basePrice)}
                    rating={Number(product.rating) || 4.5}
                    reviews={Number(product.reviewCount) || 0}
                    inStock={Number(product.stock) > 0}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
```

---

### 2. Product Detail Page

**Ubicación**: `src/app/(shop)/shop/products/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db/client'
import { auth } from '@/lib/auth/auth'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ProductGallery } from '@/components/shop/ProductGallery'
import { ProductReviews } from '@/components/shop/ProductReviews'
import { RelatedProducts } from '@/components/shop/RelatedProducts'
import { ShoppingCart, Heart } from 'lucide-react'

async function getProduct(id: string, tenantId: string) {
  try {
    const product = await db.product.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        salePrice: true,
        stock: true,
        sku: true,
        images: { select: { id: true, url: true } },
        category: { select: { id: true, name: true } },
        variants: { select: { id: true, size: true, color: true } },
        rating: true,
        reviewCount: true,
      },
    })
    return product
  } catch (error) {
    console.error('[PRODUCT] Error fetching product:', error)
    return null
  }
}

async function getProductReviews(productId: string) {
  try {
    const reviews = await db.review.findMany({
      where: { productId },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        user: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    return reviews.map(r => ({
      id: r.id,
      author: r.user.name || 'Anonymous',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      helpful: 0,
      createdAt: r.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error('[PRODUCT] Error fetching reviews:', error)
    return []
  }
}

async function getRelatedProducts(categoryId: string, productId: string, tenantId: string) {
  try {
    const products = await db.product.findMany({
      where: {
        tenantId,
        categoryId,
        id: { not: productId },
        published: true,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        images: { take: 1, select: { url: true } },
        stock: true,
        rating: true,
        reviewCount: true,
      },
      take: 4,
    })
    return products
  } catch (error) {
    console.error('[PRODUCT] Error fetching related products:', error)
    return []
  }
}

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await auth()
  const tenantId = session?.user?.tenantId

  if (!tenantId) {
    return <div className="text-center py-20">Please log in to view products</div>
  }

  const product = await getProduct(params.id, tenantId)

  if (!product) {
    notFound()
  }

  const [reviews, relatedProducts] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.categoryId || '', product.id, tenantId),
  ])

  const displayPrice = product.salePrice || product.basePrice
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto text-sm">
          <a href="/shop" className="text-blue-600 hover:underline">Shop</a>
          {' > '}
          {product.category && (
            <>
              <a href={`/shop?category=${product.category.id}`} className="text-blue-600 hover:underline">
                {product.category.name}
              </a>
              {' > '}
            </>
          )}
          <span className="text-gray-600">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Gallery */}
          <div>
            <ProductGallery
              images={product.images.map(img => ({ id: img.id, url: img.url }))}
              productName={product.name}
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <span className="text-yellow-500">★ {Number(product.rating).toFixed(1)}</span>
                <span className="text-gray-600">({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  ${Number(displayPrice).toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-500 line-through">
                    ${Number(product.basePrice).toFixed(2)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-semibold">
                  {Math.round((1 - Number(product.salePrice) / Number(product.basePrice)) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            )}

            {/* Stock */}
            <div className="text-sm">
              {Number(product.stock) > 0 ? (
                <span className="text-green-600 font-semibold">✓ In Stock ({product.stock})</span>
              ) : (
                <span className="text-red-600 font-semibold">✗ Out of Stock</span>
              )}
            </div>

            {/* SKU */}
            {product.sku && (
              <div className="text-sm text-gray-600">
                SKU: <span className="font-mono">{product.sku}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button
                size="lg"
                className="flex-1 flex items-center justify-center gap-2"
                disabled={Number(product.stock) === 0}
              >
                <ShoppingCart size={20} />
                {Number(product.stock) > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-6 flex items-center justify-center gap-2"
              >
                <Heart size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-12 p-6 bg-white rounded-lg">
            <h3 className="text-lg font-bold mb-4">Available Variants</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {product.variants.map(variant => (
                <button
                  key={variant.id}
                  className="p-3 border rounded hover:border-blue-600 hover:bg-blue-50 transition text-sm"
                >
                  {variant.size && <div className="font-semibold">Size: {variant.size}</div>}
                  {variant.color && <div className="text-gray-600">Color: {variant.color}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-12 bg-white rounded-lg p-6">
          <ProductReviews
            productId={product.id}
            reviews={reviews}
            averageRating={Number(product.rating) || 0}
            totalReviews={Number(product.reviewCount) || 0}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <RelatedProducts products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 🔌 ENDPOINTS (5)

### 1. GET /api/products/search

**Ubicación**: `src/app/api/products/search/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

const SearchSchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const validation = SearchSchema.safeParse({
      q: searchParams.get("q"),
      limit: searchParams.get("limit"),
    });

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const products = await db.product.findMany({
      where: {
        tenantId: session.user.tenantId,
        published: true,
        OR: [
          { name: { contains: validation.data.q, mode: "insensitive" } },
          { description: { contains: validation.data.q, mode: "insensitive" } },
          { sku: { contains: validation.data.q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: validation.data.limit,
    });

    return NextResponse.json({ data: products });
  } catch (error) {
    console.error("[SEARCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### 2. GET /api/products/:id/related

**Ubicación**: `src/app/api/products/[id]/related/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the product
    const product = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      select: { categoryId: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get related products from same category
    const relatedProducts = await db.product.findMany({
      where: {
        tenantId: session.user.tenantId,
        categoryId: product.categoryId,
        id: { not: params.id },
        published: true,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        images: { take: 1, select: { url: true } },
        stock: true,
        rating: true,
        reviewCount: true,
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: relatedProducts });
  } catch (error) {
    console.error("[RELATED_PRODUCTS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### 3. GET /api/products/:id/reviews

**Ubicación**: `src/app/api/products/[id]/reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

const ReviewPageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const validation = ReviewPageSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const skip = (validation.data.page - 1) * validation.data.limit;

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: { productId: params.id },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: validation.data.limit,
      }),
      db.review.count({ where: { productId: params.id } }),
    ]);

    return NextResponse.json({
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          author: r.user.name || "Anonymous",
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          helpful: 0,
          createdAt: r.createdAt.toISOString(),
        })),
        pagination: {
          page: validation.data.page,
          limit: validation.data.limit,
          total,
          pages: Math.ceil(total / validation.data.limit),
        },
      },
    });
  } catch (error) {
    console.error("[REVIEWS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### 4. POST /api/reviews

**Ubicación**: `src/app/api/reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

const CreateReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(5).max(100),
  comment: z.string().min(10).max(500),
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
        { error: "Invalid review data", details: validation.error.issues },
        { status: 400 },
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: validation.data.productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create review
    const review = await db.review.create({
      data: {
        productId: validation.data.productId,
        userId: session.user.id,
        rating: validation.data.rating,
        title: validation.data.title,
        comment: validation.data.comment,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Update product rating
    const allReviews = await db.review.findMany({
      where: { productId: validation.data.productId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await db.product.update({
      where: { id: validation.data.productId },
      data: {
        rating: parseFloat(avgRating.toFixed(2)),
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({
      data: {
        id: review.id,
        author: review.user.name || "Anonymous",
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        helpful: 0,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[CREATE_REVIEW]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### 5. GET /api/categories/hierarchy

**Ubicación**: `src/app/api/categories/hierarchy/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all categories
    const categories = await db.category.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });

    // Build hierarchy
    const categoryMap = new Map<string, CategoryNode>(
      categories.map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug, children: [] }]),
    );

    const roots: CategoryNode[] = [];

    for (const category of categories) {
      const node = categoryMap.get(category.id)!;

      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return NextResponse.json({
      data: roots.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    console.error("[CATEGORIES_HIERARCHY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## ✅ ÍNDICE PARA COPIAR

**Orden recomendado de copiar**:

1. ✅ **Lunes**: ShopHero.tsx, ProductCard.tsx
2. ✅ **Martes**: ProductGallery.tsx, FilterSidebar.tsx
3. ✅ **Miércoles**: ProductReviews.tsx, RelatedProducts.tsx, SearchAutocomplete.tsx
4. ✅ **Jueves**: Shop page, Product detail page, 5 endpoints
5. ✅ **Viernes**: Testing y PR

---

**Instrucciones**: Copia el código exactamente como está, línea por línea, en el archivo correspondiente.
