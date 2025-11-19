// Analytics Tests
import {
  getOverviewMetrics,
  getSalesMetrics,
  getCustomerMetrics,
  getCouponReports,
  getTaxReports,
  getShippingReports,
} from "@/lib/analytics/queries";
import { db } from "@/lib/db";

// Mock database
jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe("Analytics Queries", () => {
  const tenantId = "tenant_123";
  const startDate = new Date("2024-01-01");
  const endDate = new Date("2024-01-31");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOverviewMetrics", () => {
    it("should calculate revenue metrics", async () => {
      const mockCurrentOrders = [
        { id: "order_1", total: 100, customerId: "cust_1", items: [] },
        { id: "order_2", total: 200, customerId: "cust_2", items: [] },
      ];

      const mockPreviousOrders = [
        { id: "order_3", total: 150, customerId: "cust_1" },
      ];

      (db.order.findMany as jest.Mock)
        .mockResolvedValueOnce(mockCurrentOrders) // Current period
        .mockResolvedValueOnce(mockPreviousOrders); // Previous period

      const metrics = await getOverviewMetrics(tenantId, startDate, endDate);

      expect(metrics.revenue.current).toBe(300);
      expect(metrics.revenue.previous).toBe(150);
      expect(metrics.orders.current).toBe(2);
      expect(metrics.orders.previous).toBe(1);
      expect(metrics.customers.current).toBe(2);
      expect(metrics.avgOrderValue.current).toBe(150);
    });

    it("should handle empty orders", async () => {
      (db.order.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const metrics = await getOverviewMetrics(tenantId, startDate, endDate);

      expect(metrics.revenue.current).toBe(0);
      expect(metrics.orders.current).toBe(0);
      expect(metrics.customers.current).toBe(0);
      expect(metrics.avgOrderValue.current).toBe(0);
    });
  });

  describe("getSalesMetrics", () => {
    it("should calculate sales by day", async () => {
      const mockOrders = [
        {
          id: "order_1",
          total: 100,
          createdAt: new Date("2024-01-15"),
          items: [
            {
              productId: "prod_1",
              price: 50,
              quantity: 2,
              product: {
                id: "prod_1",
                name: "Product 1",
                images: ["/img1.jpg"],
                category: { id: "cat_1", name: "Category 1" },
              },
            },
          ],
        },
        {
          id: "order_2",
          total: 200,
          createdAt: new Date("2024-01-15"),
          items: [
            {
              productId: "prod_2",
              price: 100,
              quantity: 2,
              product: {
                id: "prod_2",
                name: "Product 2",
                images: ["/img2.jpg"],
                category: { id: "cat_1", name: "Category 1" },
              },
            },
          ],
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const metrics = await getSalesMetrics(tenantId, startDate, endDate);

      expect(metrics.totalRevenue).toBe(300);
      expect(metrics.totalOrders).toBe(2);
      expect(metrics.avgOrderValue).toBe(150);
      expect(metrics.revenueByDay).toHaveLength(1);
      expect(metrics.revenueByDay[0].revenue).toBe(300);
      expect(metrics.revenueByDay[0].orders).toBe(2);
    });

    it("should calculate top products", async () => {
      const mockOrders = [
        {
          id: "order_1",
          total: 150,
          createdAt: new Date("2024-01-15"),
          items: [
            {
              productId: "prod_1",
              price: 50,
              quantity: 3,
              product: {
                id: "prod_1",
                name: "Product 1",
                images: ["/img1.jpg"],
                category: { id: "cat_1", name: "Category 1" },
              },
            },
          ],
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const metrics = await getSalesMetrics(tenantId, startDate, endDate);

      expect(metrics.topProducts).toHaveLength(1);
      expect(metrics.topProducts[0].productId).toBe("prod_1");
      expect(metrics.topProducts[0].quantitySold).toBe(3);
      expect(metrics.topProducts[0].revenue).toBe(150);
    });

    it("should calculate revenue by category", async () => {
      const mockOrders = [
        {
          id: "order_1",
          total: 100,
          createdAt: new Date("2024-01-15"),
          items: [
            {
              productId: "prod_1",
              price: 50,
              quantity: 2,
              product: {
                id: "prod_1",
                name: "Product 1",
                images: [],
                category: { id: "cat_1", name: "Electronics" },
              },
            },
          ],
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const metrics = await getSalesMetrics(tenantId, startDate, endDate);

      expect(metrics.revenueByCategory).toHaveLength(1);
      expect(metrics.revenueByCategory[0].categoryName).toBe("Electronics");
      expect(metrics.revenueByCategory[0].revenue).toBe(100);
    });
  });

  describe("getCustomerMetrics", () => {
    it("should calculate customer segments", async () => {
      const mockOrders = [
        {
          id: "order_1",
          total: 100,
          customerId: "cust_1",
          createdAt: new Date("2024-01-10"),
          customer: { name: "Customer 1", email: "cust1@test.com" },
        },
        {
          id: "order_2",
          total: 150,
          customerId: "cust_1",
          createdAt: new Date("2024-01-20"),
          customer: { name: "Customer 1", email: "cust1@test.com" },
        },
        {
          id: "order_3",
          total: 200,
          customerId: "cust_2",
          createdAt: new Date("2024-01-15"),
          customer: { name: "Customer 2", email: "cust2@test.com" },
        },
      ];

      const mockCustomers = [
        { id: "cust_1", name: "Customer 1", role: "CUSTOMER" },
        { id: "cust_2", name: "Customer 2", role: "CUSTOMER" },
        { id: "cust_3", name: "Customer 3", role: "CUSTOMER" },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (db.user.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const metrics = await getCustomerMetrics(tenantId, startDate, endDate);

      expect(metrics.totalCustomers).toBe(3);
      expect(metrics.returningCustomers).toBe(1); // cust_1 has 2 orders
      expect(metrics.newCustomers).toBe(1); // cust_2 has 1 order
    });

    it("should calculate top customers", async () => {
      const mockOrders = [
        {
          id: "order_1",
          total: 500,
          customerId: "cust_1",
          createdAt: new Date("2024-01-10"),
          customer: { name: "Big Spender", email: "big@test.com" },
        },
        {
          id: "order_2",
          total: 100,
          customerId: "cust_2",
          createdAt: new Date("2024-01-15"),
          customer: { name: "Small Buyer", email: "small@test.com" },
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (db.user.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await getCustomerMetrics(tenantId, startDate, endDate);

      expect(metrics.topCustomers[0].userName).toBe("Big Spender");
      expect(metrics.topCustomers[0].totalRevenue).toBe(500);
    });

    it("should calculate average lifetime value", async () => {
      const mockOrders = [
        {
          id: "order_1",
          total: 100,
          customerId: "cust_1",
          createdAt: new Date("2024-01-10"),
          customer: { name: "Customer 1", email: "c1@test.com" },
        },
        {
          id: "order_2",
          total: 200,
          customerId: "cust_2",
          createdAt: new Date("2024-01-15"),
          customer: { name: "Customer 2", email: "c2@test.com" },
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (db.user.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await getCustomerMetrics(tenantId, startDate, endDate);

      // Total revenue 300, 2 customers = 150 average
      expect(metrics.avgLifetimeValue).toBe(150);
    });
  });

  describe("getCouponReports", () => {
    it("should aggregate coupon usage", async () => {
      const mockOrders = [
        {
          id: "order_1",
          total: 90,
          discount: 10,
          couponId: "coupon_1",
          coupon: { code: "SAVE10", type: "PERCENTAGE", value: 10 },
        },
        {
          id: "order_2",
          total: 85,
          discount: 15,
          couponId: "coupon_1",
          coupon: { code: "SAVE10", type: "PERCENTAGE", value: 10 },
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const reports = await getCouponReports(tenantId, startDate, endDate);

      expect(reports).toHaveLength(1);
      expect(reports[0].code).toBe("SAVE10");
      expect(reports[0].timesUsed).toBe(2);
      expect(reports[0].totalDiscount).toBe(25);
      expect(reports[0].revenueImpact).toBe(175);
    });

    it("should handle orders without coupons", async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([]);

      const reports = await getCouponReports(tenantId, startDate, endDate);
      expect(reports).toHaveLength(0);
    });
  });

  describe("getTaxReports", () => {
    it("should aggregate tax by state", async () => {
      const mockOrders = [
        {
          id: "order_1",
          tax: 16,
          shippingAddress: { state: "CDMX" },
        },
        {
          id: "order_2",
          tax: 24,
          shippingAddress: { state: "CDMX" },
        },
        {
          id: "order_3",
          tax: 8,
          shippingAddress: { state: "JAL" },
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const reports = await getTaxReports(tenantId, startDate, endDate);

      const cdmx = reports.find((r) => r.state === "CDMX");
      const jal = reports.find((r) => r.state === "JAL");

      expect(cdmx).toBeDefined();
      expect(cdmx!.totalTax).toBe(40);
      expect(cdmx!.orders).toBe(2);
      expect(jal!.totalTax).toBe(8);
      expect(jal!.orders).toBe(1);
    });

    it("should handle missing state", async () => {
      const mockOrders = [
        {
          id: "order_1",
          tax: 16,
          shippingAddress: null,
        },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const reports = await getTaxReports(tenantId, startDate, endDate);

      const unknown = reports.find((r) => r.state === "Unknown");
      expect(unknown).toBeDefined();
      expect(unknown!.totalTax).toBe(16);
    });
  });

  describe("getShippingReports", () => {
    it("should aggregate by shipping method", async () => {
      const mockOrders = [
        { id: "order_1", shippingMethod: "Express", shippingCost: 25 },
        { id: "order_2", shippingMethod: "Express", shippingCost: 25 },
        { id: "order_3", shippingMethod: "Standard", shippingCost: 10 },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const reports = await getShippingReports(tenantId, startDate, endDate);

      const express = reports.find((r) => r.method === "Express");
      const standard = reports.find((r) => r.method === "Standard");

      expect(express!.timesUsed).toBe(2);
      expect(express!.totalCost).toBe(50);
      expect(express!.avgCost).toBe(25);
      expect(standard!.timesUsed).toBe(1);
      expect(standard!.totalCost).toBe(10);
    });

    it("should default to Standard method", async () => {
      const mockOrders = [
        { id: "order_1", shippingMethod: null, shippingCost: 10 },
      ];

      (db.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const reports = await getShippingReports(tenantId, startDate, endDate);

      expect(reports[0].method).toBe("Standard");
    });
  });
});
