/**
 * Google Analytics 4 Configuration
 * Track user behavior and conversions
 */

import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isDevelopment = process.env.NODE_ENV === "development";

// Initialize GA4
export const initGA = (): void => {
  if (!GA_MEASUREMENT_ID) {
    console.warn("GA Measurement ID no configurado");
    return;
  }

  if (isDevelopment) {
    console.log("GA4 inicializado en modo desarrollo");
  }

  ReactGA.initialize(GA_MEASUREMENT_ID, {
    testMode: isDevelopment,
    gaOptions: {
      anonymizeIp: true,
      cookieFlags: "SameSite=None;Secure",
    },
  });
};

// Track page views
export const trackPageView = (path: string): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
  });
};

// E-commerce Events

/**
 * Track when user views a product
 */
export const trackProductView = (product: {
  id: string;
  name: string;
  category?: string;
  price: number;
  currency?: string;
  brand?: string;
}): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("view_item", {
    currency: product.currency || "USD",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        item_brand: product.brand,
      },
    ],
  });
};

/**
 * Track when user views product list
 */
export const trackProductListView = (
  products: Array<{
    id: string;
    name: string;
    category?: string;
    price: number;
    position?: number;
  }>,
  listName?: string,
): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("view_item_list", {
    item_list_name: listName || "Product List",
    items: products.map((product, index) => ({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      index: product.position ?? index,
    })),
  });
};

/**
 * Track when user adds product to cart
 */
export const trackAddToCart = (product: {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  currency?: string;
}): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("add_to_cart", {
    currency: product.currency || "USD",
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: product.quantity,
      },
    ],
  });
};

/**
 * Track when user removes product from cart
 */
export const trackRemoveFromCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("remove_from_cart", {
    currency: "USD",
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
      },
    ],
  });
};

/**
 * Track when user views cart
 */
export const trackViewCart = (
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>,
  totalValue: number,
): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("view_cart", {
    currency: "USD",
    value: totalValue,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

/**
 * Track when user begins checkout
 */
export const trackBeginCheckout = (
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>,
  totalValue: number,
): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("begin_checkout", {
    currency: "USD",
    value: totalValue,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

/**
 * Track when user adds shipping info
 */
export const trackAddShippingInfo = (shippingTier: string, totalValue: number): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("add_shipping_info", {
    currency: "USD",
    value: totalValue,
    shipping_tier: shippingTier,
  });
};

/**
 * Track when user adds payment info
 */
export const trackAddPaymentInfo = (paymentType: string, totalValue: number): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("add_payment_info", {
    currency: "USD",
    value: totalValue,
    payment_type: paymentType,
  });
};

/**
 * Track purchase completion
 */
export const trackPurchase = (purchase: {
  transactionId: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  coupon?: string;
  items: Array<{
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
  }>;
}): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("purchase", {
    transaction_id: purchase.transactionId,
    value: purchase.value,
    tax: purchase.tax || 0,
    shipping: purchase.shipping || 0,
    currency: purchase.currency || "USD",
    coupon: purchase.coupon,
    items: purchase.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

/**
 * Track refund
 */
export const trackRefund = (refund: {
  transactionId: string;
  value: number;
  currency?: string;
  items?: Array<{
    id: string;
    quantity: number;
  }>;
}): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("refund", {
    transaction_id: refund.transactionId,
    value: refund.value,
    currency: refund.currency || "USD",
    items: refund.items?.map((item) => ({
      item_id: item.id,
      quantity: item.quantity,
    })),
  });
};

// User Engagement Events

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, resultsCount?: number): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("search", {
    search_term: searchTerm,
    ...(resultsCount !== undefined && { results_count: resultsCount }),
  });
};

/**
 * Track user signup
 */
export const trackSignUp = (method: string): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("sign_up", {
    method,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: string): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("login", {
    method,
  });
};

/**
 * Track when user shares content
 */
export const trackShare = (contentType: string, itemId: string, method: string): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("share", {
    content_type: contentType,
    item_id: itemId,
    method,
  });
};

/**
 * Track when user submits a review
 */
export const trackSubmitReview = (productId: string, rating: number): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("submit_review", {
    product_id: productId,
    rating,
  });
};

/**
 * Track when user adds to wishlist
 */
export const trackAddToWishlist = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("add_to_wishlist", {
    currency: "USD",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      },
    ],
  });
};

/**
 * Track custom event
 */
export const trackEvent = (eventName: string, params?: Record<string, any>): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event(eventName, params);
};

/**
 * Set user ID for cross-device tracking
 */
export const setUserId = (userId: string): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.set({ userId });
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.set(properties);
};

export default {
  initGA,
  trackPageView,
  trackProductView,
  trackProductListView,
  trackAddToCart,
  trackRemoveFromCart,
  trackViewCart,
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
  trackPurchase,
  trackRefund,
  trackSearch,
  trackSignUp,
  trackLogin,
  trackShare,
  trackSubmitReview,
  trackAddToWishlist,
  trackEvent,
  setUserId,
  setUserProperties,
};
