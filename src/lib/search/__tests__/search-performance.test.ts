/**
 * Search Performance Tests
 * Task 11.10: Search Performance Tests
 *
 * Benchmarks para verificar que las búsquedas cumplen con los requisitos de performance:
 * - Simple search < 100ms
 * - Complex filters < 300ms
 * - Autocomplete < 200ms
 * - Facets < 150ms
 */

import { searchProducts, getSearchSuggestions } from "../search-engine";
import { getSearchFacets } from "@/lib/db/search";
import { db } from "@/lib/db";

// Mock tenant ID for tests
const TEST_TENANT_ID = "test-tenant-id";

// Performance thresholds (milliseconds)
const THRESHOLDS = {
  SIMPLE_SEARCH: 100,
  COMPLEX_FILTERS: 300,
  AUTOCOMPLETE: 200,
  FACETS: 150,
};

/**
 * Utility para medir tiempo de ejecución
 */
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, time: end - start };
}

describe("Search Performance Tests", () => {
  // Setup: Crear datos de prueba si no existen
  beforeAll(async () => {
    // Verificar si hay productos de prueba
    const productCount = await db.product.count({
      where: { tenantId: TEST_TENANT_ID },
    });

    if (productCount === 0) {
      console.warn("⚠️  No test products found. Some tests may not be representative.");
    }
  });

  describe("Simple Search Performance", () => {
    it(`should complete simple search in < ${THRESHOLDS.SIMPLE_SEARCH}ms`, async () => {
      const { time, result } = await measureTime(() =>
        searchProducts({
          query: "laptop",
          tenantId: TEST_TENANT_ID,
          page: 1,
          limit: 24,
        })
      );

      console.log(`✅ Simple search completed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.SIMPLE_SEARCH);
    });

    it("should handle empty query quickly", async () => {
      const { time } = await measureTime(() =>
        searchProducts({
          query: "",
          tenantId: TEST_TENANT_ID,
          page: 1,
          limit: 24,
        })
      );

      console.log(`✅ Empty query handled in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.SIMPLE_SEARCH);
    });
  });

  describe("Complex Filters Performance", () => {
    it(`should complete search with multiple filters in < ${THRESHOLDS.COMPLEX_FILTERS}ms`, async () => {
      const { time } = await measureTime(() =>
        searchProducts({
          query: "laptop",
          tenantId: TEST_TENANT_ID,
          minPrice: 100,
          maxPrice: 2000,
          inStock: true,
          featured: false,
          sortBy: "price-asc",
          page: 1,
          limit: 24,
        })
      );

      console.log(`✅ Complex search completed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.COMPLEX_FILTERS);
    });

    it("should handle price range filters efficiently", async () => {
      const { time } = await measureTime(() =>
        searchProducts({
          tenantId: TEST_TENANT_ID,
          minPrice: 0,
          maxPrice: 1000,
          sortBy: "price-desc",
          page: 1,
          limit: 24,
        })
      );

      console.log(`✅ Price range filter completed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.SIMPLE_SEARCH);
    });
  });

  describe("Autocomplete Performance", () => {
    it(`should return suggestions in < ${THRESHOLDS.AUTOCOMPLETE}ms`, async () => {
      const { time } = await measureTime(() =>
        getSearchSuggestions("lap", TEST_TENANT_ID, 10)
      );

      console.log(`✅ Autocomplete completed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.AUTOCOMPLETE);
    });

    it("should handle single character queries quickly", async () => {
      const { time } = await measureTime(() =>
        getSearchSuggestions("l", TEST_TENANT_ID, 5)
      );

      console.log(`✅ Single char autocomplete completed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.AUTOCOMPLETE);
    });
  });

  describe("Facets Performance", () => {
    it(`should calculate facets in < ${THRESHOLDS.FACETS}ms`, async () => {
      const { time } = await measureTime(() =>
        getSearchFacets(TEST_TENANT_ID, {
          query: "laptop",
        })
      );

      console.log(`✅ Facets calculation completed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.FACETS);
    });

    it("should handle facets with filters efficiently", async () => {
      const { time } = await measureTime(() =>
        getSearchFacets(TEST_TENANT_ID, {
          query: "laptop",
          minPrice: 100,
          maxPrice: 2000,
          inStock: true,
        })
      );

      console.log(`✅ Complex facets completed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(THRESHOLDS.FACETS);
    });
  });

  describe("Pagination Performance", () => {
    it("should handle different pages at similar speed", async () => {
      const times: number[] = [];

      for (let page = 1; page <= 3; page++) {
        const { time } = await measureTime(() =>
          searchProducts({
            query: "laptop",
            tenantId: TEST_TENANT_ID,
            page,
            limit: 24,
          })
        );
        times.push(time);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`✅ Pagination times: min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, avg=${avgTime.toFixed(2)}ms`);

      // Verificar que no hay degradación significativa entre páginas
      expect(maxTime - minTime).toBeLessThan(50); // Variación < 50ms
    });
  });

  describe("Load Testing", () => {
    it("should handle concurrent searches", async () => {
      const concurrentSearches = 10;
      const queries = [
        "laptop",
        "mouse",
        "keyboard",
        "monitor",
        "headphones",
        "camera",
        "phone",
        "tablet",
        "speaker",
        "router",
      ];

      const start = performance.now();

      const promises = queries.map((query, index) =>
        searchProducts({
          query,
          tenantId: TEST_TENANT_ID,
          page: 1,
          limit: 24,
        })
      );

      await Promise.all(promises);

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / concurrentSearches;

      console.log(`✅ ${concurrentSearches} concurrent searches completed in ${totalTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms per search)`);

      // Promedio debe ser razonable
      expect(avgTime).toBeLessThan(THRESHOLDS.COMPLEX_FILTERS);
    });
  });

  describe("Sorting Performance", () => {
    const sortOptions = [
      "relevance" as const,
      "price-asc" as const,
      "price-desc" as const,
      "newest" as const,
      "rating" as const,
    ];

    sortOptions.forEach((sortBy) => {
      it(`should sort by ${sortBy} efficiently`, async () => {
        const { time } = await measureTime(() =>
          searchProducts({
            query: "laptop",
            tenantId: TEST_TENANT_ID,
            sortBy,
            page: 1,
            limit: 24,
          })
        );

        console.log(`✅ Sort by ${sortBy} completed in ${time.toFixed(2)}ms`);
        expect(time).toBeLessThan(THRESHOLDS.SIMPLE_SEARCH);
      });
    });
  });
});

/**
 * Performance Report Generator
 * Ejecuta todos los benchmarks y genera un reporte
 */
export async function generatePerformanceReport() {
  console.log("\n📊 SEARCH PERFORMANCE REPORT\n");
  console.log("=" .repeat(60));

  const tests = [
    {
      name: "Simple Search",
      threshold: THRESHOLDS.SIMPLE_SEARCH,
      test: () => searchProducts({ query: "laptop", tenantId: TEST_TENANT_ID }),
    },
    {
      name: "Complex Filters",
      threshold: THRESHOLDS.COMPLEX_FILTERS,
      test: () =>
        searchProducts({
          query: "laptop",
          tenantId: TEST_TENANT_ID,
          minPrice: 100,
          maxPrice: 2000,
          inStock: true,
          sortBy: "price-asc",
        }),
    },
    {
      name: "Autocomplete",
      threshold: THRESHOLDS.AUTOCOMPLETE,
      test: () => getSearchSuggestions("lap", TEST_TENANT_ID),
    },
    {
      name: "Facets",
      threshold: THRESHOLDS.FACETS,
      test: () => getSearchFacets(TEST_TENANT_ID, { query: "laptop" }),
    },
  ];

  for (const test of tests) {
    const { time } = await measureTime(test.test);
    const status = time < test.threshold ? "✅ PASS" : "❌ FAIL";
    const percentage = ((time / test.threshold) * 100).toFixed(1);

    console.log(
      `${status} | ${test.name.padEnd(20)} | ${time.toFixed(2).padStart(8)}ms / ${test.threshold}ms (${percentage}%)`
    );
  }

  console.log("=" .repeat(60) + "\n");
}

// Ejecutar reporte si se llama directamente
if (require.main === module) {
  generatePerformanceReport()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error running performance report:", error);
      process.exit(1);
    });
}
