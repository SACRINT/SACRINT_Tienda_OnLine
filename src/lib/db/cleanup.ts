// Database Cleanup & Archiving Utilities
// Data retention, archiving, and maintenance

import { db } from "./client";
import { logger } from "@/lib/monitoring/logger";

export interface CleanupResult {
  table: string;
  deletedCount: number;
  archivedCount: number;
  duration: number;
}

// Data retention policies (days)
export const RETENTION_POLICIES = {
  abandonedCarts: 30,
  expiredSessions: 7,
  oldLogs: 90,
  completedOrders: 365 * 2, // 2 years
  deletedUsers: 30,
  expiredCoupons: 90,
  oldNotifications: 60,
};

// Cleanup abandoned carts
export async function cleanupAbandonedCarts(
  tenantId?: string,
): Promise<CleanupResult> {
  const start = Date.now();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.abandonedCarts);

  const where = {
    updatedAt: { lt: cutoffDate },
    ...(tenantId && { tenantId }),
  };

  const result = await db.cart.deleteMany({ where });

  logger.info("Cleaned up abandoned carts", {
    deletedCount: result.count,
    tenantId,
  });

  return {
    table: "Cart",
    deletedCount: result.count,
    archivedCount: 0,
    duration: Date.now() - start,
  };
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<CleanupResult> {
  const start = Date.now();
  const now = new Date();

  const result = await db.session.deleteMany({
    where: { expires: { lt: now } },
  });

  logger.info("Cleaned up expired sessions", {
    deletedCount: result.count,
  });

  return {
    table: "Session",
    deletedCount: result.count,
    archivedCount: 0,
    duration: Date.now() - start,
  };
}

// Cleanup old notifications
export async function cleanupOldNotifications(
  tenantId?: string,
): Promise<CleanupResult> {
  const start = Date.now();
  const cutoffDate = new Date();
  cutoffDate.setDate(
    cutoffDate.getDate() - RETENTION_POLICIES.oldNotifications,
  );

  // Get user IDs for tenant if specified
  let userIds: string[] | undefined;
  if (tenantId) {
    const users = await db.user.findMany({
      where: { tenantId },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  }

  const where = {
    createdAt: { lt: cutoffDate },
    read: true, // Only delete read notifications
    ...(userIds && { userId: { in: userIds } }),
  };

  const result = await db.notification.deleteMany({ where });

  logger.info("Cleaned up old notifications", {
    deletedCount: result.count,
    tenantId,
  });

  return {
    table: "Notification",
    deletedCount: result.count,
    archivedCount: 0,
    duration: Date.now() - start,
  };
}

// Run all cleanup tasks
export async function runFullCleanup(
  tenantId?: string,
): Promise<CleanupResult[]> {
  const results: CleanupResult[] = [];

  try {
    results.push(await cleanupAbandonedCarts(tenantId));
    results.push(await cleanupExpiredSessions());
    results.push(await cleanupOldNotifications(tenantId));

    const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    logger.info("Full cleanup completed", {
      totalDeleted,
      totalDuration,
      tenantId,
    });
  } catch (error) {
    logger.error("Cleanup failed", error as Error, { tenantId });
    throw error;
  }

  return results;
}

// Get database statistics
export async function getDatabaseStats(): Promise<{
  tables: Array<{ name: string; count: number }>;
  totalRecords: number;
}> {
  const [products, orders, users, carts, sessions, notifications] =
    await Promise.all([
      db.product.count(),
      db.order.count(),
      db.user.count(),
      db.cart.count(),
      db.session.count(),
      db.notification.count(),
    ]);

  const tables = [
    { name: "Product", count: products },
    { name: "Order", count: orders },
    { name: "User", count: users },
    { name: "Cart", count: carts },
    { name: "Session", count: sessions },
    { name: "Notification", count: notifications },
  ];

  return {
    tables,
    totalRecords: tables.reduce((sum, t) => sum + t.count, 0),
  };
}
