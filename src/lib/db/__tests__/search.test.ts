// Search DAL Tests
// Unit tests for advanced search functions

import {
  searchProducts,
  getSearchSuggestions,
  getSearchFacets,
  trackSearchQuery,
} from "../search";
import { db } from "../client";
import { ensureTenantAccess } from "../tenant";

// Mock dependencies
jest.mock("../client", () => ({
  db: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    review: {
      aggregate: jest.fn(),
    },
  },
}));

jest.mock("../tenant", () => ({
  ensureTenantAccess: jest.fn(),
}));

describe("Search DAL", () => {
  const mockTenantId = "tenant-123";
  const mockProduct = {
    id: "product-1",
    name: "Test Product",
    slug: "test-product",
    description: "A great test product",
    sku: "TEST-001",
    basePrice: 99.99,
    stock: 10,
    published: true,
    featured: false,
    tags: ["electronics", "gadgets"],
    tenantId: mockTenantId,
    category: {
      id: "cat-1",
      name: "Electronics",
      slug: "electronics",
    },
    images: [
      {
        id: "img-1",
        url: "https://example.com/img.jpg",
        alt: "Product image",
        order: 0,
      },
    ],
    _count: {
      reviews: 5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("searchProducts", () => {
    it("should search products with query", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      const result = await searchProducts(mockTenantId, {
        query: "test",
        page: 1,
        limit: 20,
      });

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            published: true,
            OR: expect.arrayContaining([
              { name: { contains: "test", mode: "insensitive" } },
              { description: { contains: "test", mode: "insensitive" } },
            ]),
          }),
        }),
      );
      expect(result.products).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });
    });

    it("should filter by category", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      await searchProducts(mockTenantId, {
        categoryId: "cat-1",
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: "cat-1",
          }),
        }),
      );
    });

    it("should filter by price range", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      await searchProducts(mockTenantId, {
        minPrice: 50,
        maxPrice: 150,
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            basePrice: expect.objectContaining({
              gte: 50,
              lte: 150,
            }),
          }),
        }),
      );
    });

    it("should filter by stock availability", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      await searchProducts(mockTenantId, {
        inStock: true,
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: { gt: 0 },
          }),
        }),
      );
    });

    it("should filter by tags", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      await searchProducts(mockTenantId, {
        tags: ["electronics", "gadgets"],
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ["electronics", "gadgets"] },
          }),
        }),
      );
    });

    it("should sort by relevance for searches with query", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      await searchProducts(mockTenantId, {
        query: "test",
        sort: "relevance",
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ featured: "desc" }, { name: "asc" }],
        }),
      );
    });

    it("should sort by price ascending", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      await searchProducts(mockTenantId, {
        sort: "price-asc",
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { basePrice: "asc" },
        }),
      );
    });

    it("should paginate results", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(100);
      (db.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      const result = await searchProducts(mockTenantId, {
        page: 2,
        limit: 10,
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * limit 10
          take: 10,
        }),
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        pages: 10,
      });
    });
  });

  describe("getSearchSuggestions", () => {
    it("should return suggestions for query", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await getSearchSuggestions(mockTenantId, "test", 10);

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            published: true,
            OR: expect.arrayContaining([
              { name: { contains: "test", mode: "insensitive" } },
              { sku: { contains: "test", mode: "insensitive" } },
              { tags: { hasSome: ["test"] } },
            ]),
          }),
          take: 10,
        }),
      );
      expect(result).toEqual([mockProduct]);
    });

    it("should return empty array for empty query", async () => {
      const result = await getSearchSuggestions(mockTenantId, "", 10);
      expect(result).toEqual([]);
    });

    it("should limit results", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

      await getSearchSuggestions(mockTenantId, "test", 5);

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe("getSearchFacets", () => {
    it("should return category facets", async () => {
      (db.product.groupBy as jest.Mock).mockResolvedValue([
        { categoryId: "cat-1", _count: { categoryId: 5 } },
        { categoryId: "cat-2", _count: { categoryId: 3 } },
      ]);
      (db.category.findMany as jest.Mock).mockResolvedValue([
        { id: "cat-1", name: "Electronics", slug: "electronics" },
        { id: "cat-2", name: "Clothing", slug: "clothing" },
      ]);
      (db.product.aggregate as jest.Mock).mockResolvedValue({
        _min: { basePrice: 10 },
        _max: { basePrice: 200 },
      });
      (db.product.count as jest.Mock).mockResolvedValue(8);
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { tags: ["electronics", "new"] },
        { tags: ["electronics"] },
      ]);

      const result = await getSearchFacets(mockTenantId, {
        query: "test",
      });

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId);
      expect(result.categories).toEqual([
        { id: "cat-1", name: "Electronics", slug: "electronics", count: 5 },
        { id: "cat-2", name: "Clothing", slug: "clothing", count: 3 },
      ]);
      expect(result.priceRange).toEqual({
        min: 10,
        max: 200,
      });
      expect(result.availability).toBeDefined();
      expect(result.tags).toBeDefined();
    });
  });

  describe("trackSearchQuery", () => {
    it("should log search query", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await trackSearchQuery(mockTenantId, "user-123", "test query", 5);

      expect(ensureTenantAccess).toHaveBeenCalledWith(mockTenantId);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'User user-123 searched for "test query", found 5 results',
        ),
      );

      consoleSpy.mockRestore();
    });
  });
});
