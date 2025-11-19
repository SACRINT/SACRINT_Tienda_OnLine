// Database Optimization Utilities
// Query optimization, caching, and performance monitoring

import { Prisma } from "@prisma/client";

// Optimized select fields for common queries
export const OPTIMIZED_SELECTS = {
  // Product list - minimal fields
  productList: {
    id: true,
    name: true,
    slug: true,
    basePrice: true,
    salePrice: true,
    published: true,
    featured: true,
    images: {
      select: {
        url: true,
        alt: true,
      },
      take: 1,
      orderBy: {
        order: "asc" as const,
      },
    },
    category: {
      select: {
        name: true,
        slug: true,
      },
    },
    _count: {
      select: {
        reviews: true,
      },
    },
  },

  // Product detail - full fields
  productDetail: {
    id: true,
    name: true,
    slug: true,
    description: true,
    basePrice: true,
    salePrice: true,
    sku: true,
    stock: true,
    published: true,
    featured: true,
    categoryId: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    images: {
      select: {
        id: true,
        url: true,
        alt: true,
        order: true,
      },
      orderBy: {
        order: "asc" as const,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    variants: {
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        options: true,
      },
    },
    reviews: {
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc" as const,
      },
      take: 10,
    },
  },

  // Order list
  orderList: {
    id: true,
    orderNumber: true,
    status: true,
    total: true,
    createdAt: true,
    user: {
      select: {
        name: true,
        email: true,
      },
    },
    _count: {
      select: {
        items: true,
      },
    },
  },

  // User profile
  userProfile: {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    tenantId: true,
    createdAt: true,
  },
} as const;

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export function getPaginationArgs(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// Query performance logging
const queryTimes: Map<string, number[]> = new Map();

export function logQueryTime(queryName: string, duration: number) {
  if (process.env.NODE_ENV !== "development") return;

  if (!queryTimes.has(queryName)) {
    queryTimes.set(queryName, []);
  }

  const times = queryTimes.get(queryName)!;
  times.push(duration);

  // Keep only last 100 measurements
  if (times.length > 100) {
    times.shift();
  }

  // Log slow queries
  if (duration > 100) {
    console.warn(`[DB] Slow query "${queryName}": ${duration.toFixed(2)}ms`);
  }
}

export function getQueryStats(queryName: string) {
  const times = queryTimes.get(queryName);
  if (!times || times.length === 0) return null;

  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    count: times.length,
    avg: sum / times.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

// Batch loading helper (avoids N+1)
export async function batchLoad<T, K>(
  keys: K[],
  loader: (keys: K[]) => Promise<Map<K, T>>
): Promise<Map<K, T>> {
  if (keys.length === 0) return new Map();
  return loader(keys);
}

// Common where clauses
export const WHERE_CLAUSES = {
  // Published products for tenant
  publishedProducts: (tenantId: string) => ({
    tenantId,
    published: true,
    stock: { gt: 0 },
  }),

  // Active orders for tenant
  activeOrders: (tenantId: string) => ({
    tenantId,
    status: {
      not: "CANCELLED" as const,
    },
  }),

  // Recent items
  recent: (days: number = 30) => ({
    createdAt: {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    },
  }),
} as const;

// Order by presets
export const ORDER_BY = {
  newest: { createdAt: "desc" as const },
  oldest: { createdAt: "asc" as const },
  priceAsc: { basePrice: "asc" as const },
  priceDesc: { basePrice: "desc" as const },
  nameAsc: { name: "asc" as const },
  nameDesc: { name: "desc" as const },
  popular: { orderCount: "desc" as const },
} as const;

// Transaction helper with retry
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 100, backoff = 2 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry certain errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") throw error; // Unique constraint
        if (error.code === "P2025") throw error; // Record not found
      }

      if (attempt < retries) {
        const waitTime = delay * Math.pow(backoff, attempt);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// Connection pool monitoring
let connectionCount = 0;
const maxConnections = 20;

export function trackConnection(action: "acquire" | "release") {
  if (action === "acquire") {
    connectionCount++;
    if (connectionCount > maxConnections * 0.8) {
      console.warn(`[DB] High connection usage: ${connectionCount}/${maxConnections}`);
    }
  } else {
    connectionCount = Math.max(0, connectionCount - 1);
  }
}

export function getConnectionStats() {
  return {
    current: connectionCount,
    max: maxConnections,
    usage: (connectionCount / maxConnections) * 100,
  };
}

// Query builder helpers
export function buildSearchQuery(
  searchTerm: string,
  fields: string[]
): Prisma.ProductWhereInput {
  if (!searchTerm.trim()) return {};

  const terms = searchTerm.trim().toLowerCase().split(/\s+/);

  return {
    AND: terms.map((term) => ({
      OR: fields.map((field) => ({
        [field]: {
          contains: term,
          mode: "insensitive" as const,
        },
      })),
    })),
  };
}

export function buildFilterQuery(
  filters: Record<string, string | string[] | number | boolean | undefined>
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "") continue;

    switch (key) {
      case "category":
        where.category = { slug: value as string };
        break;
      case "minPrice":
        where.basePrice = { ...where.basePrice, gte: Number(value) };
        break;
      case "maxPrice":
        where.basePrice = { ...where.basePrice, lte: Number(value) };
        break;
      case "inStock":
        if (value === true || value === "true") {
          where.stock = { gt: 0 };
        }
        break;
      case "featured":
        if (value === true || value === "true") {
          where.featured = true;
        }
        break;
      default:
        // Allow custom filters
        break;
    }
  }

  return where;
}
