// Products API Tests
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/products/route";
import { auth } from "@/lib/auth/auth";
import {
  getProducts,
  createProduct,
  isProductSkuAvailable,
} from "@/lib/db/products";
import { getCategoryById } from "@/lib/db/categories";

// Mock dependencies
jest.mock("@/lib/auth/auth");
jest.mock("@/lib/db/products");
jest.mock("@/lib/db/categories");

describe("Products API", () => {
  const mockSession = {
    user: {
      id: "user_123",
      tenantId: "tenant_123",
      role: "STORE_OWNER",
    },
  };

  const mockProduct = {
    id: "prod_123",
    name: "Test Product",
    slug: "test-product",
    description: "A test product",
    shortDescription: "Test",
    sku: "SKU001",
    basePrice: 99.99,
    salePrice: null,
    stock: 100,
    published: true,
    featured: false,
    tags: ["test"],
    categoryId: "cat_123",
    category: { id: "cat_123", name: "Test Category" },
    images: [{ id: "img_1", url: "/test.jpg", alt: "Test", order: 0 }],
    variants: [],
    _count: { reviews: 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/products", () => {
    it("should return products for authenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getProducts as jest.Mock).mockResolvedValue({
        products: [mockProduct],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const request = new NextRequest("http://localhost:3000/api/products");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toBe("Test Product");
      expect(data.pagination.total).toBe(1);
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/products");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return 404 when user has no tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: null },
      });

      const request = new NextRequest("http://localhost:3000/api/products");
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it("should filter by category", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getProducts as jest.Mock).mockResolvedValue({
        products: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products?categoryId=cat_123",
      );
      await GET(request);

      expect(getProducts).toHaveBeenCalledWith(
        "tenant_123",
        expect.objectContaining({ categoryId: "cat_123" }),
      );
    });

    it("should filter by search term", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getProducts as jest.Mock).mockResolvedValue({
        products: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products?search=test",
      );
      await GET(request);

      expect(getProducts).toHaveBeenCalledWith(
        "tenant_123",
        expect.objectContaining({ search: "test" }),
      );
    });

    it("should filter by price range", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getProducts as jest.Mock).mockResolvedValue({
        products: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products?minPrice=10&maxPrice=100",
      );
      await GET(request);

      expect(getProducts).toHaveBeenCalledWith(
        "tenant_123",
        expect.objectContaining({ minPrice: "10", maxPrice: "100" }),
      );
    });

    it("should paginate results", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getProducts as jest.Mock).mockResolvedValue({
        products: [],
        pagination: { page: 2, limit: 10, total: 100, totalPages: 10 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products?page=2&limit=10",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
    });

    it("should handle database errors", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getProducts as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/products");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/products", () => {
    const validProductData = {
      name: "New Product",
      slug: "new-product",
      description: "A new product",
      sku: "SKU002",
      basePrice: 49.99,
      stock: 50,
      categoryId: "cat_123",
      published: true,
    };

    it("should create product for store owner", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoryById as jest.Mock).mockResolvedValue({ id: "cat_123" });
      (isProductSkuAvailable as jest.Mock).mockResolvedValue(true);
      (createProduct as jest.Mock).mockResolvedValue({
        ...mockProduct,
        ...validProductData,
      });

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.name).toBe("New Product");
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 403 for customer role", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "CUSTOMER" },
      });

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid data", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({ name: "" }), // Invalid: empty name
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent category", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoryById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it("should return 409 for duplicate SKU", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoryById as jest.Mock).mockResolvedValue({ id: "cat_123" });
      (isProductSkuAvailable as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });

    it("should allow super admin to create products", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "SUPER_ADMIN" },
      });
      (getCategoryById as jest.Mock).mockResolvedValue({ id: "cat_123" });
      (isProductSkuAvailable as jest.Mock).mockResolvedValue(true);
      (createProduct as jest.Mock).mockResolvedValue({
        ...mockProduct,
        ...validProductData,
      });

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });
});
