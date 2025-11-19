// Real-time React Hooks
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { wsClient, ConnectionStatus } from "./websocket";
import { eventBus, Events, StockUpdateEvent, PriceUpdateEvent, OrderStatusEvent, NotificationEvent } from "./events";
import { presence, UserPresence } from "./presence";
import { liveUpdates } from "./live-updates";

// WebSocket connection hook
export function useWebSocket(url?: string): {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  send: (type: string, payload: unknown) => boolean;
} {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    const unsubscribe = wsClient.onStatusChange(setStatus);
    setStatus(wsClient.getStatus());
    return unsubscribe;
  }, []);

  const connect = useCallback(() => {
    wsClient.connect(url);
  }, [url]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  const send = useCallback((type: string, payload: unknown) => {
    return wsClient.send(type, payload);
  }, []);

  return { status, connect, disconnect, send };
}

// Auto-connect WebSocket
export function useAutoConnect(userId?: string, tenantId?: string): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    const unsubscribe = wsClient.onStatusChange(setStatus);

    // Connect on mount
    wsClient.connect();

    // Initialize presence if userId provided
    if (userId) {
      presence.init(userId);
    }

    // Initialize live updates if tenantId provided
    if (tenantId) {
      liveUpdates.init(tenantId);
    }

    return () => {
      unsubscribe();
      if (userId) {
        presence.destroy();
      }
      if (tenantId) {
        liveUpdates.destroy();
      }
    };
  }, [userId, tenantId]);

  return status;
}

// Stock update hook
export function useStockUpdate(productId: string): {
  stock: number | null;
  lastUpdate: Date | null;
} {
  const [stock, setStock] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to product
    liveUpdates.subscribeToProduct(productId);

    // Listen for stock updates
    const unsubscribe = eventBus.on<StockUpdateEvent>(
      Events.STOCK_UPDATE,
      (event) => {
        if (event.productId === productId) {
          setStock(event.newStock);
          setLastUpdate(new Date());
        }
      }
    );

    return () => {
      unsubscribe();
      liveUpdates.unsubscribeFromProduct(productId);
    };
  }, [productId]);

  return { stock, lastUpdate };
}

// Price update hook
export function usePriceUpdate(productId: string): {
  price: number | null;
  salePrice: number | null;
  lastUpdate: Date | null;
} {
  const [price, setPrice] = useState<number | null>(null);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    liveUpdates.subscribeToProduct(productId);

    const unsubscribe = eventBus.on<PriceUpdateEvent>(
      Events.PRICE_UPDATE,
      (event) => {
        if (event.productId === productId) {
          setPrice(event.newPrice);
          setSalePrice(event.newSalePrice || null);
          setLastUpdate(new Date());
        }
      }
    );

    return () => {
      unsubscribe();
      liveUpdates.unsubscribeFromProduct(productId);
    };
  }, [productId]);

  return { price, salePrice, lastUpdate };
}

// Order status hook
export function useOrderStatus(orderId: string): {
  status: string | null;
  lastUpdate: Date | null;
} {
  const [status, setStatus] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    liveUpdates.subscribeToOrder(orderId);

    const unsubscribe = eventBus.on<OrderStatusEvent>(
      Events.ORDER_STATUS,
      (event) => {
        if (event.orderId === orderId) {
          setStatus(event.newStatus);
          setLastUpdate(new Date());
        }
      }
    );

    return () => {
      unsubscribe();
      liveUpdates.unsubscribeFromOrder(orderId);
    };
  }, [orderId]);

  return { status, lastUpdate };
}

// Notifications hook
export function useNotifications(): {
  notifications: NotificationEvent[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
} {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = eventBus.on<NotificationEvent>(
      Events.NOTIFICATION,
      (notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
      }
    );

    return unsubscribe;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setReadIds(new Set());
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return { notifications, unreadCount, markAsRead, clearAll };
}

// User presence hook
export function usePresence(userId?: string): UserPresence | null {
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Get initial presence
    setUserPresence(presence.getUserPresence(userId) || null);

    // Listen for updates
    const unsubscribe = eventBus.on(Events.PRESENCE, (event: any) => {
      if (event.userId === userId) {
        setUserPresence({
          userId: event.userId,
          status: event.status,
          lastSeen: event.lastSeen,
        });
      }
    });

    return unsubscribe;
  }, [userId]);

  return userPresence;
}

// Online users hook
export function useOnlineUsers(): UserPresence[] {
  const [users, setUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    // Get initial
    setUsers(presence.getOnlineUsers());

    // Listen for updates
    const unsubscribe = eventBus.on(Events.PRESENCE, () => {
      setUsers(presence.getOnlineUsers());
    });

    return unsubscribe;
  }, []);

  return users;
}

// Typing indicator hook
export function useTyping(channelId: string): {
  isTyping: boolean;
  typingUsers: string[];
  setTyping: (typing: boolean) => void;
} {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for typing events
    const unsubscribe = wsClient.on("user:typing", (message) => {
      const { channelId: msgChannel, userId, isTyping } = message.payload as {
        channelId: string;
        userId: string;
        isTyping: boolean;
      };

      if (msgChannel === channelId) {
        setTypingUsers((prev) => {
          if (isTyping && !prev.includes(userId)) {
            return [...prev, userId];
          }
          if (!isTyping) {
            return prev.filter((id) => id !== userId);
          }
          return prev;
        });
      }
    });

    return unsubscribe;
  }, [channelId]);

  const setTyping = useCallback(
    (typing: boolean) => {
      wsClient.send("user:typing", { channelId, isTyping: typing });

      // Auto-clear typing after 5 seconds
      if (typing) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          wsClient.send("user:typing", { channelId, isTyping: false });
        }, 5000);
      }
    },
    [channelId]
  );

  return {
    isTyping: typingUsers.length > 0,
    typingUsers,
    setTyping,
  };
}

// Event subscription hook
export function useEvent<T = unknown>(
  event: string,
  handler: (data: T) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = eventBus.on<T>(event, (data) => {
      handlerRef.current(data);
    });

    return unsubscribe;
  }, [event]);
}
