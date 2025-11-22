/**
 * Performance Optimizer
 * Utilidades para optimización de performance
 */

import { cache } from "../cache/redis-cache";
import { logger } from "../monitoring/logger";

export class PerformanceOptimizer {
  /**
   * Debounce function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Memoize function with cache
   */
  static memoize<T extends (...args: any[]) => Promise<any>>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl: number = 3600,
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator
        ? keyGenerator(...args)
        : `memoize:${func.name}:${JSON.stringify(args)}`;

      const cached = await cache.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await func(...args);
      await cache.set(key, result, { ttl });

      return result;
    }) as T;
  }

  /**
   * Lazy load component
   */
  static lazyLoad<T>(importFunc: () => Promise<T>, timeout: number = 5000): Promise<T> {
    return Promise.race([
      importFunc(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Lazy load timeout")), timeout),
      ),
    ]);
  }

  /**
   * Batch requests
   */
  static createBatcher<T, R>(
    batchFn: (items: T[]) => Promise<R[]>,
    maxBatchSize: number = 100,
    maxWaitTime: number = 50,
  ) {
    let queue: Array<{
      item: T;
      resolve: (value: R) => void;
      reject: (error: any) => void;
    }> = [];
    let timeout: NodeJS.Timeout | null = null;

    const executeBatch = async () => {
      const batch = queue.splice(0, maxBatchSize);

      try {
        const results = await batchFn(batch.map((b) => b.item));
        batch.forEach((b, index) => b.resolve(results[index]));
      } catch (error) {
        batch.forEach((b) => b.reject(error));
      }
    };

    return (item: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        queue.push({ item, resolve, reject });

        if (queue.length >= maxBatchSize) {
          if (timeout) clearTimeout(timeout);
          executeBatch();
        } else if (!timeout) {
          timeout = setTimeout(() => {
            timeout = null;
            executeBatch();
          }, maxWaitTime);
        }
      });
    };
  }

  /**
   * Resource preloader
   */
  static async preloadResources(urls: string[]): Promise<void> {
    const promises = urls.map((url) => {
      return new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = url;
        link.as = this.getResourceType(url);
        link.onload = () => resolve(url);
        link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
        document.head.appendChild(link);
      });
    });

    try {
      await Promise.all(promises);
      logger.info({ count: urls.length }, "Resources preloaded");
    } catch (error) {
      logger.error({ error }, "Failed to preload resources");
    }
  }

  /**
   * Get resource type for preloading
   */
  private static getResourceType(url: string): string {
    if (url.endsWith(".js")) return "script";
    if (url.endsWith(".css")) return "style";
    if (url.match(/\.(jpg|jpeg|png|webp|gif)$/)) return "image";
    if (url.endsWith(".woff2")) return "font";
    return "fetch";
  }

  /**
   * Image lazy loading observer
   */
  static createImageObserver(
    callback?: (entry: IntersectionObserverEntry) => void,
  ): IntersectionObserver {
    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 0.01,
    };

    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute("data-src");
          }

          callback?.(entry);
        }
      });
    }, options);
  }
}

export default PerformanceOptimizer;
