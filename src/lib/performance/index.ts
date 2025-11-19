// Performance utilities and helpers

import { cache } from "react";

// Memoized data fetcher for server components
export const memoizedFetch = cache(
  async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    return response.json();
  },
);

// Debounce function for search and input handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle function for scroll and resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Intersection Observer hook for lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
): IntersectionObserver | null {
  if (typeof window === "undefined") return null;
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  });
}

// Preload image utility
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Preload multiple images
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

// Request idle callback polyfill
export function requestIdleCallback(callback: IdleRequestCallback): number {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    return window.requestIdleCallback(callback);
  }
  return setTimeout(
    () => callback({ didTimeout: false, timeRemaining: () => 50 }),
    1,
  ) as unknown as number;
}

// Cancel idle callback polyfill
export function cancelIdleCallback(id: number): void {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

// Measure performance
export function measurePerformance(name: string): () => void {
  if (typeof window === "undefined" || !window.performance) {
    return () => {};
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  performance.mark(startMark);

  return () => {
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);

    const measure = performance.getEntriesByName(name)[0];
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
    }

    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
  };
}

// Web Vitals reporting
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: string;
}) {
  // Send to analytics
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value}`);
  }

  // In production, send to your analytics service
  // analytics.track('Web Vitals', {
  //   metric_id: metric.id,
  //   metric_name: metric.name,
  //   metric_value: metric.value,
  //   metric_label: metric.label,
  // })
}

// Prefetch link on hover
export function prefetchOnHover(url: string): void {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}

// Bundle size analyzer helper (for development)
export function analyzeBundle(moduleName: string, moduleSize: number): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Bundle] ${moduleName}: ${(moduleSize / 1024).toFixed(2)}KB`);
  }
}

// Memory usage check
export function checkMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
} | null {
  if (typeof window === "undefined") return null;

  const memory = (performance as any).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
  };
}

// Stale-while-revalidate cache pattern
export function createSWRCache<T>(ttl: number = 60000) {
  const cache = new Map<string, { data: T; timestamp: number }>();

  return {
    get(key: string): T | null {
      const entry = cache.get(key);
      if (!entry) return null;

      const isStale = Date.now() - entry.timestamp > ttl;
      if (isStale) {
        // Return stale data but mark for revalidation
        return entry.data;
      }

      return entry.data;
    },

    set(key: string, data: T): void {
      cache.set(key, { data, timestamp: Date.now() });
    },

    isStale(key: string): boolean {
      const entry = cache.get(key);
      if (!entry) return true;
      return Date.now() - entry.timestamp > ttl;
    },

    invalidate(key: string): void {
      cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },
  };
}
