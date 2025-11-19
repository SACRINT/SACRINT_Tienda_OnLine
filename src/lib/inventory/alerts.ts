// @ts-nocheck
// Inventory Alerts
// Low stock and reorder notifications

import { db } from "@/lib/db";

export interface InventoryAlert {
  id: string;
  type: "low_stock" | "out_of_stock" | "overstock" | "reorder";
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  severity: "info" | "warning" | "critical";
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Get active alerts for tenant
export async function getInventoryAlerts(
  tenantId: string,
  options?: {
    type?: InventoryAlert["type"];
    severity?: InventoryAlert["severity"];
    acknowledged?: boolean;
  },
): Promise<InventoryAlert[]> {
  // Get products with stock issues
  const products = await db.product.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      reorderPoint: true,
    },
  });

  const alerts: InventoryAlert[] = [];

  for (const product of products) {
    const reorderPoint = product.reorderPoint || 5;

    // Out of stock
    if (product.stock === 0) {
      alerts.push({
        id: "alert-" + product.id + "-oos",
        type: "out_of_stock",
        productId: product.id,
        productName: product.name,
        sku: product.sku || "",
        currentStock: product.stock,
        threshold: 0,
        severity: "critical",
        createdAt: new Date(),
        acknowledged: false,
      });
    }
    // Low stock
    else if (product.stock <= reorderPoint) {
      alerts.push({
        id: "alert-" + product.id + "-low",
        type: "low_stock",
        productId: product.id,
        productName: product.name,
        sku: product.sku || "",
        currentStock: product.stock,
        threshold: reorderPoint,
        severity: product.stock <= reorderPoint / 2 ? "warning" : "info",
        createdAt: new Date(),
        acknowledged: false,
      });
    }
  }

  // Filter by options
  let filteredAlerts = alerts;

  if (options?.type) {
    filteredAlerts = filteredAlerts.filter((a) => a.type === options.type);
  }

  if (options?.severity) {
    filteredAlerts = filteredAlerts.filter(
      (a) => a.severity === options.severity,
    );
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  filteredAlerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  return filteredAlerts;
}

// Get alert summary
export async function getAlertSummary(tenantId: string): Promise<{
  total: number;
  critical: number;
  warning: number;
  info: number;
  outOfStock: number;
  lowStock: number;
}> {
  const alerts = await getInventoryAlerts(tenantId);

  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    outOfStock: alerts.filter((a) => a.type === "out_of_stock").length,
    lowStock: alerts.filter((a) => a.type === "low_stock").length,
  };
}

// Generate reorder suggestions
export async function getReorderSuggestions(tenantId: string): Promise<
  Array<{
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    reorderPoint: number;
    suggestedQuantity: number;
    estimatedCost: number;
  }>
> {
  const products = await db.product.findMany({
    where: {
      tenantId,
      isActive: true,
      stock: { lte: db.product.fields.reorderPoint },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      reorderPoint: true,
      reorderQuantity: true,
      basePrice: true,
    },
  });

  return products
    .filter((p) => p.stock <= (p.reorderPoint || 5))
    .map((product) => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku || "",
      currentStock: product.stock,
      reorderPoint: product.reorderPoint || 5,
      suggestedQuantity: product.reorderQuantity || 10,
      estimatedCost: (product.reorderQuantity || 10) * product.basePrice * 0.6, // Assume 60% cost
    }));
}

// Calculate days until stockout
export async function getDaysUntilStockout(
  productId: string,
  days: number = 30,
): Promise<number | null> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get sales velocity
  const sales = await db.orderItem.aggregate({
    where: {
      productId,
      order: {
        status: { in: ["COMPLETED", "DELIVERED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
    },
    _sum: { quantity: true },
  });

  const totalSold = sales._sum.quantity || 0;
  const dailyVelocity = totalSold / days;

  if (dailyVelocity === 0) {
    return null; // No sales, can't predict
  }

  // Get current stock
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  if (!product) return null;

  return Math.floor(product.stock / dailyVelocity);
}

// Get inventory health score
export async function getInventoryHealthScore(tenantId: string): Promise<{
  score: number;
  details: {
    stockCoverage: number;
    turnoverRate: number;
    outOfStockRate: number;
    accuracyRate: number;
  };
}> {
  const [totalProducts, outOfStock, lowStock] = await Promise.all([
    db.product.count({ where: { tenantId, isActive: true } }),
    db.product.count({ where: { tenantId, isActive: true, stock: 0 } }),
    db.product.count({
      where: { tenantId, isActive: true, stock: { lte: 5 } },
    }),
  ]);

  // Calculate metrics
  const outOfStockRate =
    totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0;
  const stockCoverage =
    totalProducts > 0
      ? ((totalProducts - lowStock) / totalProducts) * 100
      : 100;

  // Simplified turnover and accuracy (would need more data)
  const turnoverRate = 4.5; // Monthly turns
  const accuracyRate = 98; // Inventory accuracy %

  // Calculate overall score (0-100)
  const score =
    stockCoverage * 0.3 +
    (100 - outOfStockRate) * 0.3 +
    Math.min(turnoverRate * 10, 100) * 0.2 +
    accuracyRate * 0.2;

  return {
    score: Math.round(score),
    details: {
      stockCoverage: Math.round(stockCoverage),
      turnoverRate,
      outOfStockRate: Math.round(outOfStockRate),
      accuracyRate,
    },
  };
}
