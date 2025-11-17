// Product Gallery Component
// Image carousel with thumbnails, zoom, and video support

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Maximize2, Play, X } from 'lucide-react'

export interface GalleryImage {
  id: string
  url: string
  alt?: string
  isVideo?: boolean
}

export interface ProductGalleryProps {
  images: GalleryImage[]
  productName: string
  className?: string
}

export function ProductGallery({
  images,
  productName,
  className = '',
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({})

  const currentImage = images[currentIndex]
  const hasMultipleImages = images.length > 1

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    setImageError({})
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    setImageError({})
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
    setImageError({})
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  const handleImageError = (imageId: string) => {
    setImageError((prev) => ({ ...prev, [imageId]: true }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') setIsZoomed(false)
  }

  return (
    <div className={`w-full ${className}`} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Main Image Display */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        {!imageError[currentImage.id] ? (
          <>
            {currentImage.isVideo ? (
              <div className="relative h-full w-full">
                <video
                  src={currentImage.url}
                  controls
                  className="h-full w-full object-cover"
                  poster={currentImage.url.replace(/\.[^/.]+$/, '.jpg')}
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute left-4 top-4 rounded-lg bg-black/60 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                  <Play className="inline h-4 w-4" /> Video
                </div>
              </div>
            ) : (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || `${productName} - Image ${currentIndex + 1}`}
                fill
                className={`object-cover transition-transform duration-300 ${
                  isZoomed ? 'cursor-zoom-out scale-150' : 'cursor-zoom-in'
                }`}
                onClick={toggleZoom}
                onError={() => handleImageError(currentImage.id)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                priority={currentIndex === 0}
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-4xl text-gray-400">📷</div>
              <p className="mt-2 text-sm text-gray-500">Image not available</p>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6 text-gray-900" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6 text-gray-900" />
            </button>
          </>
        )}

        {/* Zoom Button */}
        {!currentImage.isVideo && (
          <button
            onClick={toggleZoom}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? (
              <X className="h-5 w-5 text-gray-900" />
            ) : (
              <Maximize2 className="h-5 w-5 text-gray-900" />
            )}
          </button>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {hasMultipleImages && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToImage(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              {!imageError[image.id] ? (
                <>
                  {image.isVideo ? (
                    <div className="flex h-full w-full items-center justify-center bg-gray-900">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <Image
                      src={image.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(image.id)}
                      sizes="(max-width: 768px) 25vw, (max-width: 1200px) 20vw, 100px"
                    />
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-200">
                  <span className="text-xs text-gray-400">✕</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomed && !currentImage.isVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={toggleZoom}
        >
          <button
            onClick={toggleZoom}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 backdrop-blur-sm transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close zoom"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="relative h-[90vh] w-full max-w-6xl">
            {!imageError[currentImage.id] ? (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || productName}
                fill
                className="object-contain"
                onError={() => handleImageError(currentImage.id)}
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-white">Image could not be loaded</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
