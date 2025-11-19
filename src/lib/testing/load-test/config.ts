// Load Test Configuration
// Settings for performance and load testing

export interface LoadTestConfig {
  name: string;
  targetUrl: string;
  duration: number; // seconds
  virtualUsers: number;
  rampUp: number; // seconds
  thresholds: {
    p95ResponseTime: number;
    errorRate: number;
    minThroughput: number;
  };
}

// Default test configurations
export const TEST_CONFIGS: Record<string, LoadTestConfig> = {
  smoke: {
    name: "Smoke Test",
    targetUrl: "/",
    duration: 30,
    virtualUsers: 5,
    rampUp: 5,
    thresholds: {
      p95ResponseTime: 500,
      errorRate: 0,
      minThroughput: 10,
    },
  },

  load: {
    name: "Load Test",
    targetUrl: "/",
    duration: 300,
    virtualUsers: 100,
    rampUp: 60,
    thresholds: {
      p95ResponseTime: 1000,
      errorRate: 1,
      minThroughput: 50,
    },
  },

  stress: {
    name: "Stress Test",
    targetUrl: "/",
    duration: 600,
    virtualUsers: 500,
    rampUp: 120,
    thresholds: {
      p95ResponseTime: 2000,
      errorRate: 5,
      minThroughput: 100,
    },
  },

  spike: {
    name: "Spike Test",
    targetUrl: "/",
    duration: 120,
    virtualUsers: 1000,
    rampUp: 10,
    thresholds: {
      p95ResponseTime: 3000,
      errorRate: 10,
      minThroughput: 50,
    },
  },

  endurance: {
    name: "Endurance Test",
    targetUrl: "/",
    duration: 3600,
    virtualUsers: 100,
    rampUp: 60,
    thresholds: {
      p95ResponseTime: 1000,
      errorRate: 1,
      minThroughput: 50,
    },
  },
};

// Critical paths to test
export const CRITICAL_PATHS = [
  { name: "Homepage", path: "/" },
  { name: "Product List", path: "/shop" },
  { name: "Product Detail", path: "/products/test-product" },
  { name: "Cart", path: "/cart" },
  { name: "Checkout", path: "/checkout" },
  { name: "Search", path: "/api/products?search=test" },
  { name: "Categories", path: "/api/categories" },
];

// Performance budget
export const PERFORMANCE_BUDGET = {
  homepage: {
    lcp: 2500,
    fcp: 1800,
    cls: 0.1,
    ttfb: 800,
  },
  productList: {
    lcp: 2500,
    fcp: 1800,
    cls: 0.1,
    ttfb: 800,
  },
  productDetail: {
    lcp: 2500,
    fcp: 1800,
    cls: 0.1,
    ttfb: 800,
  },
  checkout: {
    lcp: 2500,
    fcp: 1800,
    cls: 0.05,
    ttfb: 600,
  },
};
