// Products Database Tests
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  isProductSkuAvailable,
} from "@/lib/db/products";
import { db } from "@/lib/db/client";

// Mock Prisma client
jest.mock("@/lib/db/client", () => ({
  db: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("Products Database Layer", () => {
  const tenantId = "tenant_123";

  const mockProduct = {
    id: "prod_123",
    tenantId,
    name: "Test Product",
    slug: "test-product",
    description: "A test product",
    sku: "SKU001",
    basePrice: 99.99,
    salePrice: null,
    stock: 100,
    reserved: 0,
    published: true,
    featured: false,
    categoryId: "cat_123",
    category: { id: "cat_123", name: "Test Category", slug: "test-category" },
    images: [{ id: "img_1", url: "/test.jpg", alt: "Test", order: 0 }],
    variants: [],
    _count: { reviews: 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProducts", () => {
    it("should return paginated products", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const result = await getProducts(tenantId, {});

      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        })
      );
    });

    it("should filter by category", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await getProducts(tenantId, { categoryId: "cat_123" });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            categoryId: "cat_123",
          }),
        })
      );
    });

    it("should filter by search term", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await getProducts(tenantId, { search: "test" });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            OR: expect.any(Array),
          }),
        })
      );
    });

    it("should filter by price range", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await getProducts(tenantId, { minPrice: "10", maxPrice: "100" });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            basePrice: { gte: 10, lte: 100 },
          }),
        })
      );
    });

    it("should filter by stock availability", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await getProducts(tenantId, { inStock: "true" });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            stock: { gt: 0 },
          }),
        })
      );
    });

    it("should sort products", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await getProducts(tenantId, { sort: "price-asc" });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { basePrice: "asc" },
        })
      );
    });

    it("should paginate correctly", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(100);

      const result = await getProducts(tenantId, { page: "2", limit: "20" });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe("getProductById", () => {
    it("should return product by ID with tenant check", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await getProductById(tenantId, "prod_123");

      expect(result).toEqual(mockProduct);
      expect(db.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prod_123", tenantId },
        })
      );
    });

    it("should return null for non-existent product", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getProductById(tenantId, "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getProductBySlug", () => {
    it("should return product by slug with tenant check", async () => {
      (db.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);

      const result = await getProductBySlug(tenantId, "test-product");

      expect(result).toEqual(mockProduct);
      expect(db.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: "test-product", tenantId },
        })
      );
    });
  });

  describe("createProduct", () => {
    const productData = {
      name: "New Product",
      slug: "new-product",
      description: "Description",
      sku: "SKU002",
      basePrice: 49.99,
      stock: 50,
      reserved: 0,
      category: { connect: { id: "cat_123" } },
    };

    it("should create product with tenant ID", async () => {
      (db.product.create as jest.Mock).mockResolvedValue({
        ...mockProduct,
        ...productData,
      });

      const result = await createProduct(tenantId, productData);

      expect(result.name).toBe("New Product");
      expect(db.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            name: "New Product",
          }),
        })
      );
    });
  });

  describe("updateProduct", () => {
    it("should update product with tenant check", async () => {
      (db.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        name: "Updated Product",
      });

      const result = await updateProduct(tenantId, "prod_123", {
        name: "Updated Product",
      });

      expect(result.name).toBe("Updated Product");
      expect(db.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prod_123", tenantId },
          data: { name: "Updated Product" },
        })
      );
    });
  });

  describe("deleteProduct", () => {
    it("should delete product with tenant check", async () => {
      (db.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      await deleteProduct(tenantId, "prod_123");

      expect(db.product.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prod_123", tenantId },
        })
      );
    });
  });

  describe("isProductSkuAvailable", () => {
    it("should return true for available SKU", async () => {
      (db.product.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await isProductSkuAvailable(tenantId, "NEW-SKU");

      expect(result).toBe(true);
    });

    it("should return false for taken SKU", async () => {
      (db.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);

      const result = await isProductSkuAvailable(tenantId, "SKU001");

      expect(result).toBe(false);
    });

    it("should check within tenant only", async () => {
      (db.product.findFirst as jest.Mock).mockResolvedValue(null);

      await isProductSkuAvailable(tenantId, "SKU001");

      expect(db.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, sku: "SKU001" },
        })
      );
    });
  });
});
