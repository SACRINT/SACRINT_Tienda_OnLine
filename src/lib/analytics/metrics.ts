// @ts-nocheck
// Analytics Metrics
// Core metrics calculation

import { db } from "@/lib/db";

export interface DashboardMetrics {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  products: ProductMetrics;
  customers: CustomerMetrics;
  conversion: ConversionMetrics;
}

export interface RevenueMetrics {
  total: number;
  average: number;
  growth: number;
  byPeriod: { date: string; value: number }[];
}

export interface OrderMetrics {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  averageValue: number;
  growth: number;
}

export interface ProductMetrics {
  total: number;
  active: number;
  outOfStock: number;
  lowStock: number;
  topSelling: { id: string; name: string; sold: number }[];
}

export interface CustomerMetrics {
  total: number;
  new: number;
  returning: number;
  growth: number;
  averageLifetimeValue: number;
}

export interface ConversionMetrics {
  rate: number;
  cartAbandonment: number;
  checkoutAbandonment: number;
  funnel: FunnelStep[];
}

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

// Get dashboard overview metrics
export async function getDashboardMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<DashboardMetrics> {
  const [revenue, orders, products, customers] = await Promise.all([
    getRevenueMetrics(tenantId, startDate, endDate),
    getOrderMetrics(tenantId, startDate, endDate),
    getProductMetrics(tenantId),
    getCustomerMetrics(tenantId, startDate, endDate),
  ]);

  const conversion = await getConversionMetrics(tenantId, startDate, endDate);

  return { revenue, orders, products, customers, conversion };
}

// Revenue metrics
export async function getRevenueMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<RevenueMetrics> {
  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["COMPLETED", "DELIVERED"] },
    },
    select: {
      total: true,
      createdAt: true,
    },
  });

  const total = orders.reduce((sum, o) => sum + o.total, 0);
  const average = orders.length > 0 ? total / orders.length : 0;

  // Calculate growth vs previous period
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevOrders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: prevStartDate, lt: startDate },
      status: { in: ["COMPLETED", "DELIVERED"] },
    },
    select: { total: true },
  });
  const prevTotal = prevOrders.reduce((sum, o) => sum + o.total, 0);
  const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  // Group by date
  const byPeriod = groupByDate(
    orders.map((o) => ({
      date: o.createdAt,
      value: o.total,
    })),
  );

  return { total, average, growth, byPeriod };
}

// Order metrics
export async function getOrderMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<OrderMetrics> {
  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      status: true,
      total: true,
    },
  });

  const total = orders.length;
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const completed = orders.filter((o) => ["COMPLETED", "DELIVERED"].includes(o.status)).length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const averageValue = total > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / total : 0;

  // Calculate growth
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevCount = await db.order.count({
    where: {
      tenantId,
      createdAt: { gte: prevStartDate, lt: startDate },
    },
  });
  const growth = prevCount > 0 ? ((total - prevCount) / prevCount) * 100 : 0;

  return { total, pending, completed, cancelled, averageValue, growth };
}

// Product metrics
export async function getProductMetrics(tenantId: string): Promise<ProductMetrics> {
  const [total, active, outOfStock, lowStock] = await Promise.all([
    db.product.count({ where: { tenantId } }),
    db.product.count({ where: { tenantId, published: true } }),
    db.product.count({ where: { tenantId, stock: 0 } }),
    db.product.count({ where: { tenantId, stock: { gt: 0, lte: 5 } } }),
  ]);

  // Top selling products
  const topSelling = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { tenantId },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const productIds = topSelling.map((t) => t.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const topSellingWithNames = topSelling.map((t) => {
    const product = products.find((p) => p.id === t.productId);
    return {
      id: t.productId,
      name: product?.name || "Unknown",
      sold: t._sum.quantity || 0,
    };
  });

  return {
    total,
    active,
    outOfStock,
    lowStock,
    topSelling: topSellingWithNames,
  };
}

// Customer metrics
export async function getCustomerMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<CustomerMetrics> {
  const [total, newCustomers] = await Promise.all([
    db.user.count({ where: { tenantId, role: "CUSTOMER" } }),
    db.user.count({
      where: {
        tenantId,
        role: "CUSTOMER",
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  // Returning customers (more than 1 order)
  const customersWithOrders = await db.order.groupBy({
    by: ["userId"],
    where: { tenantId },
    _count: true,
    having: { userId: { _count: { gt: 1 } } },
  });
  const returning = customersWithOrders.length;

  // Growth calculation
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevNew = await db.user.count({
    where: {
      tenantId,
      role: "CUSTOMER",
      createdAt: { gte: prevStartDate, lt: startDate },
    },
  });
  const growth = prevNew > 0 ? ((newCustomers - prevNew) / prevNew) * 100 : 0;

  // Average lifetime value
  const totalRevenue = await db.order.aggregate({
    where: {
      tenantId,
      status: { in: ["COMPLETED", "DELIVERED"] },
    },
    _sum: { total: true },
  });
  const averageLifetimeValue = total > 0 ? (totalRevenue._sum.total || 0) / total : 0;

  return { total, new: newCustomers, returning, growth, averageLifetimeValue };
}

// Conversion metrics
export async function getConversionMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<ConversionMetrics> {
  // Simplified funnel metrics
  const visitors = 1000; // Would come from analytics service
  const productViews = 600;
  const addToCarts = 200;
  const checkouts = 100;
  const purchases = await db.order.count({
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: { notIn: ["CANCELLED"] },
    },
  });

  const rate = visitors > 0 ? (purchases / visitors) * 100 : 0;
  const cartAbandonment = addToCarts > 0 ? ((addToCarts - checkouts) / addToCarts) * 100 : 0;
  const checkoutAbandonment = checkouts > 0 ? ((checkouts - purchases) / checkouts) * 100 : 0;

  const funnel: FunnelStep[] = [
    { name: "Visitantes", count: visitors, percentage: 100 },
    {
      name: "Vieron producto",
      count: productViews,
      percentage: (productViews / visitors) * 100,
    },
    {
      name: "Añadieron al carrito",
      count: addToCarts,
      percentage: (addToCarts / visitors) * 100,
    },
    {
      name: "Iniciaron checkout",
      count: checkouts,
      percentage: (checkouts / visitors) * 100,
    },
    {
      name: "Compraron",
      count: purchases,
      percentage: (purchases / visitors) * 100,
    },
  ];

  return { rate, cartAbandonment, checkoutAbandonment, funnel };
}

// Helper: Group values by date
function groupByDate(items: { date: Date; value: number }[]): { date: string; value: number }[] {
  const grouped: Record<string, number> = {};

  for (const item of items) {
    const dateKey = item.date.toISOString().split("T")[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + item.value;
  }

  return Object.entries(grouped)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
