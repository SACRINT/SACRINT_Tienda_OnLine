// Performance Benchmarking Utilities
// Measure and track performance metrics

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
}

// Run benchmark
export async function benchmark(
  name: string,
  fn: () => Promise<void> | void,
  iterations: number = 100,
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < Math.min(10, iterations / 10); i++) {
    await fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  // Calculate statistics
  times.sort((a, b) => a - b);
  const totalTime = times.reduce((a, b) => a + b, 0);

  return {
    name,
    iterations,
    totalTime,
    avgTime: totalTime / iterations,
    minTime: times[0],
    maxTime: times[times.length - 1],
    p50: times[Math.floor(iterations * 0.5)],
    p95: times[Math.floor(iterations * 0.95)],
    p99: times[Math.floor(iterations * 0.99)],
    throughput: (iterations / totalTime) * 1000,
  };
}

// Format benchmark result
export function formatBenchmarkResult(result: BenchmarkResult): string {
  return [
    "Benchmark: " + result.name,
    "  Iterations: " + result.iterations,
    "  Total: " + result.totalTime.toFixed(2) + "ms",
    "  Avg: " + result.avgTime.toFixed(2) + "ms",
    "  Min: " + result.minTime.toFixed(2) + "ms",
    "  Max: " + result.maxTime.toFixed(2) + "ms",
    "  P50: " + result.p50.toFixed(2) + "ms",
    "  P95: " + result.p95.toFixed(2) + "ms",
    "  P99: " + result.p99.toFixed(2) + "ms",
    "  Throughput: " + result.throughput.toFixed(2) + " ops/sec",
  ].join("\n");
}

// Compare two benchmark results
export function compareBenchmarks(
  baseline: BenchmarkResult,
  current: BenchmarkResult,
): {
  improvement: number;
  faster: boolean;
} {
  const improvement =
    ((baseline.avgTime - current.avgTime) / baseline.avgTime) * 100;
  return {
    improvement,
    faster: improvement > 0,
  };
}

// Memory usage tracker
export function getMemoryUsage(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
} | null {
  if (typeof process !== "undefined" && process.memoryUsage) {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss,
    };
  }
  return null;
}

// CPU usage estimate (simple)
export async function estimateCpuUsage(
  duration: number = 1000,
): Promise<number> {
  const start = process.hrtime.bigint();
  let ops = 0;

  const end = Date.now() + duration;
  while (Date.now() < end) {
    ops++;
    // Small computation
    Math.sqrt(ops);
  }

  const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
  return ops / elapsed;
}
