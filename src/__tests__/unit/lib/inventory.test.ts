// Inventory Management Tests
import {
  getProductStock,
  updateStock,
  reserveStock,
  releaseStock,
  getStockLevels,
} from "@/lib/inventory/stock";
import {
  getInventoryAlerts,
  getAlertSummary,
  getReorderSuggestions,
  getInventoryHealthScore,
} from "@/lib/inventory/alerts";

// Mock database
jest.mock("@/lib/db", () => ({
  db: {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    orderItem: {
      aggregate: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn({
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
    })),
  },
}));

// Mock realtime events
jest.mock("@/lib/realtime/events", () => ({
  eventBus: {
    emit: jest.fn(),
  },
  Events: {
    STOCK_UPDATE: "stock:update",
  },
}));

import { db } from "@/lib/db";

describe("Inventory Stock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProductStock", () => {
    it("should return product stock", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue({
        stock: 50,
      });

      const stock = await getProductStock("prod_123");
      expect(stock).toBe(50);
    });

    it("should return 0 for non-existent product", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(null);

      const stock = await getProductStock("invalid");
      expect(stock).toBe(0);
    });
  });

  describe("getStockLevels", () => {
    it("should return stock levels for all products", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        {
          id: "1",
          name: "Product 1",
          sku: "SKU-1",
          stock: 100,
          reorderPoint: 10,
          reorderQuantity: 50,
        },
        {
          id: "2",
          name: "Product 2",
          sku: "SKU-2",
          stock: 0,
          reorderPoint: 5,
          reorderQuantity: 20,
        },
      ]);

      const levels = await getStockLevels("tenant_123");

      expect(levels).toHaveLength(2);
      expect(levels[0].status).toBe("in_stock");
      expect(levels[1].status).toBe("out_of_stock");
    });

    it("should filter by status", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { id: "1", name: "Product 1", sku: "SKU-1", stock: 0 },
      ]);

      const levels = await getStockLevels("tenant_123", {
        status: "out_of_stock",
      });

      expect(levels.every((l) => l.status === "out_of_stock")).toBe(true);
    });
  });
});

describe("Inventory Alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getInventoryAlerts", () => {
    it("should return alerts for low stock products", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        {
          id: "1",
          name: "Low Stock Product",
          sku: "SKU-1",
          stock: 3,
          reorderPoint: 10,
        },
      ]);

      const alerts = await getInventoryAlerts("tenant_123");

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe("low_stock");
    });

    it("should return critical alert for out of stock", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        {
          id: "1",
          name: "Out of Stock",
          sku: "SKU-1",
          stock: 0,
          reorderPoint: 5,
        },
      ]);

      const alerts = await getInventoryAlerts("tenant_123");

      expect(alerts[0].type).toBe("out_of_stock");
      expect(alerts[0].severity).toBe("critical");
    });
  });

  describe("getAlertSummary", () => {
    it("should return summary counts", async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { id: "1", name: "P1", sku: "S1", stock: 0, reorderPoint: 5 },
        { id: "2", name: "P2", sku: "S2", stock: 2, reorderPoint: 10 },
      ]);

      const summary = await getAlertSummary("tenant_123");

      expect(summary.total).toBe(2);
      expect(summary.critical).toBe(1);
      expect(summary.outOfStock).toBe(1);
    });
  });

  describe("getInventoryHealthScore", () => {
    it("should calculate health score", async () => {
      (db.product.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(90)  // active
        .mockResolvedValueOnce(5)   // outOfStock
        .mockResolvedValueOnce(10); // lowStock

      const health = await getInventoryHealthScore("tenant_123");

      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(health.details).toHaveProperty("stockCoverage");
      expect(health.details).toHaveProperty("outOfStockRate");
    });
  });
});
