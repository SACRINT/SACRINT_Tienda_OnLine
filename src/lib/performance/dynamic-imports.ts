/**
 * Dynamic Import Utilities
 * Centralized configuration for code splitting and lazy loading
 */

import dynamic from "next/dynamic";
import { ComponentType } from "react";
import React from "react";

/**
 * Loading component for suspended components
 */
export const LoadingFallback = ({ isLoading }: { isLoading?: boolean } = {}) => {
  if (!isLoading) return null;
  return React.createElement(
    "div",
    { className: "flex h-64 items-center justify-center" },
    React.createElement("div", {
      className: "h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent",
    }),
  );
};

/**
 * Create a dynamically imported component with loading fallback
 */
export function createDynamicComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  },
) {
  return dynamic(importFn, {
    loading: options?.loading || LoadingFallback,
    ssr: options?.ssr ?? true,
  });
}

/**
 * Preload a dynamic component
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Start loading the component
  importFn();
}

/**
 * Common dynamically imported components
 */
export const DynamicComponents = {
  // Heavy components that should be lazy loaded
  ProductGallery: createDynamicComponent(() => import("@/components/product/ProductGallery"), {
    ssr: false,
  }),

  ReviewForm: createDynamicComponent(() => import("@/components/account/ReviewForm"), {
    ssr: false,
  }),

  RefundRequest: createDynamicComponent(() => import("@/components/account/RefundRequest"), {
    ssr: false,
  }),

  SearchAutocomplete: createDynamicComponent(() => import("@/components/shop/SearchAutocomplete"), {
    ssr: false,
  }),

  QuickViewModal: createDynamicComponent(() => import("@/components/shop/QuickViewModal"), {
    ssr: false,
  }),
};
