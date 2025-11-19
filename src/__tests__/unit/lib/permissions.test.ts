// Permissions RBAC Tests
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  requirePermission,
  ROLE_PERMISSIONS,
} from "@/lib/permissions/rbac";

describe("RBAC Permissions", () => {
  describe("hasPermission", () => {
    it("should return true for SUPER_ADMIN with any permission", () => {
      expect(hasPermission("SUPER_ADMIN", "products.read")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "users.delete")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "billing.manage")).toBe(true);
    });

    it("should return true for STORE_OWNER with allowed permissions", () => {
      expect(hasPermission("STORE_OWNER", "products.create")).toBe(true);
      expect(hasPermission("STORE_OWNER", "orders.read")).toBe(true);
    });

    it("should return false for CUSTOMER role", () => {
      expect(hasPermission("CUSTOMER", "products.read")).toBe(false);
      expect(hasPermission("CUSTOMER", "orders.read")).toBe(false);
    });

    it("should return false for STAFF with unauthorized permissions", () => {
      expect(hasPermission("STAFF", "products.delete")).toBe(false);
      expect(hasPermission("STAFF", "users.create")).toBe(false);
    });

    it("should return false for invalid permission", () => {
      expect(hasPermission("STAFF", "invalid.permission" as any)).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if user has at least one permission", () => {
      expect(
        hasAnyPermission("STAFF", ["products.read", "products.delete"]),
      ).toBe(true);
    });

    it("should return false if user has none of the permissions", () => {
      expect(
        hasAnyPermission("STAFF", ["products.delete", "users.create"]),
      ).toBe(false);
    });

    it("should return true for empty array", () => {
      expect(hasAnyPermission("STAFF", [])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if user has all permissions", () => {
      expect(
        hasAllPermissions("MANAGER", ["products.read", "orders.read"]),
      ).toBe(true);
    });

    it("should return false if user is missing any permission", () => {
      expect(
        hasAllPermissions("MANAGER", ["products.read", "users.delete"]),
      ).toBe(false);
    });

    it("should return true for empty array", () => {
      expect(hasAllPermissions("STAFF", [])).toBe(true);
    });
  });

  describe("getRolePermissions", () => {
    it("should return all permissions for a role", () => {
      const permissions = getRolePermissions("SUPER_ADMIN");
      expect(permissions).toContain("products.read");
      expect(permissions).toContain("users.delete");
      expect(permissions.length).toBeGreaterThan(10);
    });

    it("should return empty array for CUSTOMER", () => {
      const permissions = getRolePermissions("CUSTOMER");
      expect(permissions).toEqual([]);
    });
  });

  describe("requirePermission", () => {
    it("should not throw for valid permission", () => {
      expect(() => {
        requirePermission("SUPER_ADMIN", "products.delete");
      }).not.toThrow();
    });

    it("should throw for invalid permission", () => {
      expect(() => {
        requirePermission("STAFF", "products.delete");
      }).toThrow("Forbidden: Missing permission products.delete");
    });
  });

  describe("ROLE_PERMISSIONS", () => {
    it("should have SUPER_ADMIN with all permissions", () => {
      expect(ROLE_PERMISSIONS.SUPER_ADMIN.length).toBeGreaterThan(15);
    });

    it("should have hierarchy where higher roles have more permissions", () => {
      const adminCount = ROLE_PERMISSIONS.SUPER_ADMIN.length;
      const ownerCount = ROLE_PERMISSIONS.STORE_OWNER.length;
      const managerCount = ROLE_PERMISSIONS.MANAGER.length;
      const staffCount = ROLE_PERMISSIONS.STAFF.length;

      expect(adminCount).toBeGreaterThanOrEqual(ownerCount);
      expect(ownerCount).toBeGreaterThanOrEqual(managerCount);
      expect(managerCount).toBeGreaterThanOrEqual(staffCount);
    });
  });
});
