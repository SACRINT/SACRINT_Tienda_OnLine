// Query Optimization
// Database query optimization utilities

import { z } from "zod";

// Pagination options
export const PaginationSchema = z.object({
  page: z.number().positive().default(1),
  pageSize: z.number().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export type PaginationOptions = z.infer<typeof PaginationSchema>;

// Paginated result
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

// Sorting options
export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

// Query builder for Prisma
export class QueryBuilder<T> {
  private where: any = {};
  private orderBy: any[] = [];
  private include: any = {};
  private select: any = {};
  private skip: number = 0;
  private take: number = 20;

  // Add where condition
  filter(field: string, value: any): this {
    this.where[field] = value;
    return this;
  }

  // Add multiple filters
  filters(conditions: Record<string, any>): this {
    this.where = { ...this.where, ...conditions };
    return this;
  }

  // Add contains search
  search(field: string, value: string): this {
    this.where[field] = { contains: value, mode: "insensitive" };
    return this;
  }

  // Add range filter
  range(field: string, min?: number, max?: number): this {
    const condition: any = {};
    if (min !== undefined) condition.gte = min;
    if (max !== undefined) condition.lte = max;
    this.where[field] = condition;
    return this;
  }

  // Add sorting
  sort(field: string, direction: "asc" | "desc" = "asc"): this {
    this.orderBy.push({ [field]: direction });
    return this;
  }

  // Add multiple sorts
  sorts(options: SortOption[]): this {
    for (const opt of options) {
      this.sort(opt.field, opt.direction);
    }
    return this;
  }

  // Add include for relations
  with(relation: string, config?: any): this {
    this.include[relation] = config || true;
    return this;
  }

  // Select specific fields
  only(fields: string[]): this {
    for (const field of fields) {
      this.select[field] = true;
    }
    return this;
  }

  // Pagination
  paginate(options: PaginationOptions): this {
    this.skip = (options.page - 1) * options.pageSize;
    this.take = options.pageSize;
    return this;
  }

  // Build Prisma query args
  build(): {
    where: any;
    orderBy: any;
    include?: any;
    select?: any;
    skip: number;
    take: number;
  } {
    const query: any = {
      where: this.where,
      orderBy: this.orderBy.length > 0 ? this.orderBy : undefined,
      skip: this.skip,
      take: this.take,
    };

    if (Object.keys(this.include).length > 0) {
      query.include = this.include;
    }

    if (Object.keys(this.select).length > 0) {
      query.select = this.select;
    }

    return query;
  }
}

// Create query builder
export function query<T>(): QueryBuilder<T> {
  return new QueryBuilder<T>();
}

// Batch loader for N+1 prevention
export class BatchLoader<K, V> {
  private batch = new Map<
    K,
    {
      resolve: (value: V | null) => void;
      reject: (error: Error) => void;
    }[]
  >();
  private loader: (keys: K[]) => Promise<Map<K, V>>;
  private maxBatchSize: number;
  private delay: number;
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    loader: (keys: K[]) => Promise<Map<K, V>>,
    options: { maxBatchSize?: number; delay?: number } = {},
  ) {
    this.loader = loader;
    this.maxBatchSize = options.maxBatchSize || 100;
    this.delay = options.delay || 0;
  }

  async load(key: K): Promise<V | null> {
    return new Promise((resolve, reject) => {
      if (!this.batch.has(key)) {
        this.batch.set(key, []);
      }
      this.batch.get(key)!.push({ resolve, reject });

      // Schedule batch execution
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.execute(), this.delay);
      }

      // Execute immediately if batch is full
      if (this.batch.size >= this.maxBatchSize) {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.execute();
      }
    });
  }

  async loadMany(keys: K[]): Promise<(V | null)[]> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  private async execute(): Promise<void> {
    this.timeout = null;
    const batch = this.batch;
    this.batch = new Map();

    const keys = Array.from(batch.keys());

    try {
      const results = await this.loader(keys);

      for (const [key, callbacks] of batch.entries()) {
        const value = results.get(key) || null;
        for (const { resolve } of callbacks) {
          resolve(value);
        }
      }
    } catch (error) {
      for (const callbacks of batch.values()) {
        for (const { reject } of callbacks) {
          reject(error as Error);
        }
      }
    }
  }

  // Clear the cache
  clear(): void {
    this.batch.clear();
  }
}

// Create paginated result
export function paginate<T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / options.pageSize);

  return {
    data,
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  };
}

// Cursor-based pagination helper
export function cursorPaginate<T extends { id: string }>(
  data: T[],
  pageSize: number,
): {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
} {
  const hasMore = data.length > pageSize;
  const items = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}

// Query timing wrapper
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = process.hrtime.bigint();

  try {
    return await fn();
  } finally {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6; // Convert to milliseconds

    if (duration > 100) {
      console.warn(`Slow query [${name}]: ${duration.toFixed(2)}ms`);
    }
  }
}

// Index hints for common queries
export const queryHints = {
  // Products
  productsByTenant: "CREATE INDEX idx_products_tenant ON products(tenant_id)",
  productsByCategory:
    "CREATE INDEX idx_products_category ON products(tenant_id, category_id)",
  productsByPrice:
    "CREATE INDEX idx_products_price ON products(tenant_id, price)",
  productsSearch:
    "CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || description))",

  // Orders
  ordersByTenant:
    "CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at DESC)",
  ordersByCustomer:
    "CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC)",
  ordersByStatus: "CREATE INDEX idx_orders_status ON orders(tenant_id, status)",

  // Customers
  customersByTenant:
    "CREATE INDEX idx_customers_tenant ON customers(tenant_id)",
  customersByEmail:
    "CREATE INDEX idx_customers_email ON customers(tenant_id, email)",
};
