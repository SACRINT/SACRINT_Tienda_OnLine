// Touch Carousel Component
// Swipeable carousel optimized for mobile

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TouchCarouselProps {
  children: React.ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  className?: string;
}

export function TouchCarousel({
  children,
  autoPlay = false,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = false,
  loop = true,
  className,
}: TouchCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const itemCount = children.length;
  const minSwipeDistance = 50;

  // Auto play
  React.useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= itemCount - 1) {
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, itemCount, loop]);

  const goToIndex = (index: number) => {
    if (index < 0) {
      setCurrentIndex(loop ? itemCount - 1 : 0);
    } else if (index >= itemCount) {
      setCurrentIndex(loop ? 0 : itemCount - 1);
    } else {
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => goToIndex(currentIndex - 1);
  const goToNext = () => goToIndex(currentIndex + 1);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Slides container */}
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {child}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && itemCount > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hidden sm:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hidden sm:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && itemCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex
                  ? "bg-primary"
                  : "bg-primary/30 hover:bg-primary/50",
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Horizontal scroll container for mobile
export interface HorizontalScrollProps {
  children: React.ReactNode;
  showScrollbar?: boolean;
  className?: string;
}

export function HorizontalScroll({
  children,
  showScrollbar = false,
  className,
}: HorizontalScrollProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto",
        !showScrollbar && "scrollbar-hide",
        className,
      )}
    >
      <div className="flex gap-4 px-4 -mx-4">{children}</div>
    </div>
  );
}

export default TouchCarousel;
