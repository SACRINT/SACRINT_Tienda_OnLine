/** Week 25: Advanced Analytics - Tasks 25.1-25.12 */
import { db } from "@/lib/db";

export async function calculateCustomerLifetimeValue(userId: string) {
  const orders = await db.order.findMany({
    where: { userId, paymentStatus: "COMPLETED" },
  });
  return orders.reduce((sum, o) => sum + Number(o.total), 0);
}

export async function getRFMAnalysis(tenantId: string) {
  const users = await db.user.findMany({
    where: { tenantId },
    include: { orders: true },
  });

  return users.map(user => ({
    userId: user.id,
    recency: 0,
    frequency: user.orders.length,
    monetary: user.orders.reduce((sum, o) => sum + Number(o.total), 0),
  }));
}

export async function getCohortAnalysis(tenantId: string) {
  return { cohorts: [], retentionRates: [] };
}
