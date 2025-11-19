// Coupons API Tests
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/coupons/route";
import { auth } from "@/lib/auth/auth";

// Mock dependencies
jest.mock("@/lib/auth/auth");
jest.mock("@/lib/db", () => ({
  db: {
    coupon: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { db } from "@/lib/db";

describe("Coupons API", () => {
  const mockSession = {
    user: {
      id: "user_123",
      tenantId: "tenant_123",
      role: "STORE_OWNER",
    },
  };

  const mockCoupons = [
    {
      id: "coupon_1",
      code: "SAVE20",
      type: "PERCENTAGE",
      value: 20,
      minPurchase: 50,
      maxUses: 100,
      timesUsed: 25,
      isActive: true,
      expiresAt: new Date("2025-12-31"),
      createdAt: new Date(),
    },
    {
      id: "coupon_2",
      code: "FLAT10",
      type: "FIXED_AMOUNT",
      value: 10,
      minPurchase: null,
      maxUses: null,
      timesUsed: 50,
      isActive: true,
      expiresAt: null,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/coupons", () => {
    it("should return coupons for store owner", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.coupon.findMany as jest.Mock).mockResolvedValue(mockCoupons);

      const request = new NextRequest("http://localhost:3000/api/coupons");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.coupons).toHaveLength(2);
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/coupons");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 for customer role", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "CUSTOMER" },
      });

      const request = new NextRequest("http://localhost:3000/api/coupons");
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("should filter active coupons", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.coupon.findMany as jest.Mock).mockResolvedValue([mockCoupons[0]]);

      const request = new NextRequest(
        "http://localhost:3000/api/coupons?active=true",
      );
      await GET(request);

      expect(db.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });
  });

  describe("POST /api/coupons", () => {
    const validCouponData = {
      code: "NEWSAVE",
      type: "PERCENTAGE",
      value: 15,
      minPurchase: 100,
      isActive: true,
    };

    it("should create coupon for store owner", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.coupon.findUnique as jest.Mock).mockResolvedValue(null);
      (db.coupon.create as jest.Mock).mockResolvedValue({
        id: "coupon_new",
        ...validCouponData,
        timesUsed: 0,
        createdAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/coupons", {
        method: "POST",
        body: JSON.stringify(validCouponData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.coupon.code).toBe("NEWSAVE");
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/coupons", {
        method: "POST",
        body: JSON.stringify(validCouponData),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 403 for customer role", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "CUSTOMER" },
      });

      const request = new NextRequest("http://localhost:3000/api/coupons", {
        method: "POST",
        body: JSON.stringify(validCouponData),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it("should return 409 for duplicate code", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupons[0]);

      const request = new NextRequest("http://localhost:3000/api/coupons", {
        method: "POST",
        body: JSON.stringify(validCouponData),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });

    it("should return 400 for invalid data", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: "",
          type: "INVALID",
          value: -10,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should uppercase coupon code", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (db.coupon.findUnique as jest.Mock).mockResolvedValue(null);
      (db.coupon.create as jest.Mock).mockResolvedValue({
        id: "coupon_new",
        code: "LOWERCASE",
        type: "PERCENTAGE",
        value: 10,
        timesUsed: 0,
        createdAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: "lowercase",
          type: "PERCENTAGE",
          value: 10,
        }),
      });

      await POST(request);

      expect(db.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: "LOWERCASE",
          }),
        }),
      );
    });
  });
});
