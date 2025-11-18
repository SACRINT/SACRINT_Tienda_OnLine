'use client'

import { Suspense, ComponentType, lazy } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: string
}

// Componente de carga genérico
export function LoadingSpinner({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Skeleton para tarjetas de productos
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

// Skeleton para lista de órdenes
export function OrderCardSkeleton() {
  return (
    <div className="animate-pulse border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex justify-between mb-3">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  )
}

// Grid de productos skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Wrapper de Suspense con fallback personalizado
export function LazyLoad({ children, fallback, minHeight = '200px' }: LazyLoadProps) {
  const defaultFallback = (
    <div style={{ minHeight }} className="flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
}

// HOC para crear componentes lazy con configuración
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Componente para lazy loading de imágenes con Intersection Observer
export function LazyImage({
  src,
  alt,
  className,
  width = 500,
  height = 500,
  onLoad,
}: {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  onLoad?: () => void
}) {
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      onLoad={onLoad}
    />
  )
}
