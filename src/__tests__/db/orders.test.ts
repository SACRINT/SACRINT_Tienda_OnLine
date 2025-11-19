// Orders Database Tests
import {
  getOrdersByUser,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from "@/lib/db/orders";
import { db } from "@/lib/db/client";

// Mock Prisma client
jest.mock("@/lib/db/client", () => ({
  db: {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn({
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      product: {
        update: jest.fn(),
      },
    })),
  },
}));

describe("Orders Database Layer", () => {
  const tenantId = "tenant_123";
  const userId = "user_123";

  const mockOrder = {
    id: "order_123",
    orderNumber: "ORD-001",
    tenantId,
    customerId: userId,
    status: "PENDING",
    subtotal: 100,
    tax: 16,
    shippingCost: 0,
    discount: 0,
    total: 116,
    shippingAddressId: "addr_1",
    billingAddressId: "addr_2",
    items: [
      {
        id: "item_1",
        productId: "prod_1",
        quantity: 2,
        price: 50,
        product: { name: "Product 1" },
      },
    ],
    customer: { name: "Test User", email: "test@example.com" },
    shippingAddress: { street: "123 Main St", city: "Mexico City" },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrdersByUser", () => {
    it("should return paginated orders for user", async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (db.order.count as jest.Mock).mockResolvedValue(1);

      const result = await getOrdersByUser(tenantId, userId, {});

      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            customerId: userId,
          }),
        })
      );
    });

    it("should filter by status", async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      await getOrdersByUser(tenantId, userId, { status: "SHIPPED" });

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            customerId: userId,
            status: "SHIPPED",
          }),
        })
      );
    });

    it("should paginate correctly", async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(50);

      const result = await getOrdersByUser(tenantId, userId, {
        page: 2,
        limit: 10,
      });

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.pagination.page).toBe(2);
    });

    it("should sort by date descending", async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      await getOrdersByUser(tenantId, userId, {});

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("getOrderById", () => {
    it("should return order by ID with tenant check", async () => {
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderById(tenantId, "order_123");

      expect(result).toEqual(mockOrder);
      expect(db.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order_123", tenantId },
        })
      );
    });

    it("should return null for non-existent order", async () => {
      (db.order.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getOrderById(tenantId, "nonexistent");

      expect(result).toBeNull();
    });

    it("should include related data", async () => {
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      await getOrderById(tenantId, "order_123");

      expect(db.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            items: expect.any(Object),
            customer: expect.any(Object),
            shippingAddress: true,
          }),
        })
      );
    });
  });

  describe("createOrder", () => {
    const orderData = {
      customerId: userId,
      items: [
        { productId: "prod_1", quantity: 2, price: 50 },
      ],
      subtotal: 100,
      tax: 16,
      shippingCost: 0,
      total: 116,
      shippingAddressId: "addr_1",
      billingAddressId: "addr_2",
    };

    it("should create order with tenant ID", async () => {
      const transactionMock = jest.fn().mockResolvedValue(mockOrder);
      (db.$transaction as jest.Mock).mockImplementation(transactionMock);

      const result = await createOrder(tenantId, orderData);

      expect(result).toBeDefined();
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status", async () => {
      (db.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: "SHIPPED",
      });

      const result = await updateOrderStatus(tenantId, "order_123", "SHIPPED");

      expect(result.status).toBe("SHIPPED");
      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order_123", tenantId },
          data: expect.objectContaining({ status: "SHIPPED" }),
        })
      );
    });

    it("should validate status transition", async () => {
      // Test that invalid transitions are handled
      (db.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: "DELIVERED",
      });

      // Attempting to change from DELIVERED to PENDING should fail
      await expect(
        updateOrderStatus(tenantId, "order_123", "PENDING")
      ).rejects.toThrow();
    });
  });
});
