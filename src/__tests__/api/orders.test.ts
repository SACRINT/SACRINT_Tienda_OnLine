// Orders API Tests
import { NextRequest } from "next/server";
import { GET } from "@/app/api/orders/route";
import { auth } from "@/lib/auth/auth";

// Mock dependencies
jest.mock("@/lib/auth/auth");
jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { db } from "@/lib/db";

describe("Orders API", () => {
  const mockSession = {
    user: {
      id: "user_123",
      tenantId: "tenant_123",
      role: "CUSTOMER",
    },
  };

  const mockOrders = [
    {
      id: "order_1",
      orderNumber: "ORD-001",
      status: "PROCESSING",
      total: 150.99,
      subtotal: 130,
      tax: 20.99,
      shippingCost: 0,
      customerId: "user_123",
      customer: { name: "Test User", email: "test@example.com" },
      items: [
        {
          id: "item_1",
          productId: "prod_1",
          quantity: 2,
          price: 65,
          product: { name: "Product 1", images: [{ url: "/img.jpg" }] },
        },
      ],
      shippingAddress: {
        street: "123 Main St",
        city: "Mexico City",
        state: "CDMX",
        postalCode: "12345",
        country: "MX",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/orders", () => {
    it("should return orders for authenticated customer", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (db.order.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.orders).toBeDefined();
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return 404 when user has no tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: null },
      });

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it("should filter by status", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost:3000/api/orders?status=SHIPPED"
      );
      await GET(request);

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "SHIPPED",
          }),
        })
      );
    });

    it("should paginate results", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(100);

      const request = new NextRequest(
        "http://localhost:3000/api/orders?page=2&limit=10"
      );
      await GET(request);

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it("should handle database errors", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.order.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/orders");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
