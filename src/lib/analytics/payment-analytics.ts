/**
 * Payment Analytics Dashboard - Task 13.6
 * Dashboard completo de analítica de pagos
 */

import { db } from "@/lib/db";

export interface PaymentAnalytics {
  totalReceived: number;
  pending: number;
  failed: number;
  refunded: number;
  failedPaymentsPercentage: number;
  refundRate: number;
  paymentMethodDistribution: Array<{ method: string; count: number; percentage: number }>;
  averageTransactionValue: number;
  successRate: number;
}

export async function getPaymentAnalytics(
  tenantId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<PaymentAnalytics> {
  const since = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const until = dateTo || new Date();

  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: since, lte: until },
    },
    select: {
      id: true,
      paymentStatus: true,
      paymentMethod: true,
      total: true,
    },
  });

  const totalReceived = orders
    .filter((o) => o.paymentStatus === "COMPLETED")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const pending = orders.filter((o) => o.paymentStatus === "PENDING").length;
  const failed = orders.filter((o) => o.paymentStatus === "FAILED").length;
  const refunded = orders.filter((o) => o.paymentStatus === "REFUNDED").length;

  const total = orders.length;
  const failedPaymentsPercentage = total > 0 ? (failed / total) * 100 : 0;
  const refundRate = total > 0 ? (refunded / total) * 100 : 0;
  const successRate = total > 0 ? ((total - failed) / total) * 100 : 0;

  // Payment method distribution
  const methodCounts = orders.reduce((acc, o) => {
    const method = o.paymentMethod || "UNKNOWN";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethodDistribution = Object.entries(methodCounts).map(([method, count]) => ({
    method,
    count,
    percentage: (count / total) * 100,
  }));

  const averageTransactionValue = totalReceived / (total - failed || 1);

  return {
    totalReceived: Math.round(totalReceived * 100) / 100,
    pending,
    failed,
    refunded,
    failedPaymentsPercentage: Math.round(failedPaymentsPercentage * 10) / 10,
    refundRate: Math.round(refundRate * 10) / 10,
    paymentMethodDistribution,
    averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
    successRate: Math.round(successRate * 10) / 10,
  };
}

export async function getPaymentTimeline(
  tenantId: string,
  days: number = 30
): Promise<Array<{ date: string; successful: number; failed: number; total: number }>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
      paymentStatus: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailyStats = orders.reduce((acc, order) => {
    const date = order.createdAt.toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = { successful: 0, failed: 0, total: 0 };
    }
    acc[date].total++;
    if (order.paymentStatus === "COMPLETED") acc[date].successful++;
    if (order.paymentStatus === "FAILED") acc[date].failed++;
    return acc;
  }, {} as Record<string, { successful: number; failed: number; total: number }>);

  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}
