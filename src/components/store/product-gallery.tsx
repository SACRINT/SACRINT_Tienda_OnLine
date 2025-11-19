// Product Gallery Component
// Image gallery with thumbnails and zoom

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [zoomPosition, setZoomPosition] = React.useState({ x: 50, y: 50 });

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
  };

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "aspect-square bg-muted rounded-lg flex items-center justify-center",
          className,
        )}
      >
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <div className={cn("space-y-4", className)} onKeyDown={handleKeyDown}>
      {/* Main Image */}
      <div className="relative group">
        <div
          className={cn(
            "relative aspect-square overflow-hidden rounded-lg bg-muted cursor-zoom-in",
            isZoomed && "cursor-zoom-out",
          )}
          onClick={() => setIsZoomed(!isZoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZoomed(false)}
        >
          <img
            src={currentImage.url}
            alt={
              currentImage.alt || `${productName} - Image ${selectedIndex + 1}`
            }
            className={cn(
              "h-full w-full object-cover transition-transform duration-200",
              isZoomed && "scale-150",
            )}
            style={
              isZoomed
                ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : undefined
            }
          />

          {!isZoomed && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 text-white rounded-full p-2">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={handlePrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors",
                index === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/50",
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? "true" : undefined}
            >
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
