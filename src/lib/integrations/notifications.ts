// Notification Service Integration
// Push notifications and in-app messaging

import { z } from "zod";

// Notification schemas
export const NotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string(),
  icon: z.string().optional(),
  image: z.string().url().optional(),
  url: z.string().url().optional(),
  data: z.record(z.string()).optional(),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
  ttl: z.number().optional(), // Time to live in seconds
});

export const NotificationTargetSchema = z.object({
  userId: z.string().optional(),
  tenantId: z.string().optional(),
  token: z.string().optional(),
  topic: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationTarget = z.infer<typeof NotificationTargetSchema>;

// Notification result
export interface NotificationResult {
  id: string;
  success: boolean;
  error?: string;
}

// Subscription types
export interface PushSubscription {
  id: string;
  userId: string;
  tenantId: string;
  token: string;
  platform: "web" | "ios" | "android";
  createdAt: Date;
  lastUsed?: Date;
}

// In-app notification
export interface InAppNotification {
  id: string;
  userId: string;
  tenantId: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  url?: string;
  read: boolean;
  createdAt: Date;
}

// Notification service interface
export interface NotificationService {
  // Push notifications
  send(
    target: NotificationTarget,
    notification: Notification,
  ): Promise<NotificationResult>;
  sendToMany(
    targets: NotificationTarget[],
    notification: Notification,
  ): Promise<NotificationResult[]>;
  sendToTopic(
    topic: string,
    notification: Notification,
  ): Promise<NotificationResult>;

  // Subscriptions
  subscribe(
    userId: string,
    tenantId: string,
    token: string,
    platform: PushSubscription["platform"],
  ): Promise<PushSubscription>;
  unsubscribe(token: string): Promise<void>;
  getSubscriptions(userId: string): Promise<PushSubscription[]>;

  // In-app notifications
  createInApp(
    userId: string,
    tenantId: string,
    notification: Omit<
      InAppNotification,
      "id" | "userId" | "tenantId" | "read" | "createdAt"
    >,
  ): Promise<InAppNotification>;
  getInApp(
    userId: string,
    tenantId: string,
    unreadOnly?: boolean,
  ): Promise<InAppNotification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string, tenantId: string): Promise<void>;
  deleteInApp(notificationId: string): Promise<void>;
}

// Firebase Cloud Messaging implementation
export class FCMNotificationService implements NotificationService {
  private serverKey: string;
  private baseUrl = "https://fcm.googleapis.com/fcm/send";

  // In-memory storage for subscriptions and in-app (use DB in production)
  private subscriptions = new Map<string, PushSubscription>();
  private inAppNotifications = new Map<string, InAppNotification>();

  constructor(serverKey: string) {
    this.serverKey = serverKey;
  }

  async send(
    target: NotificationTarget,
    notification: Notification,
  ): Promise<NotificationResult> {
    const validated = NotificationSchema.parse(notification);

    const message: any = {
      notification: {
        title: validated.title,
        body: validated.body,
        icon: validated.icon,
        image: validated.image,
        click_action: validated.url,
      },
      data: validated.data,
      priority: validated.priority,
    };

    if (validated.ttl) {
      message.time_to_live = validated.ttl;
    }

    if (target.token) {
      message.to = target.token;
    } else if (target.topic) {
      message.to = `/topics/${target.topic}`;
    } else {
      throw new Error("Token or topic required");
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `key=${this.serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        id: "",
        success: false,
        error: `FCM request failed: ${error}`,
      };
    }

    const result = await response.json();

    if (result.failure > 0) {
      return {
        id: result.message_id || "",
        success: false,
        error: result.results?.[0]?.error || "Unknown error",
      };
    }

    return {
      id: result.message_id || result.results?.[0]?.message_id || "",
      success: true,
    };
  }

  async sendToMany(
    targets: NotificationTarget[],
    notification: Notification,
  ): Promise<NotificationResult[]> {
    const validated = NotificationSchema.parse(notification);

    const tokens = targets.filter((t) => t.token).map((t) => t.token as string);

    if (tokens.length === 0) {
      return [];
    }

    const message = {
      registration_ids: tokens,
      notification: {
        title: validated.title,
        body: validated.body,
        icon: validated.icon,
        image: validated.image,
        click_action: validated.url,
      },
      data: validated.data,
      priority: validated.priority,
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `key=${this.serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      return tokens.map(() => ({
        id: "",
        success: false,
        error: "FCM request failed",
      }));
    }

    const result = await response.json();

    return result.results.map((r: any, i: number) => ({
      id: r.message_id || "",
      success: !r.error,
      error: r.error,
    }));
  }

  async sendToTopic(
    topic: string,
    notification: Notification,
  ): Promise<NotificationResult> {
    return this.send({ topic }, notification);
  }

  async subscribe(
    userId: string,
    tenantId: string,
    token: string,
    platform: PushSubscription["platform"],
  ): Promise<PushSubscription> {
    const subscription: PushSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      tenantId,
      token,
      platform,
      createdAt: new Date(),
    };

    this.subscriptions.set(token, subscription);
    return subscription;
  }

  async unsubscribe(token: string): Promise<void> {
    this.subscriptions.delete(token);
  }

  async getSubscriptions(userId: string): Promise<PushSubscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      (s) => s.userId === userId,
    );
  }

  async createInApp(
    userId: string,
    tenantId: string,
    notification: Omit<
      InAppNotification,
      "id" | "userId" | "tenantId" | "read" | "createdAt"
    >,
  ): Promise<InAppNotification> {
    const inApp: InAppNotification = {
      id: `inapp_${Date.now()}`,
      userId,
      tenantId,
      ...notification,
      read: false,
      createdAt: new Date(),
    };

    this.inAppNotifications.set(inApp.id, inApp);
    return inApp;
  }

  async getInApp(
    userId: string,
    tenantId: string,
    unreadOnly: boolean = false,
  ): Promise<InAppNotification[]> {
    return Array.from(this.inAppNotifications.values())
      .filter(
        (n) =>
          n.userId === userId &&
          n.tenantId === tenantId &&
          (!unreadOnly || !n.read),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.inAppNotifications.get(notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    for (const notification of this.inAppNotifications.values()) {
      if (
        notification.userId === userId &&
        notification.tenantId === tenantId
      ) {
        notification.read = true;
      }
    }
  }

  async deleteInApp(notificationId: string): Promise<void> {
    this.inAppNotifications.delete(notificationId);
  }
}

// Mock service for development
class MockNotificationService implements NotificationService {
  private subscriptions = new Map<string, PushSubscription>();
  private inAppNotifications = new Map<string, InAppNotification>();

  async send(
    target: NotificationTarget,
    notification: Notification,
  ): Promise<NotificationResult> {
    console.log("Mock notification sent:", { target, notification });
    return {
      id: `mock_${Date.now()}`,
      success: true,
    };
  }

  async sendToMany(
    targets: NotificationTarget[],
    notification: Notification,
  ): Promise<NotificationResult[]> {
    console.log("Mock notifications sent:", {
      count: targets.length,
      notification,
    });
    return targets.map(() => ({
      id: `mock_${Date.now()}`,
      success: true,
    }));
  }

  async sendToTopic(
    topic: string,
    notification: Notification,
  ): Promise<NotificationResult> {
    console.log("Mock topic notification:", { topic, notification });
    return {
      id: `mock_${Date.now()}`,
      success: true,
    };
  }

  async subscribe(
    userId: string,
    tenantId: string,
    token: string,
    platform: PushSubscription["platform"],
  ): Promise<PushSubscription> {
    const subscription: PushSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      tenantId,
      token,
      platform,
      createdAt: new Date(),
    };

    this.subscriptions.set(token, subscription);
    console.log("Mock subscription created:", subscription);
    return subscription;
  }

  async unsubscribe(token: string): Promise<void> {
    this.subscriptions.delete(token);
    console.log("Mock subscription deleted:", token);
  }

  async getSubscriptions(userId: string): Promise<PushSubscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      (s) => s.userId === userId,
    );
  }

  async createInApp(
    userId: string,
    tenantId: string,
    notification: Omit<
      InAppNotification,
      "id" | "userId" | "tenantId" | "read" | "createdAt"
    >,
  ): Promise<InAppNotification> {
    const inApp: InAppNotification = {
      id: `inapp_${Date.now()}`,
      userId,
      tenantId,
      ...notification,
      read: false,
      createdAt: new Date(),
    };

    this.inAppNotifications.set(inApp.id, inApp);
    console.log("Mock in-app notification created:", inApp);
    return inApp;
  }

  async getInApp(
    userId: string,
    tenantId: string,
    unreadOnly: boolean = false,
  ): Promise<InAppNotification[]> {
    return Array.from(this.inAppNotifications.values())
      .filter(
        (n) =>
          n.userId === userId &&
          n.tenantId === tenantId &&
          (!unreadOnly || !n.read),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.inAppNotifications.get(notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    for (const notification of this.inAppNotifications.values()) {
      if (
        notification.userId === userId &&
        notification.tenantId === tenantId
      ) {
        notification.read = true;
      }
    }
  }

  async deleteInApp(notificationId: string): Promise<void> {
    this.inAppNotifications.delete(notificationId);
  }
}

// Create notification service
export function createNotificationService(): NotificationService {
  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    console.warn("FCM_SERVER_KEY not set, using mock notifications");
    return new MockNotificationService();
  }

  return new FCMNotificationService(serverKey);
}

export const notificationService = createNotificationService();
