// Push Notifications

import { PUSH_CONFIG } from "./config";

// Check if push is supported
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.log("Push notifications not supported");
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    console.log("Notification permission not granted");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return subscription;
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUSH_CONFIG.vapidPublicKey),
    });

    console.log("Push subscription created:", subscription.endpoint);
    return subscription;
  } catch (error) {
    console.error("Push subscription failed:", error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log("Push unsubscribed");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Push unsubscribe failed:", error);
    return false;
  }
}

// Get current push subscription
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Failed to get push subscription:", error);
    return null;
  }
}

// Show local notification (without push)
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted");
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification(title, {
    icon: PUSH_CONFIG.defaultIcon,
    badge: PUSH_CONFIG.defaultBadge,
    ...options,
  });
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Notification types for the app
export interface AppNotification {
  type: "order" | "promo" | "stock" | "delivery" | "general";
  title: string;
  body: string;
  url?: string;
  image?: string;
  data?: Record<string, unknown>;
}

// Show app-specific notification
export async function showAppNotification(notification: AppNotification): Promise<void> {
  const options: NotificationOptions = {
    body: notification.body,
    icon: PUSH_CONFIG.defaultIcon,
    badge: PUSH_CONFIG.defaultBadge,
    tag: notification.type,
    data: {
      url: notification.url,
      ...notification.data,
    },
    actions: [],
  };

  if (notification.image) {
    options.image = notification.image;
  }

  // Add actions based on type
  switch (notification.type) {
    case "order":
      options.actions = [
        { action: "view", title: "Ver pedido" },
      ];
      break;
    case "promo":
      options.actions = [
        { action: "shop", title: "Comprar ahora" },
      ];
      break;
    case "stock":
      options.actions = [
        { action: "view", title: "Ver producto" },
      ];
      break;
  }

  await showNotification(notification.title, options);
}
