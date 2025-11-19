// Analytics API Tests
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getOverviewMetrics,
  getSalesMetrics,
  getCustomerMetrics,
} from "@/lib/analytics/queries";

// Mock dependencies
jest.mock("@/lib/auth/auth");
jest.mock("@/lib/analytics/queries");

// Import after mocking
import { GET as getOverview } from "@/app/api/analytics/overview/route";
import { GET as getSales } from "@/app/api/analytics/sales/route";
import { GET as getCustomers } from "@/app/api/analytics/customers/route";

describe("Analytics API", () => {
  const mockSession = {
    user: {
      id: "user_123",
      tenantId: "tenant_123",
      role: "STORE_OWNER",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/overview", () => {
    const mockOverviewMetrics = {
      revenue: { current: 10000, previous: 8000, percentChange: 25 },
      orders: { current: 100, previous: 80, percentChange: 25 },
      customers: { current: 50, previous: 40, percentChange: 25 },
      avgOrderValue: { current: 100, previous: 100, percentChange: 0 },
    };

    it("should return overview metrics for store owner", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOverviewMetrics as jest.Mock).mockResolvedValue(mockOverviewMetrics);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/overview",
      );
      const response = await getOverview(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.revenue.current).toBe(10000);
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/overview",
      );
      const response = await getOverview(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 for customer role", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "CUSTOMER" },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/overview",
      );
      const response = await getOverview(request);

      expect(response.status).toBe(403);
    });

    it("should filter by date range", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOverviewMetrics as jest.Mock).mockResolvedValue(mockOverviewMetrics);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/overview?startDate=2024-01-01&endDate=2024-01-31",
      );
      await getOverview(request);

      expect(getOverviewMetrics).toHaveBeenCalledWith(
        "tenant_123",
        expect.any(Date),
        expect.any(Date),
      );
    });
  });

  describe("GET /api/analytics/sales", () => {
    const mockSalesMetrics = {
      totalRevenue: 50000,
      totalOrders: 500,
      avgOrderValue: 100,
      revenueByDay: [
        { date: "2024-01-15", revenue: 1000, orders: 10, avgOrderValue: 100 },
      ],
      revenueByCategory: [
        {
          categoryId: "cat_1",
          categoryName: "Electronics",
          revenue: 30000,
          orders: 300,
          percentage: 60,
        },
      ],
      topProducts: [
        {
          productId: "prod_1",
          productName: "Product 1",
          quantitySold: 100,
          revenue: 10000,
          avgPrice: 100,
        },
      ],
    };

    it("should return sales metrics for store owner", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getSalesMetrics as jest.Mock).mockResolvedValue(mockSalesMetrics);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/sales",
      );
      const response = await getSales(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics.totalRevenue).toBe(50000);
      expect(data.metrics.topProducts).toHaveLength(1);
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/sales",
      );
      const response = await getSales(request);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/analytics/customers", () => {
    const mockCustomerMetrics = {
      totalCustomers: 1000,
      newCustomers: 100,
      returningCustomers: 200,
      avgLifetimeValue: 500,
      avgPurchaseFrequency: 2.5,
      customersBySegment: [
        { segment: "new", count: 100, revenue: 10000, percentage: 10 },
        { segment: "returning", count: 200, revenue: 50000, percentage: 50 },
      ],
      topCustomers: [
        {
          userId: "user_1",
          userName: "Top Customer",
          email: "top@test.com",
          totalOrders: 50,
          totalRevenue: 5000,
          avgOrderValue: 100,
          lastOrderDate: "2024-01-20",
        },
      ],
    };

    it("should return customer metrics for store owner", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getCustomerMetrics as jest.Mock).mockResolvedValue(mockCustomerMetrics);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/customers",
      );
      const response = await getCustomers(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics.totalCustomers).toBe(1000);
      expect(data.metrics.topCustomers).toHaveLength(1);
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/customers",
      );
      const response = await getCustomers(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 for customer role", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: "tenant_123", role: "CUSTOMER" },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/customers",
      );
      const response = await getCustomers(request);

      expect(response.status).toBe(403);
    });
  });
});
