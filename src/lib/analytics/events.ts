/**
 * Sistema Unificado de Eventos de Negocio
 * Integra GA4, Métricas Internas y Logging
 */

import * as GA from "./google-analytics";
import {
  trackProduct,
  trackOrder,
  trackUser,
  trackSearch as trackSearchMetric,
  trackReview,
  trackPayment,
} from "../monitoring/metrics";
import { logger } from "../monitoring/logger";

// Tipos de eventos
export type AnalyticsEvent =
  | "product_viewed"
  | "product_list_viewed"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_viewed"
  | "checkout_started"
  | "shipping_info_added"
  | "payment_info_added"
  | "purchase_completed"
  | "order_refunded"
  | "search_performed"
  | "user_signed_up"
  | "user_logged_in"
  | "user_logged_out"
  | "review_submitted"
  | "wishlist_item_added"
  | "product_shared"
  | "coupon_applied"
  | "newsletter_subscribed";

interface BaseEventData {
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

interface ProductEventData extends BaseEventData {
  productId: string;
  productName: string;
  productCategory?: string;
  productPrice: number;
  quantity?: number;
}

interface OrderEventData extends BaseEventData {
  orderId: string;
  total: number;
  tax?: number;
  shipping?: number;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
}

interface SearchEventData extends BaseEventData {
  query: string;
  resultsCount?: number;
  filters?: Record<string, any>;
}

interface UserEventData extends BaseEventData {
  method?: string;
}

/**
 * Clase principal de Analytics
 */
class AnalyticsService {
  private isInitialized = false;

  /**
   * Inicializar el servicio de analytics
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      GA.initGA();
      this.isInitialized = true;
      logger.info("Analytics service initialized");
    } catch (error) {
      logger.error({ error }, "Failed to initialize analytics");
    }
  }

  /**
   * Eventos de Producto
   */
  trackProductViewed(data: ProductEventData): void {
    try {
      // Google Analytics
      GA.trackProductView({
        id: data.productId,
        name: data.productName,
        category: data.productCategory,
        price: data.productPrice,
      });

      // Métricas internas
      trackProduct("viewed", data.productId);

      // Logging
      logger.debug(
        {
          event: "product_viewed",
          productId: data.productId,
          userId: data.userId,
        },
        "Product viewed",
      );
    } catch (error) {
      logger.error({ error, data }, "Failed to track product view");
    }
  }

  trackProductListViewed(
    products: Array<{
      id: string;
      name: string;
      category?: string;
      price: number;
    }>,
    listName?: string,
  ): void {
    try {
      GA.trackProductListView(products, listName);

      logger.debug(
        {
          event: "product_list_viewed",
          listName,
          productsCount: products.length,
        },
        "Product list viewed",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track product list view");
    }
  }

  trackAddToCart(data: ProductEventData): void {
    try {
      const quantity = data.quantity || 1;

      // Google Analytics
      GA.trackAddToCart({
        id: data.productId,
        name: data.productName,
        category: data.productCategory,
        price: data.productPrice,
        quantity,
      });

      // Métricas internas
      trackProduct("added_to_cart", data.productId, quantity);

      // Logging
      logger.info(
        {
          event: "add_to_cart",
          productId: data.productId,
          quantity,
          userId: data.userId,
        },
        "Product added to cart",
      );
    } catch (error) {
      logger.error({ error, data }, "Failed to track add to cart");
    }
  }

  trackRemoveFromCart(data: ProductEventData): void {
    try {
      const quantity = data.quantity || 1;

      GA.trackRemoveFromCart({
        id: data.productId,
        name: data.productName,
        price: data.productPrice,
        quantity,
      });

      logger.debug(
        {
          event: "remove_from_cart",
          productId: data.productId,
          quantity,
        },
        "Product removed from cart",
      );
    } catch (error) {
      logger.error({ error, data }, "Failed to track remove from cart");
    }
  }

  /**
   * Eventos de Checkout
   */
  trackCheckoutStarted(data: OrderEventData): void {
    try {
      GA.trackBeginCheckout(
        data.items.map((item) => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
        data.total,
      );

      logger.info(
        {
          event: "checkout_started",
          orderId: data.orderId,
          total: data.total,
          itemsCount: data.items.length,
        },
        "Checkout started",
      );
    } catch (error) {
      logger.error({ error, data }, "Failed to track checkout start");
    }
  }

  trackShippingInfoAdded(shippingTier: string, total: number): void {
    try {
      GA.trackAddShippingInfo(shippingTier, total);

      logger.debug(
        {
          event: "shipping_info_added",
          shippingTier,
        },
        "Shipping info added",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track shipping info");
    }
  }

  trackPaymentInfoAdded(paymentType: string, total: number): void {
    try {
      GA.trackAddPaymentInfo(paymentType, total);

      logger.debug(
        {
          event: "payment_info_added",
          paymentType,
        },
        "Payment info added",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track payment info");
    }
  }

  trackPurchaseCompleted(data: OrderEventData & { coupon?: string }): void {
    try {
      // Google Analytics
      GA.trackPurchase({
        transactionId: data.orderId,
        value: data.total,
        tax: data.tax,
        shipping: data.shipping,
        coupon: data.coupon,
        items: data.items.map((item) => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      // Métricas internas
      trackOrder("paid", data.orderId, data.total);
      data.items.forEach((item) => {
        trackProduct("purchased", item.productId, item.quantity);
      });
      trackPayment("succeeded", data.total, "USD");

      // Logging
      logger.info(
        {
          event: "purchase_completed",
          orderId: data.orderId,
          total: data.total,
          itemsCount: data.items.length,
        },
        "Purchase completed",
      );
    } catch (error) {
      logger.error({ error, data }, "Failed to track purchase");
    }
  }

  trackOrderRefunded(orderId: string, amount: number): void {
    try {
      GA.trackRefund({
        transactionId: orderId,
        value: amount,
      });

      trackOrder("cancelled", orderId);
      trackPayment("refunded", amount, "USD");

      logger.info(
        {
          event: "order_refunded",
          orderId,
          amount,
        },
        "Order refunded",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track refund");
    }
  }

  /**
   * Eventos de Búsqueda
   */
  trackSearch(data: SearchEventData): void {
    try {
      GA.trackSearch(data.query, data.resultsCount);
      trackSearchMetric(data.query, data.resultsCount || 0);

      logger.debug(
        {
          event: "search_performed",
          query: data.query,
          resultsCount: data.resultsCount,
          filters: data.filters,
        },
        "Search performed",
      );
    } catch (error) {
      logger.error({ error, data }, "Failed to track search");
    }
  }

  /**
   * Eventos de Usuario
   */
  trackUserSignUp(method: string, userId?: string): void {
    try {
      GA.trackSignUp(method);
      trackUser("signup", userId, method);

      if (userId) {
        GA.setUserId(userId);
      }

      logger.info(
        {
          event: "user_signed_up",
          method,
          userId,
        },
        "User signed up",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track signup");
    }
  }

  trackUserLogin(method: string, userId?: string): void {
    try {
      GA.trackLogin(method);
      trackUser("login", userId, method);

      if (userId) {
        GA.setUserId(userId);
      }

      logger.info(
        {
          event: "user_logged_in",
          method,
          userId,
        },
        "User logged in",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track login");
    }
  }

  trackUserLogout(userId?: string): void {
    try {
      trackUser("logout", userId);

      logger.info(
        {
          event: "user_logged_out",
          userId,
        },
        "User logged out",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track logout");
    }
  }

  /**
   * Eventos de Reseñas
   */
  trackReviewSubmitted(productId: string, rating: number): void {
    try {
      GA.trackSubmitReview(productId, rating);
      trackReview("submitted", productId, rating);

      logger.info(
        {
          event: "review_submitted",
          productId,
          rating,
        },
        "Review submitted",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track review");
    }
  }

  /**
   * Otros Eventos
   */
  trackWishlistItemAdded(data: ProductEventData): void {
    try {
      GA.trackAddToWishlist({
        id: data.productId,
        name: data.productName,
        price: data.productPrice,
        category: data.productCategory,
      });

      logger.debug(
        {
          event: "wishlist_item_added",
          productId: data.productId,
        },
        "Item added to wishlist",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track wishlist add");
    }
  }

  trackProductShared(productId: string, method: string): void {
    try {
      GA.trackShare("product", productId, method);

      logger.debug(
        {
          event: "product_shared",
          productId,
          method,
        },
        "Product shared",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track share");
    }
  }

  /**
   * Evento genérico
   */
  trackCustomEvent(eventName: string, params?: Record<string, any>): void {
    try {
      GA.trackEvent(eventName, params);

      logger.debug(
        {
          event: eventName,
          ...params,
        },
        `Custom event: ${eventName}`,
      );
    } catch (error) {
      logger.error({ error }, "Failed to track custom event");
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    try {
      GA.setUserProperties(properties);

      logger.debug(
        {
          properties,
        },
        "User properties updated",
      );
    } catch (error) {
      logger.error({ error }, "Failed to set user properties");
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string): void {
    try {
      GA.trackPageView(path);

      logger.debug(
        {
          event: "page_view",
          path,
        },
        "Page view",
      );
    } catch (error) {
      logger.error({ error }, "Failed to track page view");
    }
  }
}

// Instancia global del servicio
export const analytics = new AnalyticsService();

export default analytics;
