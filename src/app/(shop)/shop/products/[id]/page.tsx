// Product Detail Page
// Detailed product view with gallery, reviews, and related products

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
  ProductGallery,
  ProductReviews,
  RelatedProducts,
} from '@/components/shop'
import type { GalleryImage, Review, ProductCardProps } from '@/components/shop'
import { Star, Truck, Shield, RotateCcw, Heart, Share2 } from 'lucide-react'

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

// Mock data - In production, this would come from API/Database
const getMockProduct = (id: string) => {
  return {
    id,
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: `Experience crystal-clear audio with our Premium Wireless Headphones.
    Featuring advanced noise cancellation technology, these headphones deliver an immersive
    listening experience. With up to 30 hours of battery life, comfortable ear cushions,
    and premium build quality, they're perfect for music lovers, travelers, and professionals.`,
    shortDescription: 'High-quality wireless headphones with active noise cancellation',
    price: 299.99,
    salePrice: 249.99,
    sku: 'WH-1000XM4',
    stock: 45,
    rating: 4.5,
    reviewCount: 128,
    category: 'Electronics',
    brand: 'AudioTech',
    features: [
      'Active Noise Cancellation (ANC)',
      '30-hour battery life',
      'Quick charge: 10 min = 5 hours',
      'Premium comfort ear cushions',
      'Bluetooth 5.0 connectivity',
      'Built-in microphone for calls',
    ],
    specifications: {
      'Driver Size': '40mm',
      'Frequency Response': '20Hz - 20kHz',
      'Impedance': '32 Ohm',
      'Battery Life': '30 hours',
      'Charging Time': '3 hours',
      'Weight': '250g',
    },
  }
}

const getMockGalleryImages = (): GalleryImage[] => {
  return [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      alt: 'Headphones front view',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944',
      alt: 'Headphones side view',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1545127398-14699f92334b',
      alt: 'Headphones detail',
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
      alt: 'Headphones on desk',
    },
  ]
}

const getMockReviews = (): Review[] => {
  return [
    {
      id: '1',
      userId: '1',
      userName: 'John Doe',
      rating: 5,
      title: 'Amazing sound quality!',
      content: 'These headphones exceeded my expectations. The noise cancellation is top-notch.',
      isVerifiedPurchase: true,
      createdAt: new Date(2024, 10, 15).toISOString(),
      helpfulCount: 12,
    },
    {
      id: '2',
      userId: '2',
      userName: 'Jane Smith',
      rating: 4,
      title: 'Great but pricey',
      content: 'Love the sound quality and comfort. Battery life is excellent. Just wish they were a bit cheaper.',
      isVerifiedPurchase: true,
      createdAt: new Date(2024, 10, 10).toISOString(),
      helpfulCount: 8,
    },
  ]
}

const getMockRelatedProducts = (): ProductCardProps[] => {
  return [
    {
      id: '2',
      name: 'Wireless Earbuds Pro',
      slug: 'wireless-earbuds-pro',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
      price: 199.99,
      salePrice: 149.99,
      rating: 4.6,
      reviewCount: 89,
      inStock: true,
    },
    {
      id: '3',
      name: 'Studio Monitor Headphones',
      slug: 'studio-monitor-headphones',
      image: 'https://images.unsplash.com/photo-1528148343865-51218c4a13e6',
      price: 349.99,
      rating: 4.8,
      reviewCount: 156,
      inStock: true,
    },
  ]
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = getMockProduct(params.id)
  const galleryImages = getMockGalleryImages()
  const reviews = getMockReviews()
  const relatedProducts = getMockRelatedProducts()

  if (!product) {
    notFound()
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0

  const ratingDistribution = [
    { stars: 5, count: 85, percentage: 66 },
    { stars: 4, count: 30, percentage: 23 },
    { stars: 3, count: 10, percentage: 8 },
    { stars: 2, count: 2, percentage: 2 },
    { stars: 1, count: 1, percentage: 1 },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-600">
          <a href="/shop" className="hover:text-gray-900">
            Shop
          </a>
          <span>/</span>
          <a href={`/shop?category=${product.category}`} className="hover:text-gray-900">
            {product.category}
          </a>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-2 text-gray-600">{product.shortDescription}</p>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">
                ${(product.salePrice || product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                    Save {discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-4">
              {product.stock > 0 ? (
                <p className="text-sm text-green-600">
                  ✓ In stock ({product.stock} available)
                </p>
              ) : (
                <p className="text-sm text-red-600">Out of stock</p>
              )}
            </div>

            {/* Add to Cart */}
            <div className="mt-8 flex gap-4">
              <button className="flex-1 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Add to Cart
              </button>
              <button className="rounded-lg border-2 border-gray-300 p-4 transition-all hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Heart className="h-6 w-6 text-gray-600" />
              </button>
              <button className="rounded-lg border-2 border-gray-300 p-4 transition-all hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Share2 className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Truck className="h-5 w-5 text-blue-600" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>2-year warranty included</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                <span>30-day return policy</span>
              </div>
            </div>

            {/* Product Features */}
            <div className="mt-8 rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">Key Features</h3>
              <ul className="mt-4 space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1 text-blue-600">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-8">
              <button className="border-b-2 border-blue-600 pb-4 text-sm font-medium text-blue-600">
                Description
              </button>
              <button className="border-b-2 border-transparent pb-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                Specifications
              </button>
            </nav>
          </div>
          <div className="py-8">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <Suspense fallback={<div className="animate-pulse">Loading reviews...</div>}>
            <ProductReviews
              reviews={reviews}
              averageRating={product.rating}
              totalReviews={product.reviewCount}
              ratingDistribution={ratingDistribution}
              hasMore={false}
            />
          </Suspense>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <Suspense fallback={<div className="animate-pulse">Loading products...</div>}>
            <RelatedProducts products={relatedProducts} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
