// Categories Database Tests
import {
  getCategoriesByTenant,
  getCategoryById,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  isCategorySlugAvailable,
} from "@/lib/db/categories";
import { db } from "@/lib/db/client";

// Mock Prisma client
jest.mock("@/lib/db/client", () => ({
  db: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Categories Database Layer", () => {
  const tenantId = "tenant_123";

  const mockCategory = {
    id: "cat_123",
    tenantId,
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices",
    image: "/electronics.jpg",
    parentId: null,
    _count: { products: 10 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubcategory = {
    id: "cat_456",
    tenantId,
    name: "Smartphones",
    slug: "smartphones",
    description: "Mobile phones",
    image: "/phones.jpg",
    parentId: "cat_123",
    _count: { products: 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCategoriesByTenant", () => {
    it("should return all categories for tenant", async () => {
      (db.category.findMany as jest.Mock).mockResolvedValue([
        mockCategory,
        mockSubcategory,
      ]);

      const result = await getCategoriesByTenant(tenantId, {});

      expect(result).toHaveLength(2);
      expect(db.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        })
      );
    });

    it("should filter by parent ID", async () => {
      (db.category.findMany as jest.Mock).mockResolvedValue([mockSubcategory]);

      await getCategoriesByTenant(tenantId, { parentId: "cat_123" });

      expect(db.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            parentId: "cat_123",
          }),
        })
      );
    });

    it("should filter root categories", async () => {
      (db.category.findMany as jest.Mock).mockResolvedValue([mockCategory]);

      await getCategoriesByTenant(tenantId, { parentId: null });

      expect(db.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            parentId: null,
          }),
        })
      );
    });

    it("should include product counts", async () => {
      (db.category.findMany as jest.Mock).mockResolvedValue([mockCategory]);

      await getCategoriesByTenant(tenantId, {});

      expect(db.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("getCategoryById", () => {
    it("should return category by ID with tenant check", async () => {
      (db.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await getCategoryById(tenantId, "cat_123");

      expect(result).toEqual(mockCategory);
      expect(db.category.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cat_123", tenantId },
        })
      );
    });

    it("should return null for non-existent category", async () => {
      (db.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getCategoryById(tenantId, "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getCategoryTree", () => {
    it("should return hierarchical tree structure", async () => {
      const categoriesFlat = [
        { ...mockCategory, children: [] },
        { ...mockSubcategory, children: [] },
      ];
      (db.category.findMany as jest.Mock).mockResolvedValue(categoriesFlat);

      const result = await getCategoryTree(tenantId);

      expect(result).toBeDefined();
      // Root categories should have children array
    });

    it("should only return root categories at top level", async () => {
      (db.category.findMany as jest.Mock).mockResolvedValue([
        { ...mockCategory, children: [mockSubcategory] },
      ]);

      const result = await getCategoryTree(tenantId);

      expect(result[0].parentId).toBeNull();
    });
  });

  describe("createCategory", () => {
    const categoryData = {
      tenantId,
      name: "New Category",
      slug: "new-category",
      description: "A new category",
      image: null,
      parentId: null,
    };

    it("should create category with tenant ID", async () => {
      (db.category.create as jest.Mock).mockResolvedValue({
        id: "cat_new",
        ...categoryData,
        createdAt: new Date(),
      });

      const result = await createCategory(categoryData);

      expect(result.name).toBe("New Category");
      expect(db.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            name: "New Category",
            slug: "new-category",
          }),
        })
      );
    });

    it("should create subcategory with parent", async () => {
      const subcategoryData = {
        ...categoryData,
        name: "Subcategory",
        slug: "subcategory",
        parentId: "cat_123",
      };

      (db.category.create as jest.Mock).mockResolvedValue({
        id: "cat_sub",
        ...subcategoryData,
        createdAt: new Date(),
      });

      const result = await createCategory(subcategoryData);

      expect(result.parentId).toBe("cat_123");
    });

    it("should verify parent exists", async () => {
      (db.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        createCategory({
          ...categoryData,
          parentId: "nonexistent",
        })
      ).rejects.toThrow("Parent category not found");
    });
  });

  describe("updateCategory", () => {
    it("should update category with tenant check", async () => {
      (db.category.update as jest.Mock).mockResolvedValue({
        ...mockCategory,
        name: "Updated Category",
      });

      const result = await updateCategory(tenantId, "cat_123", {
        name: "Updated Category",
      });

      expect(result.name).toBe("Updated Category");
      expect(db.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cat_123", tenantId },
          data: { name: "Updated Category" },
        })
      );
    });
  });

  describe("deleteCategory", () => {
    it("should delete category with tenant check", async () => {
      (db.category.delete as jest.Mock).mockResolvedValue(mockCategory);

      await deleteCategory(tenantId, "cat_123");

      expect(db.category.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cat_123", tenantId },
        })
      );
    });

    it("should handle cascade deletion", async () => {
      // When a category is deleted, subcategories should be handled
      (db.category.findMany as jest.Mock).mockResolvedValue([mockSubcategory]);
      (db.category.delete as jest.Mock).mockRejectedValue(
        new Error("Cannot delete category with subcategories")
      );

      await expect(deleteCategory(tenantId, "cat_123")).rejects.toThrow();
    });
  });

  describe("isCategorySlugAvailable", () => {
    it("should return true for available slug", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await isCategorySlugAvailable(tenantId, "new-slug");

      expect(result).toBe(true);
    });

    it("should return false for taken slug", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);

      const result = await isCategorySlugAvailable(tenantId, "electronics");

      expect(result).toBe(false);
    });

    it("should check within tenant only", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue(null);

      await isCategorySlugAvailable(tenantId, "some-slug");

      expect(db.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, slug: "some-slug" },
        })
      );
    });
  });
});
