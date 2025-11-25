/**
 * Database Query Optimization Utilities
 * Helpers for preventing N+1 queries and optimizing database access
 */

import { Prisma } from "@prisma/client";

/**
 * Common includes to prevent N+1 queries
 */
export const OPTIMIZED_INCLUDES = {
  product: {
    images: {
      take: 5,
      orderBy: { order: "asc" as const },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    variants: {
      where: { stock: { gt: 0 } },
      take: 10,
    },
  },

  order: {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              take: 1,
              select: { url: true },
            },
          },
        },
        variant: true,
      },
    },
    shippingAddress: true,
    billingAddress: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
  },

  review: {
    user: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
    product: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  },
} as const;

/**
 * Optimized select fields for list views
 */
export const OPTIMIZED_SELECTS = {
  productList: {
    id: true,
    name: true,
    slug: true,
    price: true,
    compareAtPrice: true,
    stock: true,
    featured: true,
    images: {
      take: 1,
      select: { url: true, alt: true },
    },
    category: {
      select: { name: true, slug: true },
    },
    _count: {
      select: { reviews: true },
    },
  },

  orderList: {
    id: true,
    orderNumber: true,
    status: true,
    paymentStatus: true,
    total: true,
    createdAt: true,
    _count: {
      select: { items: true },
    },
  },

  userProfile: {
    id: true,
    name: true,
    email: true,
    phone: true,
    image: true,
    createdAt: true,
  },
} as const;

/**
 * Pagination helper with optimized queries
 */
export function getPaginationParams(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return { skip, take };
}

/**
 * Build cursor-based pagination for better performance
 */
export function getCursorPagination(cursor?: string, pageSize: number = 20) {
  return cursor
    ? {
        take: pageSize,
        skip: 1, // Skip the cursor
        cursor: { id: cursor },
      }
    : {
        take: pageSize,
      };
}

/**
 * Batch load entities to prevent N+1
 */
export async function batchLoad<T, K>(
  items: T[],
  getKey: (item: T) => K,
  loader: (keys: K[]) => Promise<Map<K, any>>,
): Promise<Map<T, any>> {
  const keys = items.map(getKey);
  const uniqueKeys = Array.from(new Set(keys));
  const loadedMap = await loader(uniqueKeys);

  const result = new Map<T, any>();
  items.forEach((item) => {
    const key = getKey(item);
    result.set(item, loadedMap.get(key));
  });

  return result;
}

/**
 * Query performance monitoring
 */
export class QueryTimer {
  private start: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.start = Date.now();
  }

  end() {
    const duration = Date.now() - this.start;
    if (duration > 1000) {
      console.warn(`[PERF] Slow query: ${this.name} took ${duration}ms`);
    }
    return duration;
  }
}

/**
 * Wrap query with timing
 */
export async function timedQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
  const timer = new QueryTimer(name);
  try {
    const result = await queryFn();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}
