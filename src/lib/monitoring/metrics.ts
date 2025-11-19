// @ts-nocheck
// Metrics Service
// Application performance monitoring

import { z } from "zod";

// Metric types
export type MetricType = "counter" | "gauge" | "histogram" | "summary";

// Metric labels
export type MetricLabels = Record<string, string>;

// Metric value
export interface MetricValue {
  name: string;
  type: MetricType;
  value: number;
  labels: MetricLabels;
  timestamp: Date;
}

// Histogram buckets
export interface HistogramBuckets {
  le: number;
  count: number;
}

// Histogram value
export interface HistogramValue {
  sum: number;
  count: number;
  buckets: HistogramBuckets[];
}

// Metrics registry
export class MetricsRegistry {
  private metrics = new Map<string, Metric>();

  // Register a metric
  register(metric: Metric): void {
    if (this.metrics.has(metric.name)) {
      console.warn(`Metric ${metric.name} already registered`);
      return;
    }
    this.metrics.set(metric.name, metric);
  }

  // Get a metric
  get(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  // Get all metrics
  getAll(): Metric[] {
    return Array.from(this.metrics.values());
  }

  // Export in Prometheus format
  toPrometheus(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.description}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      for (const value of metric.getValues()) {
        const labelsStr = Object.entries(value.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(",");

        lines.push(
          `${metric.name}${labelsStr ? `{${labelsStr}}` : ""} ${value.value}`,
        );
      }
    }

    return lines.join("\n");
  }

  // Export as JSON
  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const metric of this.metrics.values()) {
      result[metric.name] = {
        type: metric.type,
        description: metric.description,
        values: metric.getValues(),
      };
    }

    return result;
  }

  // Reset all metrics
  reset(): void {
    for (const metric of this.metrics.values()) {
      metric.reset();
    }
  }
}

// Base metric class
export abstract class Metric {
  readonly name: string;
  readonly type: MetricType;
  readonly description: string;
  protected values = new Map<string, number>();

  constructor(name: string, type: MetricType, description: string = "") {
    this.name = name;
    this.type = type;
    this.description = description;
  }

  protected getKey(labels: MetricLabels): string {
    return JSON.stringify(
      Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  abstract getValues(): MetricValue[];
  abstract reset(): void;
}

// Counter metric
export class Counter extends Metric {
  constructor(name: string, description: string = "") {
    super(name, "counter", description);
  }

  inc(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  getValues(): MetricValue[] {
    const result: MetricValue[] = [];

    for (const [key, value] of this.values.entries()) {
      result.push({
        name: this.name,
        type: this.type,
        value,
        labels: JSON.parse(key).reduce(
          (acc: MetricLabels, [k, v]: [string, string]) => {
            acc[k] = v;
            return acc;
          },
          {},
        ),
        timestamp: new Date(),
      });
    }

    return result;
  }

  reset(): void {
    this.values.clear();
  }
}

// Gauge metric
export class Gauge extends Metric {
  constructor(name: string, description: string = "") {
    super(name, "gauge", description);
  }

  set(labels: MetricLabels = {}, value: number): void {
    const key = this.getKey(labels);
    this.values.set(key, value);
  }

  inc(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  dec(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getKey(labels);
    this.values.set(key, (this.values.get(key) || 0) - value);
  }

  getValues(): MetricValue[] {
    const result: MetricValue[] = [];

    for (const [key, value] of this.values.entries()) {
      result.push({
        name: this.name,
        type: this.type,
        value,
        labels: JSON.parse(key).reduce(
          (acc: MetricLabels, [k, v]: [string, string]) => {
            acc[k] = v;
            return acc;
          },
          {},
        ),
        timestamp: new Date(),
      });
    }

    return result;
  }

  reset(): void {
    this.values.clear();
  }
}

// Histogram metric
export class Histogram extends Metric {
  private bucketBounds: number[];
  private histograms = new Map<string, HistogramValue>();

  constructor(
    name: string,
    description: string = "",
    buckets: number[] = [
      0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
    ],
  ) {
    super(name, "histogram", description);
    this.bucketBounds = buckets.sort((a, b) => a - b);
  }

  observe(labels: MetricLabels = {}, value: number): void {
    const key = this.getKey(labels);

    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        sum: 0,
        count: 0,
        buckets: this.bucketBounds.map((le) => ({ le, count: 0 })),
      });
    }

    const histogram = this.histograms.get(key)!;
    histogram.sum += value;
    histogram.count += 1;

    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count += 1;
      }
    }
  }

  getValues(): MetricValue[] {
    const result: MetricValue[] = [];

    for (const [key, histogram] of this.histograms.entries()) {
      const labels = JSON.parse(key).reduce(
        (acc: MetricLabels, [k, v]: [string, string]) => {
          acc[k] = v;
          return acc;
        },
        {},
      );

      // Buckets
      for (const bucket of histogram.buckets) {
        result.push({
          name: `${this.name}_bucket`,
          type: this.type,
          value: bucket.count,
          labels: { ...labels, le: String(bucket.le) },
          timestamp: new Date(),
        });
      }

      // +Inf bucket
      result.push({
        name: `${this.name}_bucket`,
        type: this.type,
        value: histogram.count,
        labels: { ...labels, le: "+Inf" },
        timestamp: new Date(),
      });

      // Sum
      result.push({
        name: `${this.name}_sum`,
        type: this.type,
        value: histogram.sum,
        labels,
        timestamp: new Date(),
      });

      // Count
      result.push({
        name: `${this.name}_count`,
        type: this.type,
        value: histogram.count,
        labels,
        timestamp: new Date(),
      });
    }

    return result;
  }

  reset(): void {
    this.histograms.clear();
  }
}

// Create default registry
export const metricsRegistry = new MetricsRegistry();

// Pre-defined metrics
export const httpRequestsTotal = new Counter(
  "http_requests_total",
  "Total number of HTTP requests",
);

export const httpRequestDuration = new Histogram(
  "http_request_duration_seconds",
  "HTTP request duration in seconds",
);

export const activeConnections = new Gauge(
  "active_connections",
  "Number of active connections",
);

export const databaseQueryDuration = new Histogram(
  "database_query_duration_seconds",
  "Database query duration in seconds",
);

export const cacheHits = new Counter(
  "cache_hits_total",
  "Total number of cache hits",
);

export const cacheMisses = new Counter(
  "cache_misses_total",
  "Total number of cache misses",
);

// Register default metrics
metricsRegistry.register(httpRequestsTotal);
metricsRegistry.register(httpRequestDuration);
metricsRegistry.register(activeConnections);
metricsRegistry.register(databaseQueryDuration);
metricsRegistry.register(cacheHits);
metricsRegistry.register(cacheMisses);

// Timer helper
export function measureTime<T>(
  fn: () => T | Promise<T>,
  histogram: Histogram,
  labels: MetricLabels = {},
): T | Promise<T> {
  const start = process.hrtime.bigint();

  const recordDuration = () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e9; // Convert to seconds
    histogram.observe(labels, duration);
  };

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(recordDuration);
    }

    recordDuration();
    return result;
  } catch (error) {
    recordDuration();
    throw error;
  }
}
