/**
 * React Hooks para Analytics
 * Facilita el tracking de eventos en componentes
 */

"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import analytics from "./events";

/**
 * Hook para trackear page views autom�ticamente
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      analytics.trackPageView(url);
    }
  }, [pathname, searchParams]);
}

/**
 * Hook para trackear eventos de producto
 */
export function useProductTracking() {
  const trackView = useCallback(
    (product: { id: string; name: string; category?: string; price: number }) => {
      analytics.trackProductView({
        id: product.id,
        name: product.name,
        price: product.price,
      });
    },
    [],
  );

  const trackAddToCart = useCallback(
    (product: {
      id: string;
      name: string;
      category?: string;
      price: number;
      quantity?: number;
    }) => {
      analytics.trackAddToCart(
        {
          id: product.id,
          name: product.name,
          price: product.price,
        },
        product.quantity || 1,
      );
    },
    [],
  );

  const trackRemoveFromCart = useCallback(
    (product: { id: string; name: string; price: number; quantity?: number }) => {
      analytics.trackRemoveFromCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
      });
    },
    [],
  );

  const trackAddToWishlist = useCallback(
    (product: { id: string; name: string; category?: string; price: number }) => {
      analytics.trackWishlistItemAdded({
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        productPrice: product.price,
      });
    },
    [],
  );

  const trackShare = useCallback((productId: string, method: string) => {
    analytics.trackProductShared(productId, method);
  }, []);

  return {
    trackView,
    trackAddToCart,
    trackRemoveFromCart,
    trackAddToWishlist,
    trackShare,
  };
}

/**
 * Hook para trackear eventos de b�squeda
 */
export function useSearchTracking() {
  const trackSearch = useCallback(
    (query: string, resultsCount?: number, filters?: Record<string, any>) => {
      analytics.trackSearch({
        query,
        resultsCount,
        filters,
      });
    },
    [],
  );

  return { trackSearch };
}

/**
 * Hook para trackear eventos de usuario
 */
export function useUserTracking() {
  const trackSignUp = useCallback((method: string, userId?: string) => {
    analytics.trackUserSignUp(method, userId);
  }, []);

  const trackLogin = useCallback((method: string, userId?: string) => {
    analytics.trackUserLogin(method, userId);
  }, []);

  const trackLogout = useCallback((userId?: string) => {
    analytics.trackUserLogout(userId);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    analytics.setUserProperties(properties);
  }, []);

  return {
    trackSignUp,
    trackLogin,
    trackLogout,
    setUserProperties,
  };
}

/**
 * Hook para trackear eventos de checkout
 */
export function useCheckoutTracking() {
  const trackCheckoutStarted = useCallback(
    (order: {
      orderId: string;
      total: number;
      items: Array<{
        productId: string;
        productName: string;
        price: number;
        quantity: number;
      }>;
    }) => {
      analytics.trackCheckoutStarted(order);
    },
    [],
  );

  const trackShippingInfo = useCallback((shippingTier: string, total: number) => {
    analytics.trackShippingInfoAdded(shippingTier, total);
  }, []);

  const trackPaymentInfo = useCallback((paymentType: string, total: number) => {
    analytics.trackPaymentInfoAdded(paymentType, total);
  }, []);

  const trackPurchase = useCallback(
    (order: {
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
      analytics.trackPurchaseCompleted(order);
    },
    [],
  );

  const trackRefund = useCallback((orderId: string, amount: number) => {
    analytics.trackOrderRefunded(orderId, amount);
  }, []);

  return {
    trackCheckoutStarted,
    trackShippingInfo,
    trackPaymentInfo,
    trackPurchase,
    trackRefund,
  };
}

/**
 * Hook para trackear eventos de reviews
 */
export function useReviewTracking() {
  const trackReview = useCallback((productId: string, rating: number) => {
    analytics.trackReviewSubmitted(productId, rating);
  }, []);

  return { trackReview };
}

/**
 * Hook para eventos personalizados
 */
export function useCustomTracking() {
  const track = useCallback((eventName: string, params?: Record<string, any>) => {
    analytics.trackCustomEvent(eventName, params);
  }, []);

  return { track };
}

/**
 * Hook combinado con todos los m�todos de tracking
 */
export function useAnalytics() {
  const product = useProductTracking();
  const search = useSearchTracking();
  const user = useUserTracking();
  const checkout = useCheckoutTracking();
  const review = useReviewTracking();
  const custom = useCustomTracking();

  return {
    product,
    search,
    user,
    checkout,
    review,
    custom,
  };
}
