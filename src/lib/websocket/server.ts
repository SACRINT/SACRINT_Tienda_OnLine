/**
 * WebSocket Server Configuration
 * Handles real-time notifications for orders, inventory, and system events
 */

import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { logger } from "@/lib/monitoring/logger";

export type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_PAID"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "INVENTORY_LOW"
  | "INVENTORY_OUT"
  | "PAYMENT_FAILED"
  | "REFUND_PROCESSED"
  | "NEW_REVIEW"
  | "SYSTEM_ALERT";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  tenantId: string;
  read: boolean;
  createdAt: Date;
}

export interface ServerToClientEvents {
  notification: (notification: Notification) => void;
  "order:created": (data: { orderId: string; total: number }) => void;
  "order:updated": (data: { orderId: string; status: string }) => void;
  "inventory:low": (data: { productId: string; stock: number }) => void;
  "payment:completed": (data: { orderId: string; amount: number }) => void;
  connect_error: (error: Error) => void;
}

export interface ClientToServerEvents {
  subscribe: (tenantId: string) => void;
  unsubscribe: (tenantId: string) => void;
  "notification:read": (notificationId: string) => void;
  "notification:readAll": (tenantId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  tenantId?: string;
  subscribedTenants: Set<string>;
}

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(httpServer: HTTPServer) {
  if (io) {
    logger.warn("WebSocket server already initialized");
    return io;
  }

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Initialize socket data
    socket.data.subscribedTenants = new Set();

    // Handle tenant subscription
    socket.on("subscribe", (tenantId: string) => {
      socket.data.tenantId = tenantId;
      socket.data.subscribedTenants.add(tenantId);
      socket.join(`tenant:${tenantId}`);
      logger.info(`Socket ${socket.id} subscribed to tenant: ${tenantId}`);
    });

    // Handle tenant unsubscription
    socket.on("unsubscribe", (tenantId: string) => {
      socket.data.subscribedTenants.delete(tenantId);
      socket.leave(`tenant:${tenantId}`);
      logger.info(`Socket ${socket.id} unsubscribed from tenant: ${tenantId}`);
    });

    // Handle mark notification as read
    socket.on("notification:read", async (notificationId: string) => {
      logger.info(`Notification marked as read: ${notificationId}`);
      // TODO: Update notification in database
    });

    // Handle mark all notifications as read
    socket.on("notification:readAll", async (tenantId: string) => {
      logger.info(`All notifications marked as read for tenant: ${tenantId}`);
      // TODO: Update all notifications in database
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on("error", (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info("WebSocket server initialized");
  return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer() {
  if (!io) {
    throw new Error(
      "WebSocket server not initialized. Call initializeWebSocketServer first.",
    );
  }
  return io;
}

/**
 * Emit notification to specific tenant
 */
export function emitToTenant(tenantId: string, notification: Notification) {
  if (!io) {
    logger.warn("Cannot emit notification: WebSocket server not initialized");
    return;
  }

  io.to(`tenant:${tenantId}`).emit("notification", notification);
  logger.info(`Notification emitted to tenant ${tenantId}: ${notification.type}`);
}

/**
 * Emit notification to specific user
 */
export function emitToUser(userId: string, notification: Notification) {
  if (!io) {
    logger.warn("Cannot emit notification: WebSocket server not initialized");
    return;
  }

  io.to(`user:${userId}`).emit("notification", notification);
  logger.info(`Notification emitted to user ${userId}: ${notification.type}`);
}

/**
 * Emit order created event
 */
export function emitOrderCreated(
  tenantId: string,
  orderId: string,
  total: number,
) {
  if (!io) return;

  io.to(`tenant:${tenantId}`).emit("order:created", { orderId, total });

  const notification: Notification = {
    id: `order-${orderId}`,
    type: "ORDER_CREATED",
    title: "Nueva orden recibida",
    message: `Nueva orden #${orderId.slice(0, 8)} por $${total.toFixed(2)}`,
    data: { orderId, total },
    tenantId,
    read: false,
    createdAt: new Date(),
  };

  emitToTenant(tenantId, notification);
}

/**
 * Emit order status update
 */
export function emitOrderUpdated(
  tenantId: string,
  orderId: string,
  status: string,
) {
  if (!io) return;

  io.to(`tenant:${tenantId}`).emit("order:updated", { orderId, status });

  const statusMessages: Record<string, string> = {
    PAID: "pagada",
    PROCESSING: "en procesamiento",
    SHIPPED: "enviada",
    DELIVERED: "entregada",
    CANCELLED: "cancelada",
    REFUNDED: "reembolsada",
  };

  const notification: Notification = {
    id: `order-${orderId}-${Date.now()}`,
    type: "ORDER_UPDATED",
    title: "Orden actualizada",
    message: `La orden #${orderId.slice(0, 8)} ha sido ${statusMessages[status] || status}`,
    data: { orderId, status },
    tenantId,
    read: false,
    createdAt: new Date(),
  };

  emitToTenant(tenantId, notification);
}

/**
 * Emit low inventory alert
 */
export function emitLowInventory(
  tenantId: string,
  productId: string,
  productName: string,
  stock: number,
) {
  if (!io) return;

  io.to(`tenant:${tenantId}`).emit("inventory:low", { productId, stock });

  const notification: Notification = {
    id: `inventory-${productId}-${Date.now()}`,
    type: stock === 0 ? "INVENTORY_OUT" : "INVENTORY_LOW",
    title: stock === 0 ? "Producto agotado" : "Inventario bajo",
    message:
      stock === 0
        ? `${productName} está agotado`
        : `${productName} tiene solo ${stock} unidades en stock`,
    data: { productId, productName, stock },
    tenantId,
    read: false,
    createdAt: new Date(),
  };

  emitToTenant(tenantId, notification);
}

/**
 * Emit payment completed event
 */
export function emitPaymentCompleted(
  tenantId: string,
  orderId: string,
  amount: number,
) {
  if (!io) return;

  io.to(`tenant:${tenantId}`).emit("payment:completed", { orderId, amount });

  const notification: Notification = {
    id: `payment-${orderId}-${Date.now()}`,
    type: "ORDER_PAID",
    title: "Pago recibido",
    message: `Pago de $${amount.toFixed(2)} recibido para orden #${orderId.slice(0, 8)}`,
    data: { orderId, amount },
    tenantId,
    read: false,
    createdAt: new Date(),
  };

  emitToTenant(tenantId, notification);
}
