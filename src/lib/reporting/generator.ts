// @ts-nocheck
// Report Generator
// Generate various business reports

import { db } from "@/lib/db";
import { getDashboardMetrics } from "@/lib/analytics/metrics";

export type ReportType =
  | "sales"
  | "inventory"
  | "customers"
  | "products"
  | "orders"
  | "financial";

export type ReportFormat = "json" | "csv" | "pdf" | "xlsx";

export interface ReportConfig {
  type: ReportType;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  format: ReportFormat;
  filters?: Record<string, unknown>;
  includeCharts?: boolean;
}

export interface ReportResult {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  data: unknown;
  summary: Record<string, string | number>;
  format: ReportFormat;
}

// Generate report
export async function generateReport(
  config: ReportConfig,
): Promise<ReportResult> {
  const { type, tenantId, startDate, endDate, format } = config;

  let data: unknown;
  let summary: Record<string, string | number> = {};
  let title = "";

  switch (type) {
    case "sales":
      ({ data, summary, title } = await generateSalesReport(
        tenantId,
        startDate,
        endDate,
      ));
      break;
    case "inventory":
      ({ data, summary, title } = await generateInventoryReport(tenantId));
      break;
    case "customers":
      ({ data, summary, title } = await generateCustomerReport(
        tenantId,
        startDate,
        endDate,
      ));
      break;
    case "products":
      ({ data, summary, title } = await generateProductReport(
        tenantId,
        startDate,
        endDate,
      ));
      break;
    case "orders":
      ({ data, summary, title } = await generateOrderReport(
        tenantId,
        startDate,
        endDate,
      ));
      break;
    case "financial":
      ({ data, summary, title } = await generateFinancialReport(
        tenantId,
        startDate,
        endDate,
      ));
      break;
  }

  return {
    id: "report-" + Date.now().toString(36),
    type,
    title,
    generatedAt: new Date(),
    period: { start: startDate, end: endDate },
    data,
    summary,
    format,
  };
}

// Sales report
async function generateSalesReport(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  data: unknown;
  summary: Record<string, string | number>;
  title: string;
}> {
  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["COMPLETED", "DELIVERED"] },
    },
    include: {
      items: {
        include: {
          product: { select: { name: true, sku: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    data: orders.map((o) => ({
      orderId: o.id,
      date: o.createdAt,
      customer: o.user.name || o.user.email,
      items: o.items.length,
      subtotal: o.subtotal,
      tax: o.tax,
      shipping: o.shipping,
      total: o.total,
      status: o.status,
    })),
    summary: {
      "Total Ventas": totalRevenue.toFixed(2),
      "Total Órdenes": totalOrders,
      "Ticket Promedio": avgOrderValue.toFixed(2),
    },
    title: "Reporte de Ventas",
  };
}

// Inventory report
async function generateInventoryReport(tenantId: string): Promise<{
  data: unknown;
  summary: Record<string, string | number>;
  title: string;
}> {
  const products = await db.product.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      basePrice: true,
      category: { select: { name: true } },
    },
    orderBy: { stock: "asc" },
  });

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.stock * p.basePrice,
    0,
  );
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return {
    data: products.map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category.name,
      stock: p.stock,
      price: p.basePrice,
      value: p.stock * p.basePrice,
    })),
    summary: {
      "Total Productos": totalProducts,
      "Total Unidades": totalStock,
      "Valor Inventario": totalValue.toFixed(2),
      "Sin Stock": outOfStock,
    },
    title: "Reporte de Inventario",
  };
}

// Customer report
async function generateCustomerReport(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  data: unknown;
  summary: Record<string, string | number>;
  title: string;
}> {
  const customers = await db.user.findMany({
    where: { tenantId, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      orders: {
        where: { status: { in: ["COMPLETED", "DELIVERED"] } },
        select: { total: true, createdAt: true },
      },
    },
  });

  const newCustomers = customers.filter(
    (c) => c.createdAt >= startDate && c.createdAt <= endDate,
  ).length;

  const data = customers.map((c) => ({
    customerId: c.id,
    name: c.name,
    email: c.email,
    joinDate: c.createdAt,
    totalOrders: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
    lastOrder:
      c.orders.length > 0 ? c.orders[c.orders.length - 1].createdAt : null,
  }));

  return {
    data,
    summary: {
      "Total Clientes": customers.length,
      "Clientes Nuevos": newCustomers,
      "Con Compras": customers.filter((c) => c.orders.length > 0).length,
    },
    title: "Reporte de Clientes",
  };
}

// Product performance report
async function generateProductReport(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  data: unknown;
  summary: Record<string, string | number>;
  title: string;
}> {
  const products = await db.product.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      sku: true,
      basePrice: true,
      stock: true,
      orderItems: {
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: { in: ["COMPLETED", "DELIVERED"] },
          },
        },
        select: { quantity: true, price: true },
      },
    },
  });

  const data = products.map((p) => {
    const soldQuantity = p.orderItems.reduce((sum, i) => sum + i.quantity, 0);
    const revenue = p.orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      price: p.basePrice,
      stock: p.stock,
      sold: soldQuantity,
      revenue,
    };
  });

  // Sort by revenue
  data.sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalSold = data.reduce((sum, d) => sum + d.sold, 0);

  return {
    data,
    summary: {
      "Total Productos": products.length,
      "Unidades Vendidas": totalSold,
      Ingresos: totalRevenue.toFixed(2),
    },
    title: "Reporte de Productos",
  };
}

// Order report
async function generateOrderReport(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  data: unknown;
  summary: Record<string, string | number>;
  title: string;
}> {
  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusCounts: Record<string, number> = {};
  for (const order of orders) {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  }

  return {
    data: orders.map((o) => ({
      orderId: o.id,
      date: o.createdAt,
      customer: o.user.name || o.user.email,
      items: o._count.items,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
    })),
    summary: {
      "Total Órdenes": orders.length,
      Completadas: statusCounts["COMPLETED"] || 0,
      Pendientes: statusCounts["PENDING"] || 0,
      Canceladas: statusCounts["CANCELLED"] || 0,
    },
    title: "Reporte de Órdenes",
  };
}

// Financial report
async function generateFinancialReport(
  tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  data: unknown;
  summary: Record<string, string | number>;
  title: string;
}> {
  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["COMPLETED", "DELIVERED"] },
    },
    select: {
      subtotal: true,
      tax: true,
      shipping: true,
      discount: true,
      total: true,
      createdAt: true,
    },
  });

  const grossRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
  const totalShipping = orders.reduce((sum, o) => sum + o.shipping, 0);
  const totalDiscounts = orders.reduce((sum, o) => sum + o.discount, 0);
  const netRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // Group by date
  const byDate: Record<string, { revenue: number; orders: number }> = {};
  for (const order of orders) {
    const date = order.createdAt.toISOString().split("T")[0];
    if (!byDate[date]) {
      byDate[date] = { revenue: 0, orders: 0 };
    }
    byDate[date].revenue += order.total;
    byDate[date].orders += 1;
  }

  return {
    data: Object.entries(byDate).map(([date, values]) => ({
      date,
      revenue: values.revenue,
      orders: values.orders,
    })),
    summary: {
      "Ingresos Brutos": grossRevenue.toFixed(2),
      Impuestos: totalTax.toFixed(2),
      Envío: totalShipping.toFixed(2),
      Descuentos: totalDiscounts.toFixed(2),
      "Ingresos Netos": netRevenue.toFixed(2),
    },
    title: "Reporte Financiero",
  };
}
