// Pull to Refresh Component
// Mobile pull-to-refresh functionality

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);
  const currentY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop !== 0 || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0) {
      // Apply resistance
      const pull = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(pull);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    startY.current = 0;
    currentY.current = 0;
  };

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-transform"
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm",
            shouldTrigger && "text-primary",
          )}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 transition-transform",
              isRefreshing && "animate-spin",
            )}
            style={{
              transform: `rotate(${progress * 180}deg)`,
            }}
          />
          <span>
            {isRefreshing
              ? "Refreshing..."
              : shouldTrigger
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 0.2s" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
