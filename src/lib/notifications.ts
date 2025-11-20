/**
 * Notifications Management Library
 * Handles notification storage, retrieval, and formatting
 * Integrates with WebSocket for real-time updates
 */

export type NotificationType =
  | "order"
  | "promo"
  | "success"
  | "warning"
  | "error"
  | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

const STORAGE_KEY = "notifications";
const MAX_NOTIFICATIONS = 100;

/**
 * Get all notifications from localStorage
 */
export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const notifications = JSON.parse(stored);
    return notifications.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    }));
  } catch (error) {
    console.error("Error loading notifications:", error);
    return [];
  }
}

/**
 * Save notifications to localStorage
 */
function saveNotifications(notifications: Notification[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event("notifications-updated"));
  } catch (error) {
    console.error("Error saving notifications:", error);
  }
}

/**
 * Add a new notification
 */
export function addNotification(
  notification: Omit<Notification, "id" | "createdAt" | "read">,
): Notification {
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    read: false,
    createdAt: new Date(),
  };

  const notifications = getNotifications();
  notifications.unshift(newNotification);

  // Keep only the most recent notifications
  const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
  saveNotifications(trimmed);

  window.dispatchEvent(new Event("notification-added"));

  return newNotification;
}

/**
 * Mark notification as read
 */
export function markAsRead(id: string) {
  const notifications = getNotifications();
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  saveNotifications(updated);
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead() {
  const notifications = getNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

/**
 * Delete a notification
 */
export function deleteNotification(id: string) {
  const notifications = getNotifications();
  const filtered = notifications.filter((n) => n.id !== id);
  saveNotifications(filtered);
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("notifications-updated"));
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter((n) => !n.read).length;
}

/**
 * Format notification time
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Request notification permission (for browser notifications)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Show browser notification
 */
export async function showBrowserNotification(
  title: string,
  options?: NotificationOptions,
) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  try {
    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      ...options,
    });
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  email: {
    orders: boolean;
    promotions: boolean;
    newsletter: boolean;
    priceAlerts: boolean;
    stockAlerts: boolean;
  };
  push: {
    orders: boolean;
    promotions: boolean;
    priceAlerts: boolean;
  };
  inApp: {
    orders: boolean;
    promotions: boolean;
    system: boolean;
  };
}

const PREFERENCES_KEY = "notification-preferences";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    orders: true,
    promotions: true,
    newsletter: false,
    priceAlerts: true,
    stockAlerts: true,
  },
  push: {
    orders: true,
    promotions: false,
    priceAlerts: true,
  },
  inApp: {
    orders: true,
    promotions: true,
    system: true,
  },
};

/**
 * Get notification preferences
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save notification preferences
 */
export function saveNotificationPreferences(
  preferences: NotificationPreferences,
) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  return await requestNotificationPermission();
}
