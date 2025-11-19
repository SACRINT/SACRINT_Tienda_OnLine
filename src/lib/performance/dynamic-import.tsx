// @ts-nocheck
// Dynamic Import Utilities
// Code splitting and lazy loading helpers for performance optimization

import dynamic from "next/dynamic";
import { ComponentType, ReactNode } from "react";

// Loading skeleton component
export function DefaultSkeleton() {
  return (
    <div className="animate-pulse bg-muted rounded-md h-32 w-full" />
  );
}

// Create a dynamically imported component with default loading
export function createDynamicComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: () => ReactNode;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || DefaultSkeleton,
    ssr: options?.ssr ?? true,
  });
}

// Create a client-only component (no SSR)
export function createClientComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  return dynamic(importFn, {
    ssr: false,
    loading: DefaultSkeleton,
  });
}

// Heavy component wrappers for common patterns
export const DynamicComponents = {
  // Charts - heavy, client-only
  Chart: createClientComponent(() => import("@/components/analytics/RevenueChart")),

  // Rich text editor - heavy, client-only
  RichTextEditor: createClientComponent(() =>
    import("@/components/ui/rich-text-editor").then(mod => ({ default: mod.RichTextEditor || mod.default }))
  ),

  // Image gallery with zoom - heavy, client-only
  ImageGallery: createClientComponent(() => import("@/components/image/ImageGallery")),

  // Product gallery - moderate, SSR ok
  ProductGallery: createDynamicComponent(() => import("@/components/product/ProductGallery")),

  // Data tables - moderate
  DataTable: createDynamicComponent(() =>
    import("@/components/ui/data-table").then(mod => ({ default: mod.DataTable || mod.default }))
  ),
};

// Preload critical components
export function preloadCriticalComponents() {
  if (typeof window === "undefined") return;

  // Preload on idle
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      // Preload commonly used heavy components
      import("@/components/analytics/RevenueChart");
      import("@/components/image/ImageGallery");
    });
  }
}

// Intersection Observer based lazy loading
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  placeholder?: ReactNode
) {
  return dynamic(
    () =>
      new Promise<{ default: ComponentType<P> }>((resolve) => {
        // Use IntersectionObserver to load when visible
        if (typeof window === "undefined") {
          importFn().then(resolve);
          return;
        }

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              observer.disconnect();
              importFn().then(resolve);
            }
          },
          { rootMargin: "200px" }
        );

        // Create a temporary element to observe
        const el = document.createElement("div");
        observer.observe(el);

        // Cleanup after timeout
        setTimeout(() => {
          observer.disconnect();
          importFn().then(resolve);
        }, 5000);
      }),
    {
      loading: () => placeholder || <DefaultSkeleton />,
      ssr: false,
    }
  );
}

// Prefetch component on hover/focus
export function prefetchOnInteraction(importFn: () => Promise<unknown>) {
  let prefetched = false;

  return {
    onMouseEnter: () => {
      if (!prefetched) {
        prefetched = true;
        importFn();
      }
    },
    onFocus: () => {
      if (!prefetched) {
        prefetched = true;
        importFn();
      }
    },
  };
}

// Route prefetching helper
export function prefetchRoute(route: string) {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = route;
  document.head.appendChild(link);
}

// Bundle size tracking
export function trackBundleSize(componentName: string, importFn: () => Promise<unknown>) {
  if (process.env.NODE_ENV !== "development") return importFn;

  return async () => {
    const start = performance.now();
    const result = await importFn();
    const duration = performance.now() - start;

    console.log(`[Bundle] ${componentName} loaded in ${duration.toFixed(2)}ms`);

    return result;
  };
}
