"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mantener compatibilidad con el código existente
export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  isVideo?: boolean;
}

export interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  className?: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  // Calcular distancia entre dos puntos táctiles para pinch-to-zoom
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Navegación entre imágenes
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  }, [images.length]);

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    resetZoom();
  };

  // Control de zoom
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const zoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  // Manejo de gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Un dedo - preparar para deslizar
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Dos dedos - preparar para zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale === 1) {
      // Deslizar para cambiar imagen (solo si no hay zoom)
      const deltaX = e.touches[0].clientX - touchStart.x;

      // Prevenir scroll vertical mientras se desliza horizontalmente
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = distance / initialPinchDistance;
      const newScale = Math.min(Math.max(scale * scaleChange, 1), 4);
      setScale(newScale);
      setInitialPinchDistance(distance);

      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan cuando hay zoom
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      setPosition({
        x: position.x + deltaX,
        y: position.y + deltaY,
      });
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && scale === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStart.x;

      // Umbral de 50px para considerar un swipe
      if (deltaX > 50) {
        goToPrevious();
      } else if (deltaX < -50) {
        goToNext();
      }
    }
  };

  // Manejo de teclado para navegación
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
        if (e.key === "Escape") setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, goToPrevious, goToNext]);

  // Prevenir scroll del body cuando está en fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">No hay imágenes disponibles</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <>
      {/* Galería Principal */}
      <div className="space-y-4">
        {/* Imagen Principal */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
          <div
            ref={imageRef}
            className="relative w-full h-full cursor-move"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.3s ease-out",
            }}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt || productName}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Controles de Navegación - Desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              <button
                onClick={goToNext}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </button>
            </>
          )}

          {/* Indicador de Página */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          )}

          {/* Botones de Zoom y Pantalla Completa */}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 1}
              className="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              aria-label="Alejar"
            >
              <ZoomOut className="h-5 w-5 text-gray-800" />
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= 4}
              className="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              aria-label="Acercar"
            >
              <ZoomIn className="h-5 w-5 text-gray-800" />
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-opacity"
              aria-label="Pantalla completa"
            >
              <Maximize2 className="h-5 w-5 text-gray-800" />
            </button>
          </div>

          {/* Indicador de Gesto de Deslizamiento (móvil) */}
          {images.length > 1 && scale === 1 && (
            <div className="md:hidden absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="flex items-center gap-2 text-white/60 text-xs animate-pulse">
                <ChevronLeft className="h-4 w-4" />
                <span>Desliza para cambiar</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>

        {/* Miniaturas (Thumbnails) */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToImage(index)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                  currentIndex === index
                    ? "border-blue-600 ring-2 ring-blue-600 ring-offset-2"
                    : "border-transparent hover:border-gray-300",
                )}
              >
                <Image
                  src={image.url}
                  alt={image.alt || `${productName} - ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 16vw"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Pantalla Completa */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {currentIndex + 1} / {images.length}
              </span>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Imagen en Pantalla Completa */}
          <div
            className="w-full h-full flex items-center justify-center cursor-move"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.3s ease-out",
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={currentImage.url}
                alt={currentImage.alt || productName}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {/* Controles de Navegación */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-colors"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-colors"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            </>
          )}

          {/* Controles de Zoom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 1}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Alejar"
            >
              <ZoomOut className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={resetZoom}
              disabled={scale === 1}
              className="bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-white text-sm font-medium">
                {Math.round(scale * 100)}%
              </span>
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= 4}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Acercar"
            >
              <ZoomIn className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
