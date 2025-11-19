// Users Database Tests
import {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  getUserWithTenant,
} from "@/lib/db/users";
import { db } from "@/lib/db/client";

// Mock Prisma client
jest.mock("@/lib/db/client", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("Users Database Layer", () => {
  const tenantId = "tenant_123";

  const mockUser = {
    id: "user_123",
    tenantId,
    email: "test@example.com",
    name: "Test User",
    role: "CUSTOMER",
    emailVerified: new Date(),
    image: "/avatar.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserById", () => {
    it("should return user by ID", async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserById("user_123");

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user_123" },
        })
      );
    });

    it("should return null for non-existent user", async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user by email", async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(db.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "test@example.com" },
        })
      );
    });

    it("should be case-insensitive", async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await getUserByEmail("TEST@EXAMPLE.COM");

      expect(db.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: expect.stringMatching(/test@example.com/i) },
        })
      );
    });

    it("should return null for non-existent email", async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    const userData = {
      email: "new@example.com",
      name: "New User",
      tenantId,
      role: "CUSTOMER" as const,
    };

    it("should create user with tenant ID", async () => {
      (db.user.create as jest.Mock).mockResolvedValue({
        id: "user_new",
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createUser(userData);

      expect(result.email).toBe("new@example.com");
      expect(db.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "new@example.com",
            tenantId,
          }),
        })
      );
    });

    it("should throw error for duplicate email", async () => {
      (db.user.create as jest.Mock).mockRejectedValue(
        new Error("Unique constraint failed on the fields: (`email`)")
      );

      await expect(createUser(userData)).rejects.toThrow();
    });
  });

  describe("updateUser", () => {
    it("should update user data", async () => {
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: "Updated Name",
      });

      const result = await updateUser("user_123", { name: "Updated Name" });

      expect(result.name).toBe("Updated Name");
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user_123" },
          data: { name: "Updated Name" },
        })
      );
    });

    it("should update user role", async () => {
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: "STORE_OWNER",
      });

      const result = await updateUser("user_123", { role: "STORE_OWNER" });

      expect(result.role).toBe("STORE_OWNER");
    });
  });

  describe("getUserWithTenant", () => {
    it("should return user with tenant data", async () => {
      const userWithTenant = {
        ...mockUser,
        tenant: {
          id: tenantId,
          name: "Test Store",
          slug: "test-store",
        },
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(userWithTenant);

      const result = await getUserWithTenant("user_123");

      expect(result).toEqual(userWithTenant);
      expect(result!.tenant).toBeDefined();
      expect(db.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user_123" },
          include: expect.objectContaining({
            tenant: true,
          }),
        })
      );
    });

    it("should return user without tenant for global users", async () => {
      const userWithoutTenant = {
        ...mockUser,
        tenantId: null,
        tenant: null,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(userWithoutTenant);

      const result = await getUserWithTenant("user_123");

      expect(result!.tenant).toBeNull();
    });
  });
});
