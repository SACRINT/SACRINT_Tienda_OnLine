// Real-time Configuration

export const REALTIME_CONFIG = {
  // WebSocket URL
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",

  // Reconnection settings
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
  },

  // Heartbeat settings
  heartbeat: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 10000, // 10 seconds to respond
  },

  // Presence settings
  presence: {
    updateInterval: 60000, // 1 minute
    timeout: 120000, // 2 minutes to consider offline
  },

  // Message settings
  message: {
    maxSize: 65536, // 64KB
    queueSize: 100,
  },
};

// Event types
export const REALTIME_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  RECONNECT: "reconnect",
  ERROR: "error",

  // Inventory events
  STOCK_UPDATE: "stock:update",
  PRICE_UPDATE: "price:update",
  PRODUCT_UPDATE: "product:update",

  // Order events
  ORDER_STATUS: "order:status",
  ORDER_CREATED: "order:created",

  // Cart events
  CART_UPDATE: "cart:update",

  // User events
  USER_PRESENCE: "user:presence",
  USER_TYPING: "user:typing",

  // Notification events
  NOTIFICATION: "notification",

  // System events
  SYSTEM_MESSAGE: "system:message",
  MAINTENANCE: "maintenance",
};

// Channel types
export type ChannelType =
  | "tenant"
  | "product"
  | "order"
  | "user"
  | "admin"
  | "public";

// Message priority
export type MessagePriority = "low" | "normal" | "high" | "urgent";
