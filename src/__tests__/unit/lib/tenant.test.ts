// Tenant Management Tests
import {
  getCurrentUserTenantId,
  ensureTenantAccess,
  getTenantById,
  getTenantBySlug,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantStats,
  isSlugAvailable,
  withTenantFilter,
} from "@/lib/db/tenant";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";

// Mock dependencies
jest.mock("@/lib/db/client", () => ({
  db: {
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth/auth", () => ({
  auth: jest.fn(),
}));

describe("Tenant Management", () => {
  const mockTenant = {
    id: "tenant_123",
    name: "Test Store",
    slug: "test-store",
    logo: null,
    primaryColor: "#0A1128",
    accentColor: "#D4AF37",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentUserTenantId", () => {
    it("should return tenant ID from session", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      const tenantId = await getCurrentUserTenantId();
      expect(tenantId).toBe("tenant_123");
    });

    it("should throw error when no session", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(getCurrentUserTenantId()).rejects.toThrow(
        "Unauthorized - No session found"
      );
    });

    it("should throw error when no user in session", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      await expect(getCurrentUserTenantId()).rejects.toThrow(
        "Unauthorized - No session found"
      );
    });
  });

  describe("ensureTenantAccess", () => {
    it("should pass when user belongs to tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      await expect(ensureTenantAccess("tenant_123")).resolves.not.toThrow();
    });

    it("should throw when user has no tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: null },
      });

      await expect(ensureTenantAccess("tenant_123")).rejects.toThrow(
        "User has no tenant assigned"
      );
    });

    it("should throw when tenant mismatch", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_456" },
      });

      await expect(ensureTenantAccess("tenant_123")).rejects.toThrow(
        "Forbidden - User does not have access to this tenant"
      );
    });
  });

  describe("getTenantById", () => {
    it("should return tenant with counts", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      (db.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        _count: { users: 10, products: 50, orders: 100 },
      });

      const tenant = await getTenantById("tenant_123");

      expect(tenant).toBeDefined();
      expect(tenant!.name).toBe("Test Store");
      expect(tenant!._count.users).toBe(10);
      expect(db.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: "tenant_123" },
        include: {
          _count: {
            select: { users: true, products: true, orders: true },
          },
        },
      });
    });

    it("should throw when access denied", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_other" },
      });

      await expect(getTenantById("tenant_123")).rejects.toThrow("Forbidden");
    });
  });

  describe("getTenantBySlug", () => {
    it("should return tenant by slug without validation", async () => {
      (db.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const tenant = await getTenantBySlug("test-store");

      expect(tenant).toEqual(mockTenant);
      expect(db.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-store" },
      });
    });

    it("should return null for non-existent slug", async () => {
      (db.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      const tenant = await getTenantBySlug("non-existent");
      expect(tenant).toBeNull();
    });

    it("should validate access when requested", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      (db.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const tenant = await getTenantBySlug("test-store", true);
      expect(tenant).toEqual(mockTenant);
    });
  });

  describe("createTenant", () => {
    it("should create tenant when authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123" },
      });

      (db.tenant.create as jest.Mock).mockResolvedValue(mockTenant);

      const tenant = await createTenant({
        name: "Test Store",
        slug: "test-store",
      });

      expect(tenant).toEqual(mockTenant);
      expect(db.tenant.create).toHaveBeenCalledWith({
        data: {
          name: "Test Store",
          slug: "test-store",
          logo: undefined,
          primaryColor: "#0A1128",
          accentColor: "#D4AF37",
        },
      });
    });

    it("should throw when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(
        createTenant({ name: "Test", slug: "test" })
      ).rejects.toThrow("Unauthorized");
    });

    it("should skip auth when specified", async () => {
      (db.tenant.create as jest.Mock).mockResolvedValue(mockTenant);

      const tenant = await createTenant(
        { name: "Test Store", slug: "test-store" },
        true
      );

      expect(tenant).toEqual(mockTenant);
      expect(auth).not.toHaveBeenCalled();
    });

    it("should use custom colors", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123" },
      });

      (db.tenant.create as jest.Mock).mockResolvedValue(mockTenant);

      await createTenant({
        name: "Test",
        slug: "test",
        primaryColor: "#FF0000",
        accentColor: "#00FF00",
      });

      expect(db.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          primaryColor: "#FF0000",
          accentColor: "#00FF00",
        }),
      });
    });
  });

  describe("updateTenant", () => {
    it("should update tenant when authorized", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      (db.tenant.update as jest.Mock).mockResolvedValue({
        ...mockTenant,
        name: "Updated Store",
      });

      const tenant = await updateTenant("tenant_123", { name: "Updated Store" });

      expect(tenant!.name).toBe("Updated Store");
      expect(db.tenant.update).toHaveBeenCalledWith({
        where: { id: "tenant_123" },
        data: { name: "Updated Store" },
      });
    });

    it("should throw when access denied", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_other" },
      });

      await expect(
        updateTenant("tenant_123", { name: "Updated" })
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("deleteTenant", () => {
    it("should delete tenant when authorized", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      (db.tenant.delete as jest.Mock).mockResolvedValue(mockTenant);

      await deleteTenant("tenant_123");

      expect(db.tenant.delete).toHaveBeenCalledWith({
        where: { id: "tenant_123" },
      });
    });
  });

  describe("getTenantStats", () => {
    it("should return tenant statistics", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      (db.product.count as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45);
      (db.order.count as jest.Mock).mockResolvedValue(100);
      (db.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { total: 50000 },
      });
      (db.user.count as jest.Mock).mockResolvedValue(25);

      const stats = await getTenantStats("tenant_123");

      expect(stats).toEqual({
        totalProducts: 50,
        publishedProducts: 45,
        totalOrders: 100,
        totalRevenue: 50000,
        totalCustomers: 25,
      });
    });

    it("should handle null revenue", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123" },
      });

      (db.product.count as jest.Mock).mockResolvedValue(0);
      (db.order.count as jest.Mock).mockResolvedValue(0);
      (db.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { total: null },
      });
      (db.user.count as jest.Mock).mockResolvedValue(0);

      const stats = await getTenantStats("tenant_123");
      expect(stats.totalRevenue).toBe(0);
    });
  });

  describe("isSlugAvailable", () => {
    it("should return true for available slug", async () => {
      (db.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      const available = await isSlugAvailable("new-store");
      expect(available).toBe(true);
    });

    it("should return false for taken slug", async () => {
      (db.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const available = await isSlugAvailable("test-store");
      expect(available).toBe(false);
    });
  });

  describe("withTenantFilter", () => {
    it("should add tenant ID to filter", () => {
      const filter = withTenantFilter("tenant_123");
      expect(filter).toEqual({ tenantId: "tenant_123" });
    });

    it("should merge with additional filters", () => {
      const filter = withTenantFilter("tenant_123", {
        published: true,
        stock: { gt: 0 },
      });

      expect(filter).toEqual({
        tenantId: "tenant_123",
        published: true,
        stock: { gt: 0 },
      });
    });
  });
});
