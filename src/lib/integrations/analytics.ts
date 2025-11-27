// Analytics Integration
// Track events and page views

import { z } from "zod";

// Event schemas
export const EventPropertiesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const TrackEventSchema = z.object({
  name: z.string().min(1),
  properties: EventPropertiesSchema.optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.date().optional(),
});

export const PageViewSchema = z.object({
  path: z.string(),
  title: z.string().optional(),
  referrer: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

export type EventProperties = z.infer<typeof EventPropertiesSchema>;
export type TrackEvent = z.infer<typeof TrackEventSchema>;
export type PageView = z.infer<typeof PageViewSchema>;

// E-commerce events
export interface EcommerceEvent {
  productViewed: {
    productId: string;
    productName: string;
    price: number;
    currency: string;
    category?: string;
  };
  addedToCart: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    currency: string;
  };
  removedFromCart: {
    productId: string;
    productName: string;
  };
  checkoutStarted: {
    cartId: string;
    total: number;
    currency: string;
    itemCount: number;
  };
  orderCompleted: {
    orderId: string;
    total: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
    }>;
  };
  searchPerformed: {
    query: string;
    resultCount: number;
  };
}

// Analytics service interface
export interface AnalyticsService {
  track<K extends keyof EcommerceEvent>(eventName: K, properties: EcommerceEvent[K]): void;
  trackCustom(event: TrackEvent): void;
  page(view: PageView): void;
  identify(userId: string, traits?: Record<string, any>): void;
  reset(): void;
}

// Google Analytics implementation
export class GoogleAnalyticsService implements AnalyticsService {
  private measurementId: string;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
  }

  track<K extends keyof EcommerceEvent>(eventName: K, properties: EcommerceEvent[K]): void {
    if (typeof window === "undefined") return;

    // Map to GA4 events
    const gaEventMap: Record<string, string> = {
      productViewed: "view_item",
      addedToCart: "add_to_cart",
      removedFromCart: "remove_from_cart",
      checkoutStarted: "begin_checkout",
      orderCompleted: "purchase",
      searchPerformed: "search",
    };

    const gaEvent = gaEventMap[eventName] || eventName;

    // @ts-ignore - gtag is loaded globally
    window.gtag?.("event", gaEvent, {
      ...properties,
      send_to: this.measurementId,
    });
  }

  trackCustom(event: TrackEvent): void {
    if (typeof window === "undefined") return;

    // @ts-ignore
    window.gtag?.("event", event.name, {
      ...event.properties,
      send_to: this.measurementId,
    });
  }

  page(view: PageView): void {
    if (typeof window === "undefined") return;

    // @ts-ignore
    window.gtag?.("event", "page_view", {
      page_path: view.path,
      page_title: view.title,
      page_referrer: view.referrer,
      send_to: this.measurementId,
    });
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (typeof window === "undefined") return;

    // @ts-ignore
    window.gtag?.("set", "user_properties", {
      user_id: userId,
      ...traits,
    });
  }

  reset(): void {
    if (typeof window === "undefined") return;

    // @ts-ignore
    window.gtag?.("set", "user_properties", {
      user_id: null,
    });
  }
}

// Server-side analytics (for API tracking)
export class ServerAnalyticsService implements AnalyticsService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  track<K extends keyof EcommerceEvent>(eventName: K, properties: EcommerceEvent[K]): void {
    this.sendEvent({
      name: eventName,
      properties: properties as EventProperties,
      timestamp: new Date(),
    });
  }

  trackCustom(event: TrackEvent): void {
    this.sendEvent(event);
  }

  page(view: PageView): void {
    this.sendEvent({
      name: "page_view",
      properties: view as unknown as EventProperties,
      timestamp: new Date(),
    });
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.sendEvent({
      name: "identify",
      properties: { userId, ...traits },
      timestamp: new Date(),
    });
  }

  reset(): void {
    // No-op for server-side
  }

  private async sendEvent(event: TrackEvent): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/track`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...event,
          timestamp: event.timestamp || new Date(),
        }),
      });
    } catch (error) {
      console.error("Analytics event failed:", error);
    }
  }
}

// Create analytics service
export function createAnalyticsService(): AnalyticsService {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn("GA_MEASUREMENT_ID not set, using mock analytics");
    return new MockAnalyticsService();
  }

  return new GoogleAnalyticsService(measurementId);
}

// Mock service for development
class MockAnalyticsService implements AnalyticsService {
  track<K extends keyof EcommerceEvent>(eventName: K, properties: EcommerceEvent[K]): void {
    console.log("Mock analytics track:", eventName, properties);
  }

  trackCustom(event: TrackEvent): void {
    console.log("Mock analytics trackCustom:", event);
  }

  page(view: PageView): void {
    console.log("Mock analytics page:", view);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    console.log("Mock analytics identify:", userId, traits);
  }

  reset(): void {
    console.log("Mock analytics reset");
  }
}

export const analytics = createAnalyticsService();
