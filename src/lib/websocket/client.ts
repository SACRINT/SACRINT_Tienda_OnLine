/**
 * WebSocket Client Configuration
 * Manages client-side connection to real-time notification server
 */

"use client";

import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "./server";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Initialize WebSocket client connection
 */
export function initializeWebSocketClient(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  if (socket?.connected) {
    return socket;
  }

  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  socket = io(url, {
    path: "/api/socket",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("[WebSocket] Connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[WebSocket] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[WebSocket] Connection error:", error);
  });

  return socket;
}

/**
 * Get current WebSocket client instance
 */
export function getWebSocketClient():
  | Socket<ServerToClientEvents, ClientToServerEvents>
  | null {
  return socket;
}

/**
 * Subscribe to tenant notifications
 */
export function subscribeToTenant(tenantId: string) {
  if (!socket || !socket.connected) {
    console.warn("[WebSocket] Cannot subscribe: not connected");
    return;
  }

  socket.emit("subscribe", tenantId);
  console.log(`[WebSocket] Subscribed to tenant: ${tenantId}`);
}

/**
 * Unsubscribe from tenant notifications
 */
export function unsubscribeFromTenant(tenantId: string) {
  if (!socket || !socket.connected) {
    return;
  }

  socket.emit("unsubscribe", tenantId);
  console.log(`[WebSocket] Unsubscribed from tenant: ${tenantId}`);
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string) {
  if (!socket || !socket.connected) {
    console.warn("[WebSocket] Cannot mark as read: not connected");
    return;
  }

  socket.emit("notification:read", notificationId);
}

/**
 * Mark all notifications as read for tenant
 */
export function markAllNotificationsAsRead(tenantId: string) {
  if (!socket || !socket.connected) {
    console.warn("[WebSocket] Cannot mark all as read: not connected");
    return;
  }

  socket.emit("notification:readAll", tenantId);
}

/**
 * Disconnect WebSocket client
 */
export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[WebSocket] Disconnected manually");
  }
}

/**
 * Check if WebSocket is connected
 */
export function isWebSocketConnected(): boolean {
  return socket?.connected ?? false;
}
