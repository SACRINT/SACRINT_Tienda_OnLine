/** Weeks 23-24: Sales Reports */
import { db } from "@/lib/db";

export async function getSalesReport(tenantId: string) {
  const orders = await db.order.findMany({
    where: { tenantId, paymentStatus: "COMPLETED" },
  });
  const total = orders.reduce((sum, o) => sum + Number(o.total), 0);
  return { totalRevenue: total, totalOrders: orders.length };
}
