"use client";

// This is a placeholder for a more robust analytics service.
// In a real app, this would integrate with a library like react-ga4 or directly with gtag.

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const analytics = {
  initialize: () => {
    // Aquí puedes inicializar librerías de analytics, si es necesario.
    // Por ejemplo, cargar scripts de Google Analytics si aún no están.
    // Para Next.js, Google Analytics es a menudo cargado vía Script component en _document.js o layout.
    // Este método podría ser un no-op si la inicialización ya se hace declarativamente.
    console.log("Analytics initialized.");
  },

  trackPageView: (url: string) => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
      });
    }
    console.log("Track Page View:", url);
  },

  trackProductView: (product: { id: string; name: string; price: number }) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'view_item', {
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
        }]
      });
    }
    console.log("Track Product View:", product);
  },

  trackAddToCart: (product: { id: string; name: string; price: number }, quantity: number) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'add_to_cart', {
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: quantity,
        }]
      });
    }
    console.log("Track Add To Cart:", product, "Quantity:", quantity);
  },

  trackRemoveFromCart: (product: { id: string; name: string; price: number; quantity?: number }) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'remove_from_cart', {
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        }]
      });
    }
    console.log("Track Remove From Cart:", product);
  },

  trackWishlistItemAdded: (product: { productId: string; productName: string; productCategory?: string; productPrice: number }) => {
    console.log("Track Wishlist Item Added:", product);
  },

  trackProductShared: (productId: string, method: string) => {
    console.log("Track Product Shared:", productId, "Method:", method);
  },

  trackSearch: (params: { query: string; resultsCount?: number; filters?: Record<string, any> }) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'search', {
        search_term: params.query,
        results_count: params.resultsCount,
        filters: params.filters,
      });
    }
    console.log("Track Search:", params);
  },

  trackFilterUsage: (filters: any) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'view_item_list', {
        item_list_name: 'Filtered Results',
        items: [], // In a real scenario, you'd populate this
        ...filters
      });
    }
    console.log("Track Filter Usage:", filters);
  },

  trackUserSignUp: (method: string, userId?: string) => {
    console.log("Track User Sign Up:", method, userId);
  },

  trackUserLogin: (method: string, userId?: string) => {
    console.log("Track User Login:", method, userId);
  },

  trackUserLogout: (userId?: string) => {
    console.log("Track User Logout:", userId);
  },

  setUserProperties: (properties: Record<string, any>) => {
    console.log("Set User Properties:", properties);
  },

  trackCheckoutStarted: (order: {
    orderId: string;
    total: number;
    items: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    console.log("Track Checkout Started:", order);
  },

  trackShippingInfoAdded: (shippingTier: string, total: number) => {
    console.log("Track Shipping Info Added:", shippingTier, total);
  },

  trackPaymentInfoAdded: (paymentType: string, total: number) => {
    console.log("Track Payment Info Added:", paymentType, total);
  },

  trackPurchaseCompleted: (order: {
    orderId: string;
    total: number;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    console.log("Track Purchase Completed:", order);
  },

  trackOrderRefunded: (orderId: string, amount: number) => {
    console.log("Track Order Refunded:", orderId, amount);
  },

  trackReviewSubmitted: (productId: string, rating: number) => {
    console.log("Track Review Submitted:", productId, rating);
  },

  trackCustomEvent: (eventName: string, params?: Record<string, any>) => {
    console.log("Track Custom Event:", eventName, params);
  },
};

export default analytics;
