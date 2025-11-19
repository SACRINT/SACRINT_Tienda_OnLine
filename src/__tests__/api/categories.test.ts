// Categories API Tests
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/categories/route";
import { auth } from "@/lib/auth/auth";
import {
  getCategoriesByTenant,
  getCategoryTree,
  createCategory,
  isCategorySlugAvailable,
} from "@/lib/db/categories";

// Mock dependencies
jest.mock("@/lib/auth/auth");
jest.mock("@/lib/db/categories");

describe("Categories API", () => {
  const mockSession = {
    user: {
      id: "user_123",
      tenantId: "tenant_123",
      role: "STORE_OWNER",
    },
  };

  const mockCategories = [
    {
      id: "cat_1",
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices",
      image: "/electronics.jpg",
      parentId: null,
      _count: { products: 10 },
    },
    {
      id: "cat_2",
      name: "Smartphones",
      slug: "smartphones",
      description: "Mobile phones",
      image: "/phones.jpg",
      parentId: "cat_1",
      _count: { products: 5 },
    },
  ];

  const mockCategoryTree = [
    {
      id: "cat_1",
      name: "Electronics",
      slug: "electronics",
      children: [
        {
          id: "cat_2",
          name: "Smartphones",
          slug: "smartphones",
          children: [],
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/categories", () => {
    it("should return flat list by default", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoriesByTenant as jest.Mock).mockResolvedValue(mockCategories);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toHaveLength(2);
      expect(data.format).toBe("flat");
      expect(data.total).toBe(2);
    });

    it("should return tree structure when requested", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoryTree as jest.Mock).mockResolvedValue(mockCategoryTree);

      const request = new NextRequest(
        "http://localhost:3000/api/categories?format=tree"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.format).toBe("tree");
      expect(data.categories[0].children).toBeDefined();
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return 404 when user has no tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: null },
      });

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it("should filter by parent ID", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoriesByTenant as jest.Mock).mockResolvedValue([mockCategories[1]]);

      const request = new NextRequest(
        "http://localhost:3000/api/categories?parentId=cat_1"
      );
      await GET(request);

      expect(getCategoriesByTenant).toHaveBeenCalledWith(
        "tenant_123",
        expect.objectContaining({ parentId: "cat_1" })
      );
    });

    it("should filter root categories", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoriesByTenant as jest.Mock).mockResolvedValue([mockCategories[0]]);

      const request = new NextRequest(
        "http://localhost:3000/api/categories?parentId=null"
      );
      await GET(request);

      expect(getCategoriesByTenant).toHaveBeenCalledWith(
        "tenant_123",
        expect.objectContaining({ parentId: null })
      );
    });

    it("should include subcategories when requested", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoriesByTenant as jest.Mock).mockResolvedValue(mockCategories);

      const request = new NextRequest(
        "http://localhost:3000/api/categories?includeSubcategories=true"
      );
      await GET(request);

      expect(getCategoriesByTenant).toHaveBeenCalledWith(
        "tenant_123",
        expect.objectContaining({ includeSubcategories: true })
      );
    });

    it("should handle database errors", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCategoriesByTenant as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/categories", () => {
    const validCategoryData = {
      name: "New Category",
      slug: "new-category",
      description: "A new category",
    };

    const mockCreatedCategory = {
      id: "cat_new",
      name: "New Category",
      slug: "new-category",
      description: "A new category",
      image: null,
      parentId: null,
      createdAt: new Date(),
    };

    it("should create category for store owner", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (isCategorySlugAvailable as jest.Mock).mockResolvedValue(true);
      (createCategory as jest.Mock).mockResolvedValue(mockCreatedCategory);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify(validCategoryData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.category.name).toBe("New Category");
      expect(data.message).toBe("Category created successfully");
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify(validCategoryData),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 403 for customer role", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "CUSTOMER" },
      });

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify(validCategoryData),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid data", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: "" }), // Invalid
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 409 for duplicate slug", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (isCategorySlugAvailable as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify(validCategoryData),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });

    it("should create subcategory with parent", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (isCategorySlugAvailable as jest.Mock).mockResolvedValue(true);
      (createCategory as jest.Mock).mockResolvedValue({
        ...mockCreatedCategory,
        parentId: "cat_1",
      });

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          ...validCategoryData,
          parentId: "cat_1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.category.parentId).toBe("cat_1");
    });

    it("should return 404 for non-existent parent", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (isCategorySlugAvailable as jest.Mock).mockResolvedValue(true);
      (createCategory as jest.Mock).mockRejectedValue(
        new Error("Parent category not found")
      );

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          ...validCategoryData,
          parentId: "cat_nonexistent",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it("should allow super admin to create categories", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "SUPER_ADMIN" },
      });
      (isCategorySlugAvailable as jest.Mock).mockResolvedValue(true);
      (createCategory as jest.Mock).mockResolvedValue(mockCreatedCategory);

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify(validCategoryData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("should return 404 when user has no tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: null, role: "STORE_OWNER" },
      });

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify(validCategoryData),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });
  });
});
