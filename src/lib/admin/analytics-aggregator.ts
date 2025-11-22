/**
 * Analytics Aggregator
 * Agregación de datos para dashboard de admin
 */

import { logger } from "../monitoring/logger";

export interface DashboardStats {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    total: number;
    status: string;
    date: Date;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sold: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  revenueTimeline: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export class AnalyticsAggregator {
  /**
   * Calcular estadísticas de overview
   */
  static calculateOverviewStats(data: {
    orders: Array<{ total: number; createdAt: Date }>;
    customers: Array<{ id: string }>;
    previousPeriodOrders?: Array<{ total: number }>;
  }): DashboardStats["overview"] {
    const totalRevenue = data.orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = data.orders.length;
    const totalCustomers = data.customers.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Growth calculations
    let revenueGrowth = 0;
    let ordersGrowth = 0;

    if (data.previousPeriodOrders && data.previousPeriodOrders.length > 0) {
      const previousRevenue = data.previousPeriodOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      );
      const previousOrders = data.previousPeriodOrders.length;

      revenueGrowth =
        previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      ordersGrowth =
        previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;
    }

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      revenueGrowth,
      ordersGrowth,
    };
  }

  /**
   * Obtener productos más vendidos
   */
  static getTopProducts(
    orderItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>,
    limit: number = 10,
  ): DashboardStats["topProducts"] {
    const productMap = new Map<
      string,
      {
        id: string;
        name: string;
        sold: number;
        revenue: number;
      }
    >();

    orderItems.forEach((item) => {
      const existing = productMap.get(item.productId);

      if (existing) {
        existing.sold += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        productMap.set(item.productId, {
          id: item.productId,
          name: item.productName,
          sold: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Ventas por categoría
   */
  static getSalesByCategory(
    orderItems: Array<{
      categoryId: string;
      categoryName: string;
      price: number;
      quantity: number;
    }>,
  ): DashboardStats["salesByCategory"] {
    const categoryMap = new Map<string, { name: string; revenue: number }>();

    orderItems.forEach((item) => {
      const existing = categoryMap.get(item.categoryId);
      const revenue = item.price * item.quantity;

      if (existing) {
        existing.revenue += revenue;
      } else {
        categoryMap.set(item.categoryId, {
          name: item.categoryName,
          revenue,
        });
      }
    });

    const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.revenue, 0);

    return Array.from(categoryMap.entries())
      .map(([_, data]) => ({
        category: data.name,
        revenue: data.revenue,
        percentage: total > 0 ? (data.revenue / total) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Timeline de ingresos
   */
  static getRevenueTimeline(
    orders: Array<{ total: number; createdAt: Date }>,
    days: number = 30,
  ): DashboardStats["revenueTimeline"] {
    const timeline = new Map<string, { revenue: number; orders: number }>();

    // Inicializar todos los días
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      timeline.set(dateKey, { revenue: 0, orders: 0 });
    }

    // Agregar datos de órdenes
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      const existing = timeline.get(dateKey);

      if (existing) {
        existing.revenue += order.total;
        existing.orders += 1;
      }
    });

    return Array.from(timeline.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Tasa de conversión
   */
  static calculateConversionRate(data: { visitors: number; orders: number }): {
    rate: number;
    visitors: number;
    orders: number;
  } {
    const rate = data.visitors > 0 ? (data.orders / data.visitors) * 100 : 0;

    return {
      rate,
      visitors: data.visitors,
      orders: data.orders,
    };
  }

  /**
   * Análisis de retención de clientes
   */
  static analyzeCustomerRetention(data: {
    customers: Array<{
      id: string;
      firstOrderDate: Date;
      lastOrderDate: Date;
      totalOrders: number;
    }>;
  }): {
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
  } {
    const newCustomers = data.customers.filter((c) => c.totalOrders === 1).length;
    const returningCustomers = data.customers.filter((c) => c.totalOrders > 1).length;
    const total = data.customers.length;

    const retentionRate = total > 0 ? (returningCustomers / total) * 100 : 0;

    return {
      newCustomers,
      returningCustomers,
      retentionRate,
    };
  }

  /**
   * Logging de agregación
   */
  static logAggregation(data: { type: string; recordsProcessed: number; duration: number }): void {
    logger.info(
      {
        type: "analytics_aggregation",
        aggregationType: data.type,
        recordsProcessed: data.recordsProcessed,
        duration: data.duration,
      },
      `Analytics aggregated: ${data.type}`,
    );
  }
}

export default AnalyticsAggregator;
