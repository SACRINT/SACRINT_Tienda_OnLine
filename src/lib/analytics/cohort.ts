// Cohort Analysis
// Track customer behavior over time

import { db } from "@/lib/db";

export interface CohortData {
  cohortDate: string; // YYYY-MM
  cohortSize: number;
  retention: number[]; // Percentage retained each period
  revenue: number[]; // Revenue per period
}

// Get monthly cohort retention
export async function getCohortRetention(
  tenantId: string,
  months: number = 6
): Promise<CohortData[]> {
  const cohorts: CohortData[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const cohortDate = cohortStart.toISOString().substring(0, 7);

    // Get users who made their first purchase in this month
    const cohortUsers = await db.user.findMany({
      where: {
        tenantId,
        role: "CUSTOMER",
        createdAt: { gte: cohortStart, lte: cohortEnd },
      },
      select: { id: true },
    });

    const cohortSize = cohortUsers.length;
    if (cohortSize === 0) {
      cohorts.push({
        cohortDate,
        cohortSize: 0,
        retention: [],
        revenue: [],
      });
      continue;
    }

    const userIds = cohortUsers.map((u) => u.id);

    // Calculate retention for each subsequent month
    const retention: number[] = [];
    const revenue: number[] = [];

    for (let j = 0; j <= i; j++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i + j, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + j + 1, 0);

      // Count users who made a purchase in this period
      const activeUsers = await db.order.findMany({
        where: {
          tenantId,
          userId: { in: userIds },
          createdAt: { gte: periodStart, lte: periodEnd },
          status: { notIn: ["CANCELLED"] },
        },
        select: { userId: true, total: true },
        distinct: ["userId"],
      });

      const activeCount = activeUsers.length;
      const periodRevenue = activeUsers.reduce((sum, o) => sum + o.total, 0);

      retention.push((activeCount / cohortSize) * 100);
      revenue.push(periodRevenue);
    }

    cohorts.push({
      cohortDate,
      cohortSize,
      retention,
      revenue,
    });
  }

  return cohorts;
}

// Get purchase frequency cohorts
export async function getPurchaseFrequencyCohorts(
  tenantId: string
): Promise<{
  oneTime: number;
  twoToThree: number;
  fourPlus: number;
}> {
  const orderCounts = await db.order.groupBy({
    by: ["userId"],
    where: {
      tenantId,
      status: { notIn: ["CANCELLED"] },
    },
    _count: true,
  });

  let oneTime = 0;
  let twoToThree = 0;
  let fourPlus = 0;

  for (const userOrders of orderCounts) {
    const count = userOrders._count;
    if (count === 1) oneTime++;
    else if (count <= 3) twoToThree++;
    else fourPlus++;
  }

  return { oneTime, twoToThree, fourPlus };
}

// Get average order value by purchase number
export async function getAovByPurchaseNumber(
  tenantId: string,
  maxPurchase: number = 5
): Promise<{ purchaseNumber: number; averageValue: number }[]> {
  const results: { purchaseNumber: number; averageValue: number }[] = [];

  // Get all orders grouped by user with order number
  const userOrders = await db.order.findMany({
    where: {
      tenantId,
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      userId: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by user and number purchases
  const userPurchases: Record<string, number[]> = {};
  for (const order of userOrders) {
    if (!userPurchases[order.userId]) {
      userPurchases[order.userId] = [];
    }
    userPurchases[order.userId].push(order.total);
  }

  // Calculate AOV for each purchase number
  for (let n = 1; n <= maxPurchase; n++) {
    const values: number[] = [];
    for (const purchases of Object.values(userPurchases)) {
      if (purchases.length >= n) {
        values.push(purchases[n - 1]);
      }
    }

    const averageValue =
      values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0;

    results.push({ purchaseNumber: n, averageValue });
  }

  return results;
}

// Get time between purchases
export async function getTimeBetweenPurchases(
  tenantId: string
): Promise<{
  average: number;
  median: number;
  distribution: { range: string; count: number }[];
}> {
  const userOrders = await db.order.findMany({
    where: {
      tenantId,
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      userId: true,
      createdAt: true,
    },
    orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
  });

  // Calculate days between purchases
  const gaps: number[] = [];
  let lastUserId: string | null = null;
  let lastDate: Date | null = null;

  for (const order of userOrders) {
    if (order.userId === lastUserId && lastDate) {
      const days = Math.floor(
        (order.createdAt.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      gaps.push(days);
    }
    lastUserId = order.userId;
    lastDate = order.createdAt;
  }

  if (gaps.length === 0) {
    return {
      average: 0,
      median: 0,
      distribution: [],
    };
  }

  // Calculate statistics
  const average = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const sorted = [...gaps].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Distribution
  const distribution = [
    { range: "0-7 días", count: gaps.filter((g) => g <= 7).length },
    { range: "8-14 días", count: gaps.filter((g) => g > 7 && g <= 14).length },
    { range: "15-30 días", count: gaps.filter((g) => g > 14 && g <= 30).length },
    { range: "31-60 días", count: gaps.filter((g) => g > 30 && g <= 60).length },
    { range: "60+ días", count: gaps.filter((g) => g > 60).length },
  ];

  return { average, median, distribution };
}
