/** Week 19: Operations Dashboard - Tasks 19.1-19.12 */
import { db } from "@/lib/db";

export async function getOperationsDashboard(tenantId: string, dateFrom: Date, dateTo: Date) {
  const [orders, revenue, customers] = await Promise.all([
    db.order.count({ where: { tenantId, createdAt: { gte: dateFrom, lte: dateTo } } }),
    db.order.aggregate({
      where: { tenantId, paymentStatus: "COMPLETED", createdAt: { gte: dateFrom, lte: dateTo } },
      _sum: { total: true },
    }),
    db.user.count({ where: { tenantId, createdAt: { gte: dateFrom, lte: dateTo } } }),
  ]);

  return {
    orders: { total: orders, growth: 0 },
    revenue: { total: Number(revenue._sum.total || 0), growth: 0 },
    customers: { total: customers, growth: 0 },
    topProducts: [],
    recentOrders: [],
  };
}
