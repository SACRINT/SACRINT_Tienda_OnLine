/**
 * Notifications Hook
 * React hook for managing real-time notifications
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  initializeWebSocketClient,
  subscribeToTenant,
  unsubscribeFromTenant,
  markNotificationAsRead as markAsRead,
  markAllNotificationsAsRead as markAllAsRead,
  isWebSocketConnected,
} from "@/lib/websocket/client";
import type { Notification } from "@/lib/websocket/server";

export interface UseNotificationsOptions {
  tenantId: string;
  maxNotifications?: number;
  autoConnect?: boolean;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (notificationId: string) => void;
}

export function useNotifications({
  tenantId,
  maxNotifications = 50,
  autoConnect = true,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!autoConnect || !tenantId) return;

    const socket = initializeWebSocketClient();

    const handleConnect = () => {
      setIsConnected(true);
      subscribeToTenant(tenantId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        return updated.slice(0, maxNotifications);
      });
    };

    const handleOrderCreated = (data: { orderId: string; total: number }) => {
      console.log("[Notification] Order created:", data);
    };

    const handleOrderUpdated = (data: { orderId: string; status: string }) => {
      console.log("[Notification] Order updated:", data);
    };

    const handleInventoryLow = (data: { productId: string; stock: number }) => {
      console.log("[Notification] Low inventory:", data);
    };

    const handlePaymentCompleted = (data: {
      orderId: string;
      amount: number;
    }) => {
      console.log("[Notification] Payment completed:", data);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification", handleNotification);
    socket.on("order:created", handleOrderCreated);
    socket.on("order:updated", handleOrderUpdated);
    socket.on("inventory:low", handleInventoryLow);
    socket.on("payment:completed", handlePaymentCompleted);

    // Check if already connected
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification", handleNotification);
      socket.off("order:created", handleOrderCreated);
      socket.off("order:updated", handleOrderUpdated);
      socket.off("inventory:low", handleInventoryLow);
      socket.off("payment:completed", handlePaymentCompleted);

      if (tenantId) {
        unsubscribeFromTenant(tenantId);
      }
    };
  }, [tenantId, maxNotifications, autoConnect]);

  const addNotification = useCallback(
    (notification: Notification) => {
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        return updated.slice(0, maxNotifications);
      });
    },
    [maxNotifications],
  );

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    markAsRead(notificationId);
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllAsRead(tenantId);
  }, [tenantId]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    clearAll,
    removeNotification,
  };
}
