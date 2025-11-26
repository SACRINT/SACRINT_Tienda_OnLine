/**
 * Stock Forecasting Module
 * Task 12.6: Stock Forecasting
 *
 * Algoritmos para predecir cuándo se agotará el stock basándose en
 * ventas históricas y tendencias.
 */

import { db } from "@/lib/db";

/**
 * Calcula el promedio diario de ventas para un producto
 */
export async function calculateDailyAverageSales(
  productId: string,
  days: number = 30
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Obtener todos los orderItems del producto en el período
  const orderItems = await db.orderItem.findMany({
    where: {
      productId,
      order: {
        createdAt: { gte: since },
        status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      },
    },
    select: {
      quantity: true,
    },
  });

  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const dailyAverage = totalQuantity / days;

  return dailyAverage;
}

/**
 * Estima cuántos días hasta que se agote el stock
 */
export function estimateDaysUntilOutOfStock(
  currentStock: number,
  dailyAverageSales: number
): number {
  if (dailyAverageSales === 0) {
    return Infinity; // No se vende, nunca se agotará
  }

  if (currentStock <= 0) {
    return 0; // Ya agotado
  }

  return Math.floor(currentStock / dailyAverageSales);
}

/**
 * Calcula cuándo debería hacer restock
 * Basado en lead time del proveedor y ventas diarias
 */
export function calculateReorderPoint(
  dailyAverageSales: number,
  leadTimeDays: number,
  safetyStockDays: number = 7
): number {
  // Reorder point = (Daily sales × Lead time) + Safety stock
  const leadTimeStock = dailyAverageSales * leadTimeDays;
  const safetyStock = dailyAverageSales * safetyStockDays;

  return Math.ceil(leadTimeStock + safetyStock);
}

/**
 * Obtiene forecast completo para un producto
 */
export async function getProductForecast(productId: string, tenantId: string) {
  // Obtener producto
  const product = await db.product.findUnique({
    where: {
      id: productId,
      tenantId,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      lowStockThreshold: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Calcular promedios de ventas
  const dailyAverage30d = await calculateDailyAverageSales(productId, 30);
  const dailyAverage7d = await calculateDailyAverageSales(productId, 7);
  const dailyAverage90d = await calculateDailyAverageSales(productId, 90);

  // Usar promedio de 30 días como base
  const dailyAverage = dailyAverage30d;

  // Estimar días hasta agotarse
  const daysUntilOutOfStock = estimateDaysUntilOutOfStock(
    product.stock,
    dailyAverage
  );

  // Calcular reorder point (asumiendo 14 días de lead time)
  const reorderPoint = calculateReorderPoint(dailyAverage, 14, 7);

  // Determinar status
  let stockStatus: "critical" | "warning" | "healthy" | "overstocked";
  if (product.stock === 0) {
    stockStatus = "critical";
  } else if (product.stock <= reorderPoint) {
    stockStatus = "warning";
  } else if (product.stock > dailyAverage * 90) {
    stockStatus = "overstocked";
  } else {
    stockStatus = "healthy";
  }

  // Calcular fecha estimada de agotamiento
  let estimatedOutOfStockDate: Date | null = null;
  if (daysUntilOutOfStock !== Infinity && daysUntilOutOfStock > 0) {
    estimatedOutOfStockDate = new Date();
    estimatedOutOfStockDate.setDate(
      estimatedOutOfStockDate.getDate() + daysUntilOutOfStock
    );
  }

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
    },
    forecast: {
      dailyAverageSales: Math.round(dailyAverage * 100) / 100,
      dailyAverage7d: Math.round(dailyAverage7d * 100) / 100,
      dailyAverage30d: Math.round(dailyAverage30d * 100) / 100,
      dailyAverage90d: Math.round(dailyAverage90d * 100) / 100,
      daysUntilOutOfStock,
      estimatedOutOfStockDate,
      reorderPoint,
      stockStatus,
      shouldReorder: product.stock <= reorderPoint,
      recommendedReorderQuantity: Math.ceil(dailyAverage * 30), // 30 días de stock
    },
  };
}

/**
 * Obtiene forecast para todos los productos de un tenant
 */
export async function getAllProductsForecas(
  tenantId: string,
  filterStatus?: "critical" | "warning" | "healthy"
) {
  // Obtener productos
  const products = await db.product.findMany({
    where: {
      tenantId,
      published: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      lowStockThreshold: true,
    },
    take: 100, // Limitar para performance
  });

  // Calcular forecast para cada producto (en paralelo)
  const forecastsPromises = products.map((product) =>
    getProductForecast(product.id, tenantId).catch((error) => {
      console.error(`Error forecasting product ${product.id}:`, error);
      return null;
    })
  );

  const forecasts = await Promise.all(forecastsPromises);

  // Filtrar nulls y por status si se especifica
  let filtered = forecasts.filter((f) => f !== null) as Awaited<
    ReturnType<typeof getProductForecast>
  >[];

  if (filterStatus) {
    filtered = filtered.filter((f) => f.forecast.stockStatus === filterStatus);
  }

  // Ordenar por criticidad
  filtered.sort((a, b) => {
    const statusOrder = { critical: 0, warning: 1, healthy: 2, overstocked: 3 };
    return (
      statusOrder[a.forecast.stockStatus] - statusOrder[b.forecast.stockStatus]
    );
  });

  return filtered;
}

/**
 * Calcula tendencia de ventas (crecimiento o decrecimiento)
 */
export async function calculateSalesTrend(
  productId: string,
  currentPeriodDays: number = 7,
  previousPeriodDays: number = 7
): Promise<{
  currentAverage: number;
  previousAverage: number;
  trend: "increasing" | "decreasing" | "stable";
  changePercentage: number;
}> {
  const currentAverage = await calculateDailyAverageSales(
    productId,
    currentPeriodDays
  );

  // Calcular promedio del período anterior
  const since = new Date();
  since.setDate(since.getDate() - currentPeriodDays - previousPeriodDays);
  const until = new Date();
  until.setDate(until.getDate() - currentPeriodDays);

  const previousOrderItems = await db.orderItem.findMany({
    where: {
      productId,
      order: {
        createdAt: { gte: since, lte: until },
        status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      },
    },
    select: {
      quantity: true,
    },
  });

  const previousTotal = previousOrderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const previousAverage = previousTotal / previousPeriodDays;

  // Calcular cambio porcentual
  let changePercentage = 0;
  if (previousAverage > 0) {
    changePercentage =
      ((currentAverage - previousAverage) / previousAverage) * 100;
  }

  // Determinar tendencia
  let trend: "increasing" | "decreasing" | "stable";
  if (changePercentage > 10) {
    trend = "increasing";
  } else if (changePercentage < -10) {
    trend = "decreasing";
  } else {
    trend = "stable";
  }

  return {
    currentAverage: Math.round(currentAverage * 100) / 100,
    previousAverage: Math.round(previousAverage * 100) / 100,
    trend,
    changePercentage: Math.round(changePercentage * 10) / 10,
  };
}
