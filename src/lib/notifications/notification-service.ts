/**
 * Notification Service
 *
 * Centralized in-app notification service
 * Supports:
 * - Creating notifications
 * - Marking notifications as read
 * - Deleting notifications
 * - Real-time notification count
 */

import { db } from "@/lib/db";
import { NotificationType } from "@/lib/db/enums";

export interface CreateNotificationOptions {
  userId: string;
  tenantId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Create a notification
 */
export async function createNotification(
  options: CreateNotificationOptions,
): Promise<NotificationResult> {
  try {
    const notification = await db.notification.create({
      data: {
        userId: options.userId,
        tenantId: options.tenantId,
        type: options.type,
        title: options.title,
        message: options.message,
        actionUrl: options.actionUrl,
        metadata: options.metadata,
      },
    });

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error: any) {
    console.error("[Notification Service] Create error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create bulk notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationOptions, "userId">,
): Promise<NotificationResult> {
  try {
    await db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        tenantId: notification.tenantId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
      })),
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[Notification Service] Bulk create error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  },
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options || {};

  const where: any = { userId };
  if (unreadOnly) {
    where.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    hasMore: offset + limit < total,
  };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  try {
    await db.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Notification Service] Mark as read error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
  try {
    await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Notification Service] Mark all as read error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  try {
    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Notification Service] Delete error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
  try {
    await db.notification.deleteMany({
      where: { userId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Notification Service] Delete all error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Get notification statistics for a tenant
 */
export async function getNotificationStats(tenantId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [total, sent, read, byType] = await Promise.all([
    db.notification.count({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
    }),
    db.notification.count({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
    }),
    db.notification.count({
      where: {
        tenantId,
        read: true,
        createdAt: { gte: since },
      },
    }),
    db.notification.groupBy({
      by: ["type"],
      where: {
        tenantId,
        createdAt: { gte: since },
      },
      _count: true,
    }),
  ]);

  return {
    total,
    sent,
    read,
    readRate: sent > 0 ? (read / sent) * 100 : 0,
    byType: byType.map((item: any) => ({
      type: item.type,
      count: item._count,
    })),
  };
}

/**
 * Helper: Create order notification and optionally send email
 */
export async function notifyOrderUpdate(
  userId: string,
  tenantId: string,
  orderId: string,
  type: NotificationType,
  title: string,
  message: string,
  emailTemplate?: any,
) {
  // Create in-app notification
  await createNotification({
    userId,
    tenantId,
    type,
    title,
    message,
    actionUrl: `/account/orders/${orderId}`,
    metadata: { orderId },
  });

  // TODO: Send email if user has email notifications enabled
  // Check user notification preferences
  // Send email using email service
}
