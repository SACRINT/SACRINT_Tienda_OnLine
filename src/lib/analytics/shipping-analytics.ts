/**
 * Shipping Analytics - Task 16.12
 * Analytics and reporting for shipping operations
 */

import { db } from "@/lib/db";

export interface ShippingAnalytics {
  totalShippingCost: number;
  averageCostPerOrder: number;
  costByCarrier: Array<{
    carrier: string;
    totalCost: number;
    orderCount: number;
    averageCost: number;
  }>;
  costByZone: Array<{
    zone: string;
    totalCost: number;
    orderCount: number;
  }>;
  deliveryPerformance: {
    onTime: number;
    delayed: number;
    averageDeliveryDays: number;
  };
  exceptions: {
    total: number;
    byType: Array<{
      type: string;
      count: number;
    }>;
  };
  returnRate: number;
  periodComparison?: {
    costChange: number; // Percentage
    volumeChange: number; // Percentage
  };
}

export async function getShippingAnalytics(
  tenantId: string,
  dateFrom?: Date,
  dateTo?: Date,
): Promise<ShippingAnalytics> {
  const since = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const until = dateTo || new Date();

  // Get all shipping labels in date range
  const labels = await db.shippingLabel.findMany({
    where: {
      tenantId,
      createdAt: { gte: since, lte: until },
    },
    include: {
      order: {
        include: {
          shippingAddress: true,
        },
      },
    },
  });

  // Calculate total shipping cost
  const totalShippingCost = labels
    .filter((l) => !l.isReturnLabel)
    .reduce((sum, l) => sum + Number(l.cost), 0);

  const orderCount = labels.filter((l) => !l.isReturnLabel).length;
  const averageCostPerOrder = orderCount > 0 ? totalShippingCost / orderCount : 0;

  // Cost by carrier
  const carrierStats = labels
    .filter((l) => !l.isReturnLabel)
    .reduce(
      (acc, label) => {
        const carrier = label.provider;
        if (!acc[carrier]) {
          acc[carrier] = { totalCost: 0, orderCount: 0 };
        }
        acc[carrier].totalCost += Number(label.cost);
        acc[carrier].orderCount += 1;
        return acc;
      },
      {} as Record<string, { totalCost: number; orderCount: number }>,
    );

  const costByCarrier = Object.entries(carrierStats).map(([carrier, stats]) => ({
    carrier,
    totalCost: Math.round(stats.totalCost * 100) / 100,
    orderCount: stats.orderCount,
    averageCost: Math.round((stats.totalCost / stats.orderCount) * 100) / 100,
  }));

  // Cost by zone (based on ZIP code prefix)
  const zoneStats = labels
    .filter((l) => !l.isReturnLabel)
    .reduce(
      (acc, label) => {
        const zipCode = label.order.shippingAddress.postalCode;
        const zone = getZoneFromZipCode(zipCode);
        if (!acc[zone]) {
          acc[zone] = { totalCost: 0, orderCount: 0 };
        }
        acc[zone].totalCost += Number(label.cost);
        acc[zone].orderCount += 1;
        return acc;
      },
      {} as Record<string, { totalCost: number; orderCount: number }>,
    );

  const costByZone = Object.entries(zoneStats).map(([zone, stats]) => ({
    zone,
    totalCost: Math.round(stats.totalCost * 100) / 100,
    orderCount: stats.orderCount,
  }));

  // Delivery performance
  const deliveredLabels = labels.filter((l) => l.status === "delivered" && !l.isReturnLabel);
  const onTime = deliveredLabels.filter((l) => {
    const deliveryTime = l.lastUpdate.getTime() - l.createdAt.getTime();
    const days = deliveryTime / (1000 * 60 * 60 * 24);
    return days <= 5; // Assuming 5 days is "on time"
  }).length;

  const delayed = deliveredLabels.length - onTime;

  const averageDeliveryDays =
    deliveredLabels.length > 0
      ? deliveredLabels.reduce((sum, l) => {
          const days = (l.lastUpdate.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / deliveredLabels.length
      : 0;

  // Exceptions
  const exceptionLabels = labels.filter((l) => l.status === "exception");
  const exceptionsByType = exceptionLabels.reduce(
    (acc, label) => {
      const events = (label.trackingEvents as any)?.events || [];
      const lastEvent = events[events.length - 1];
      const type = lastEvent?.message || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const exceptions = {
    total: exceptionLabels.length,
    byType: Object.entries(exceptionsByType).map(([type, count]) => ({ type, count })),
  };

  // Return rate
  const returnLabels = labels.filter((l) => l.isReturnLabel);
  const returnRate = orderCount > 0 ? (returnLabels.length / orderCount) * 100 : 0;

  return {
    totalShippingCost: Math.round(totalShippingCost * 100) / 100,
    averageCostPerOrder: Math.round(averageCostPerOrder * 100) / 100,
    costByCarrier,
    costByZone,
    deliveryPerformance: {
      onTime,
      delayed,
      averageDeliveryDays: Math.round(averageDeliveryDays * 10) / 10,
    },
    exceptions,
    returnRate: Math.round(returnRate * 10) / 10,
  };
}

function getZoneFromZipCode(zipCode: string): string {
  const prefix = zipCode.slice(0, 2);

  // Mexican ZIP code zones
  const zones: Record<string, string> = {
    "01": "NORTH",
    "02": "NORTH",
    "06": "CENTRAL",
    "44": "WEST",
    "64": "NORTH",
    "77": "SOUTH",
    "80": "NORTHWEST",
    // ... more zones
  };

  return zones[prefix] || "OTHER";
}

// Compare current period with previous period
export async function getShippingTrends(
  tenantId: string,
  currentStart: Date,
  currentEnd: Date,
): Promise<{
  current: ShippingAnalytics;
  previous: ShippingAnalytics;
  changes: {
    costChange: number;
    volumeChange: number;
    efficiencyChange: number;
  };
}> {
  const periodLength = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - periodLength);
  const previousEnd = currentStart;

  const current = await getShippingAnalytics(tenantId, currentStart, currentEnd);
  const previous = await getShippingAnalytics(tenantId, previousStart, previousEnd);

  const costChange =
    previous.totalShippingCost > 0
      ? ((current.totalShippingCost - previous.totalShippingCost) / previous.totalShippingCost) *
        100
      : 0;

  const currentVolume = current.costByCarrier.reduce((sum, c) => sum + c.orderCount, 0);
  const previousVolume = previous.costByCarrier.reduce((sum, c) => sum + c.orderCount, 0);
  const volumeChange =
    previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;

  const efficiencyChange =
    previous.averageCostPerOrder > 0
      ? ((current.averageCostPerOrder - previous.averageCostPerOrder) /
          previous.averageCostPerOrder) *
        100
      : 0;

  return {
    current,
    previous,
    changes: {
      costChange: Math.round(costChange * 10) / 10,
      volumeChange: Math.round(volumeChange * 10) / 10,
      efficiencyChange: Math.round(efficiencyChange * 10) / 10,
    },
  };
}
