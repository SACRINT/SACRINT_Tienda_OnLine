// @ts-nocheck
// Web Vitals Monitoring
// Core Web Vitals tracking for performance optimization

import type { Metric } from "web-vitals";

// Metric thresholds (Good, Needs Improvement, Poor)
export const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
} as const;

// Performance rating
export type Rating = "good" | "needs-improvement" | "poor";

export function getRating(name: keyof typeof THRESHOLDS, value: number): Rating {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

// Report handler type
export type ReportHandler = (metric: Metric) => void;

// Initialize Web Vitals monitoring
export function initWebVitals(onReport?: ReportHandler) {
  if (typeof window === "undefined") return;

  const handleMetric = (metric: Metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const rating = getRating(metric.name as keyof typeof THRESHOLDS, metric.value);
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value.toFixed(2),
        rating,
        delta: metric.delta.toFixed(2),
      });
    }

    // Send to analytics
    if (onReport) {
      onReport(metric);
    }

    // Send to custom endpoint
    sendToAnalytics(metric);
  };

  // Dynamically import web-vitals to reduce bundle size
  import("web-vitals").then(({ onCLS, onFID, onLCP, onFCP, onTTFB, onINP }) => {
    onCLS(handleMetric);
    onFID(handleMetric);
    onLCP(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
  });
}

// Send metrics to analytics endpoint
function sendToAnalytics(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name as keyof typeof THRESHOLDS, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    timestamp: Date.now(),
  };

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/vitals", blob);
  } else {
    // Fallback to fetch
    fetch("/api/analytics/vitals", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  }
}

// Performance observer for custom metrics
export function observePerformance() {
  if (typeof window === "undefined" || !window.PerformanceObserver) return;

  // Observe long tasks
  const longTaskObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
      }
    }
  });

  try {
    longTaskObserver.observe({ type: "longtask", buffered: true });
  } catch {
    // Long task not supported
  }

  // Observe layout shifts
  const layoutShiftObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
      if (!layoutShift.hadRecentInput && layoutShift.value > 0.01) {
        console.warn(`[Performance] Layout shift: ${layoutShift.value.toFixed(4)}`);
      }
    }
  });

  try {
    layoutShiftObserver.observe({ type: "layout-shift", buffered: true });
  } catch {
    // Layout shift not supported
  }

  return () => {
    longTaskObserver.disconnect();
    layoutShiftObserver.disconnect();
  };
}

// Performance timing utilities
export function getNavigationTiming() {
  if (typeof window === "undefined" || !window.performance) return null;

  const timing = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  if (!timing) return null;

  return {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    ssl: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
    ttfb: timing.responseStart - timing.requestStart,
    download: timing.responseEnd - timing.responseStart,
    domParse: timing.domInteractive - timing.responseEnd,
    domReady: timing.domContentLoadedEventEnd - timing.responseEnd,
    load: timing.loadEventEnd - timing.responseEnd,
    total: timing.loadEventEnd - timing.startTime,
  };
}

// Resource timing utilities
export function getResourceTiming() {
  if (typeof window === "undefined" || !window.performance) return [];

  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

  return resources.map((resource) => ({
    name: resource.name,
    type: resource.initiatorType,
    duration: resource.duration,
    size: resource.transferSize,
    cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
  }));
}

// Memory usage (Chrome only)
export function getMemoryUsage() {
  if (typeof window === "undefined") return null;

  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  if (!memory) return null;

  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

// Performance report generator
export function generatePerformanceReport() {
  const navigation = getNavigationTiming();
  const resources = getResourceTiming();
  const memory = getMemoryUsage();

  // Group resources by type
  const resourcesByType: Record<string, { count: number; size: number; duration: number }> = {};

  for (const resource of resources) {
    const type = resource.type;
    if (!resourcesByType[type]) {
      resourcesByType[type] = { count: 0, size: 0, duration: 0 };
    }
    resourcesByType[type].count++;
    resourcesByType[type].size += resource.size;
    resourcesByType[type].duration += resource.duration;
  }

  return {
    navigation,
    resources: resourcesByType,
    memory,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "",
  };
}
