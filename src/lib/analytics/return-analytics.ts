/**
 * Return Analytics - Task 17.11
 * Analytics and reporting for returns
 */

import { db } from "@/lib/db";

export interface ReturnAnalytics {
  totalReturns: number;
  returnRate: number; // Percentage of orders
  totalRefunded: number;
  averageProcessingTime: number; // Days
  returnsByReason: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  returnsByStatus: Array<{
    status: string;
    count: number;
  }>;
  topReturnedProducts: Array<{
    productId: string;
    productName: string;
    returnCount: number;
  }>;
}

export async function getReturnAnalytics(
  tenantId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ReturnAnalytics> {
  const since = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const until = dateTo || new Date();

  // Get all returns in date range
  const returns = await db.returnRequest.findMany({
    where: {
      tenantId,
      createdAt: { gte: since, lte: until },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Get total orders in same period for return rate
  const totalOrders = await db.order.count({
    where: {
      tenantId,
      createdAt: { gte: since, lte: until },
      status: { in: ["DELIVERED", "SHIPPED"] },
    },
  });

  const totalReturns = returns.length;
  const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;

  // Total refunded amount
  const totalRefunded = returns
    .filter((r) => r.status === "REFUNDED")
    .reduce((sum, r) => sum + Number(r.refundAmount), 0);

  // Average processing time (created → refunded)
  const completedReturns = returns.filter(
    (r) => r.status === "REFUNDED" && r.refundedAt
  );
  const averageProcessingTime =
    completedReturns.length > 0
      ? completedReturns.reduce((sum, r) => {
          const days = r.refundedAt
            ? (r.refundedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            : 0;
          return sum + days;
        }, 0) / completedReturns.length
      : 0;

  // Returns by reason
  const reasonCounts = returns.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const returnsByReason = Object.entries(reasonCounts).map(([reason, count]) => ({
    reason,
    count,
    percentage: (count / totalReturns) * 100,
  }));

  // Returns by status
  const statusCounts = returns.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const returnsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Top returned products
  const productCounts = returns.flatMap((r) => r.items).reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = {
        productId: item.productId,
        productName: item.product.name,
        returnCount: 0,
      };
    }
    acc[item.productId].returnCount += item.quantity;
    return acc;
  }, {} as Record<string, { productId: string; productName: string; returnCount: number }>);

  const topReturnedProducts = Object.values(productCounts)
    .sort((a, b) => b.returnCount - a.returnCount)
    .slice(0, 10);

  return {
    totalReturns,
    returnRate: Math.round(returnRate * 10) / 10,
    totalRefunded: Math.round(totalRefunded * 100) / 100,
    averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
    returnsByReason: returnsByReason.sort((a, b) => b.count - a.count),
    returnsByStatus,
    topReturnedProducts,
  };
}
