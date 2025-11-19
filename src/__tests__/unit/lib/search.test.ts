// Search Engine Tests
import { search, searchCount } from "@/lib/search/engine";
import {
  SEARCH_WEIGHTS,
  MIN_SEARCH_LENGTH,
  DEFAULT_RESULTS_PER_PAGE,
} from "@/lib/search/config";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    product: {
      findMany: jest.fn(),
    },
  },
}));

import { db } from "@/lib/db";

describe("Search Engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProducts = [
    {
      id: "1",
      tenantId: "tenant1",
      name: "Red Running Shoes",
      slug: "red-running-shoes",
      description: "Comfortable running shoes in red",
      tags: ["sports", "running"],
      categoryId: "cat1",
      basePrice: 99.99,
      salePrice: null,
      stock: 50,
      avgRating: 4.5,
      reviewCount: 100,
      createdAt: new Date(),
      isActive: true,
      images: [{ url: "/img/shoes.jpg" }],
      category: { name: "Shoes", slug: "shoes" },
    },
    {
      id: "2",
      tenantId: "tenant1",
      name: "Blue Sneakers",
      slug: "blue-sneakers",
      description: "Casual blue sneakers",
      tags: ["casual"],
      categoryId: "cat1",
      basePrice: 79.99,
      salePrice: 59.99,
      stock: 30,
      avgRating: 4.0,
      reviewCount: 50,
      createdAt: new Date(),
      isActive: true,
      images: [{ url: "/img/sneakers.jpg" }],
      category: { name: "Shoes", slug: "shoes" },
    },
  ];

  describe("search", () => {
    it("should return products matching query", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "shoes",
        tenantId: "tenant1",
      });

      expect(result.products.length).toBeGreaterThan(0);
      expect(result.query).toBe("shoes");
      expect(result.total).toBeGreaterThan(0);
    });

    it("should filter by category", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "shoes",
        tenantId: "tenant1",
        filters: { categoryId: "cat1" },
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: "cat1",
          }),
        })
      );
    });

    it("should filter by price range", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      await search({
        query: "shoes",
        tenantId: "tenant1",
        filters: { priceMin: 50, priceMax: 100 },
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            basePrice: { gte: 50, lte: 100 },
          }),
        })
      );
    });

    it("should filter in-stock products", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      await search({
        query: "shoes",
        tenantId: "tenant1",
        filters: { inStock: true },
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: { gt: 0 },
          }),
        })
      );
    });

    it("should paginate results", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "shoes",
        tenantId: "tenant1",
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
    });

    it("should return facets when requested", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "shoes",
        tenantId: "tenant1",
        facets: ["categories", "tags"],
      });

      expect(result.facets).toBeDefined();
      expect(result.facets?.categories).toBeDefined();
    });

    it("should sort by relevance by default", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "running",
        tenantId: "tenant1",
      });

      // First product should have higher score (contains "running" in name)
      if (result.products.length >= 2) {
        expect(result.products[0].score).toBeGreaterThanOrEqual(
          result.products[1].score
        );
      }
    });

    it("should sort by price ascending", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "shoes",
        tenantId: "tenant1",
        sort: { field: "price", direction: "asc" },
      });

      if (result.products.length >= 2) {
        const price1 = result.products[0].salePrice || result.products[0].price;
        const price2 = result.products[1].salePrice || result.products[1].price;
        expect(price1).toBeLessThanOrEqual(price2);
      }
    });

    it("should include highlights", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "running",
        tenantId: "tenant1",
      });

      const runningProduct = result.products.find((p) =>
        p.name.toLowerCase().includes("running")
      );
      if (runningProduct) {
        expect(runningProduct.highlights?.name).toContain("<mark>");
      }
    });

    it("should track search time", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await search({
        query: "shoes",
        tenantId: "tenant1",
      });

      expect(result.took).toBeGreaterThanOrEqual(0);
    });
  });

  describe("searchCount", () => {
    it("should return total count", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const count = await searchCount("shoes", "tenant1");
      expect(count).toBe(2);
    });
  });

  describe("config", () => {
    it("should have search weights defined", () => {
      expect(SEARCH_WEIGHTS.name).toBeGreaterThan(0);
      expect(SEARCH_WEIGHTS.description).toBeGreaterThan(0);
      expect(SEARCH_WEIGHTS.tags).toBeGreaterThan(0);
    });

    it("should have name weight higher than description", () => {
      expect(SEARCH_WEIGHTS.name).toBeGreaterThan(SEARCH_WEIGHTS.description);
    });

    it("should have reasonable defaults", () => {
      expect(MIN_SEARCH_LENGTH).toBe(2);
      expect(DEFAULT_RESULTS_PER_PAGE).toBe(20);
    });
  });
});
