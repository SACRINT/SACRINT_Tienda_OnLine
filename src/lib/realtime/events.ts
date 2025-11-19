// Event System
// Pub/sub for real-time events

type EventHandler<T = unknown> = (data: T) => void;

class EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler>> = new Map();

  // Subscribe to event
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);

    return () => this.off(event, handler);
  }

  // Subscribe to event once
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set());
    }
    this.onceHandlers.get(event)!.add(handler as EventHandler);

    return () => this.onceHandlers.get(event)?.delete(handler as EventHandler);
  }

  // Unsubscribe from event
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
    this.onceHandlers.get(event)?.delete(handler as EventHandler);
  }

  // Emit event
  emit<T = unknown>(event: string, data: T): void {
    // Call regular handlers
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error("Event handler error:", error);
      }
    });

    // Call and remove once handlers
    const onceSet = this.onceHandlers.get(event);
    if (onceSet) {
      onceSet.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error("Event handler error:", error);
        }
      });
      onceSet.clear();
    }
  }

  // Remove all handlers for event
  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
      this.onceHandlers.delete(event);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }

  // Get handler count
  listenerCount(event: string): number {
    return (this.handlers.get(event)?.size || 0) + (this.onceHandlers.get(event)?.size || 0);
  }
}

// Global event emitter
export const eventBus = new EventEmitter();

// Typed event helpers
export interface StockUpdateEvent {
  productId: string;
  tenantId: string;
  oldStock: number;
  newStock: number;
}

export interface PriceUpdateEvent {
  productId: string;
  tenantId: string;
  oldPrice: number;
  newPrice: number;
  oldSalePrice?: number;
  newSalePrice?: number;
}

export interface OrderStatusEvent {
  orderId: string;
  tenantId: string;
  userId: string;
  oldStatus: string;
  newStatus: string;
}

export interface NotificationEvent {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
}

export interface PresenceEvent {
  userId: string;
  status: "online" | "away" | "offline";
  lastSeen?: Date;
}

// Event type constants
export const Events = {
  STOCK_UPDATE: "stock:update",
  PRICE_UPDATE: "price:update",
  ORDER_STATUS: "order:status",
  NOTIFICATION: "notification",
  PRESENCE: "presence",
  CART_SYNC: "cart:sync",
  USER_ACTIVITY: "user:activity",
} as const;
