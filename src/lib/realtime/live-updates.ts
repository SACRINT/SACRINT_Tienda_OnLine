// Live Updates Manager
// Real-time inventory, prices, and order updates

import { wsClient } from "./websocket";
import { eventBus, Events, StockUpdateEvent, PriceUpdateEvent, OrderStatusEvent } from "./events";
import { REALTIME_EVENTS } from "./config";

class LiveUpdatesManager {
  private subscribedProducts: Set<string> = new Set();
  private subscribedOrders: Set<string> = new Set();
  private tenantId: string | null = null;

  // Initialize with tenant
  init(tenantId: string): void {
    this.tenantId = tenantId;
    this.setupHandlers();
  }

  // Subscribe to product updates
  subscribeToProduct(productId: string): void {
    if (!this.subscribedProducts.has(productId)) {
      this.subscribedProducts.add(productId);
      wsClient.send("subscribe", {
        channel: "product:" + productId,
        tenantId: this.tenantId,
      });
    }
  }

  // Unsubscribe from product updates
  unsubscribeFromProduct(productId: string): void {
    if (this.subscribedProducts.has(productId)) {
      this.subscribedProducts.delete(productId);
      wsClient.send("unsubscribe", {
        channel: "product:" + productId,
      });
    }
  }

  // Subscribe to order updates
  subscribeToOrder(orderId: string): void {
    if (!this.subscribedOrders.has(orderId)) {
      this.subscribedOrders.add(orderId);
      wsClient.send("subscribe", {
        channel: "order:" + orderId,
        tenantId: this.tenantId,
      });
    }
  }

  // Unsubscribe from order updates
  unsubscribeFromOrder(orderId: string): void {
    if (this.subscribedOrders.has(orderId)) {
      this.subscribedOrders.delete(orderId);
      wsClient.send("unsubscribe", {
        channel: "order:" + orderId,
      });
    }
  }

  // Subscribe to all tenant updates
  subscribeToTenant(): void {
    if (this.tenantId) {
      wsClient.send("subscribe", {
        channel: "tenant:" + this.tenantId,
      });
    }
  }

  // Get subscribed products
  getSubscribedProducts(): string[] {
    return Array.from(this.subscribedProducts);
  }

  // Get subscribed orders
  getSubscribedOrders(): string[] {
    return Array.from(this.subscribedOrders);
  }

  // Cleanup
  destroy(): void {
    this.subscribedProducts.forEach((productId) => {
      this.unsubscribeFromProduct(productId);
    });
    this.subscribedOrders.forEach((orderId) => {
      this.unsubscribeFromOrder(orderId);
    });
    this.tenantId = null;
  }

  // Private methods
  private setupHandlers(): void {
    // Stock updates
    wsClient.on(REALTIME_EVENTS.STOCK_UPDATE, (message) => {
      const data = message.payload as StockUpdateEvent;
      eventBus.emit(Events.STOCK_UPDATE, data);
    });

    // Price updates
    wsClient.on(REALTIME_EVENTS.PRICE_UPDATE, (message) => {
      const data = message.payload as PriceUpdateEvent;
      eventBus.emit(Events.PRICE_UPDATE, data);
    });

    // Order status updates
    wsClient.on(REALTIME_EVENTS.ORDER_STATUS, (message) => {
      const data = message.payload as OrderStatusEvent;
      eventBus.emit(Events.ORDER_STATUS, data);
    });

    // General product updates
    wsClient.on(REALTIME_EVENTS.PRODUCT_UPDATE, (message) => {
      const data = message.payload as { productId: string; updates: Record<string, unknown> };
      eventBus.emit("product:update", data);
    });
  }
}

// Singleton instance
export const liveUpdates = new LiveUpdatesManager();

// Helper functions for common operations

// Format stock status
export function formatStockStatus(stock: number): {
  status: "in_stock" | "low_stock" | "out_of_stock";
  label: string;
  color: string;
} {
  if (stock === 0) {
    return {
      status: "out_of_stock",
      label: "Agotado",
      color: "red",
    };
  }

  if (stock <= 5) {
    return {
      status: "low_stock",
      label: "Quedan " + stock,
      color: "yellow",
    };
  }

  return {
    status: "in_stock",
    label: "Disponible",
    color: "green",
  };
}

// Format price change
export function formatPriceChange(
  oldPrice: number,
  newPrice: number
): {
  direction: "up" | "down" | "same";
  percentage: number;
  formatted: string;
} {
  if (oldPrice === newPrice) {
    return {
      direction: "same",
      percentage: 0,
      formatted: "Sin cambio",
    };
  }

  const diff = newPrice - oldPrice;
  const percentage = Math.abs((diff / oldPrice) * 100);

  return {
    direction: diff > 0 ? "up" : "down",
    percentage: Math.round(percentage * 10) / 10,
    formatted: (diff > 0 ? "+" : "-") + percentage.toFixed(1) + "%",
  };
}
