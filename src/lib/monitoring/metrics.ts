/**
 * Custom Metrics Tracking
 * Track business metrics and application performance
 */

import { logger, logMetric } from "./logger";

interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    private autoFlush = true,
    private flushIntervalMs = 60000,
  ) {
    if (autoFlush && typeof window === "undefined") {
      // Only auto-flush on server-side
      this.startAutoFlush();
    }
  }

  /**
   * Record a metric
   */
  record(metric: MetricData): void {
    const key = this.getMetricKey(metric);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    // Log immediately in development
    if (process.env.NODE_ENV === "development") {
      logMetric(metric);
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      unit: "count",
      tags,
    });
  }

  /**
   * Record a timing/duration
   */
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value: duration,
      unit: "ms",
      tags,
    });
  }

  /**
   * Record a gauge (current value)
   */
  gauge(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      unit,
      tags,
    });
  }

  /**
   * Get all metrics
   */
  getAll(): Map<string, MetricData[]> {
    return new Map(this.metrics);
  }

  /**
   * Get metrics by name
   */
  get(name: string): MetricData[] {
    return Array.from(this.metrics.values())
      .flat()
      .filter((m) => m.name === name);
  }

  /**
   * Flush metrics (send to external service)
   */
  async flush(): Promise<void> {
    if (this.metrics.size === 0) return;

    const metricsToFlush = Array.from(this.metrics.values()).flat();

    // Log metrics
    metricsToFlush.forEach((metric) => {
      logMetric(metric);
    });

    // In production, you would send to external service here
    // Example: DataDog, CloudWatch, Prometheus, etc.
    if (process.env.NODE_ENV === "production") {
      // await sendToExternalService(metricsToFlush);
    }

    // Clear metrics after flush
    this.metrics.clear();
  }

  /**
   * Start auto-flush
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        logger.error({ error: err }, "Failed to flush metrics");
      });
    }, this.flushIntervalMs);
  }

  /**
   * Stop auto-flush
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Generate metric key
   */
  private getMetricKey(metric: MetricData): string {
    const tagString = metric.tags
      ? Object.entries(metric.tags)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join(",")
      : "";

    return `${metric.name}${tagString ? `|${tagString}` : ""}`;
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Business Metrics Helpers

/**
 * Track order metrics
 */
export function trackOrder(
  event: "created" | "paid" | "shipped" | "delivered" | "cancelled",
  orderId: string,
  value?: number,
): void {
  metrics.increment(`orders.${event}`, 1, { orderId });

  if (value) {
    metrics.gauge(`orders.value.${event}`, value, "currency", { orderId });
  }
}

/**
 * Track product metrics
 */
export function trackProduct(
  event: "viewed" | "added_to_cart" | "purchased",
  productId: string,
  quantity = 1,
): void {
  metrics.increment(`products.${event}`, quantity, { productId });
}

/**
 * Track user metrics
 */
export function trackUser(
  event: "signup" | "login" | "logout",
  userId?: string,
  method?: string,
): void {
  metrics.increment(`users.${event}`, 1, {
    userId: userId || "anonymous",
    method: method || "unknown",
  });
}

/**
 * Track search metrics
 */
export function trackSearch(query: string, resultsCount: number): void {
  metrics.increment("search.queries", 1, { hasResults: resultsCount > 0 ? "true" : "false" });
  metrics.gauge("search.results_count", resultsCount);
}

/**
 * Track review metrics
 */
export function trackReview(
  event: "submitted" | "approved" | "rejected",
  productId: string,
  rating?: number,
): void {
  metrics.increment(`reviews.${event}`, 1, { productId });

  if (rating) {
    metrics.gauge(`reviews.rating.${event}`, rating, "stars", { productId });
  }
}

/**
 * Track payment metrics
 */
export function trackPayment(
  event: "initiated" | "succeeded" | "failed" | "refunded",
  amount: number,
  currency: string,
  method?: string,
): void {
  metrics.increment(`payments.${event}`, 1, { currency, method: method || "unknown" });
  metrics.gauge(`payments.amount.${event}`, amount, currency, { method: method || "unknown" });
}

/**
 * Track API performance
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
): void {
  metrics.increment("api.calls", 1, {
    endpoint,
    method,
    status: statusCode.toString(),
  });
  metrics.timing("api.duration", duration, {
    endpoint,
    method,
  });
}

/**
 * Track cache metrics
 */
export function trackCache(event: "hit" | "miss" | "set" | "delete", key: string): void {
  metrics.increment(`cache.${event}`, 1, { key });
}

/**
 * Track error metrics
 */
export function trackError(type: string, message: string): void {
  metrics.increment("errors.count", 1, { type, message: message.substring(0, 100) });
}

export default metrics;
