// Database Connection Configuration
// Connection pooling and management

import { PrismaClient } from "@prisma/client";

// Connection pool configuration
const CONNECTION_CONFIG = {
  // Maximum connections in pool
  connectionLimit: 20,

  // Connection timeout (ms)
  connectTimeout: 10000,

  // Query timeout (ms)
  queryTimeout: 30000,

  // Idle connection timeout (ms)
  idleTimeout: 60000,
} as const;

// Prisma client options for performance
const prismaClientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? [
          { level: "query" as const, emit: "event" as const },
          { level: "error" as const, emit: "stdout" as const },
          { level: "warn" as const, emit: "stdout" as const },
        ]
      : [{ level: "error" as const, emit: "stdout" as const }],
};

// Create Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions);

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Query timing middleware
if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    const duration = after - before;

    // Log slow queries
    if (duration > 100) {
      console.warn(
        `[Prisma] Slow query: ${params.model}.${params.action} took ${duration}ms`
      );
    }

    return result;
  });
}

// Connection health check
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Connection pool stats (simulated - Prisma handles this internally)
export function getConnectionPoolStats(): {
  config: typeof CONNECTION_CONFIG;
  status: string;
} {
  return {
    config: CONNECTION_CONFIG,
    status: "active",
  };
}

// Database URL with connection pool settings
export function getDatabaseUrlWithPooling(baseUrl: string): string {
  const url = new URL(baseUrl);

  // Add connection pool parameters
  url.searchParams.set("connection_limit", String(CONNECTION_CONFIG.connectionLimit));
  url.searchParams.set("connect_timeout", String(CONNECTION_CONFIG.connectTimeout / 1000));
  url.searchParams.set("pool_timeout", String(CONNECTION_CONFIG.queryTimeout / 1000));

  return url.toString();
}

// Retry wrapper for transient errors
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("connection") ||
          error.message.includes("timeout") ||
          error.message.includes("ECONNREFUSED"));

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.warn(
        `[Database] Retry attempt ${attempt}/${retries} after ${delay}ms`
      );
    }
  }

  throw lastError;
}

// Transaction helper with timeout
export async function withTransaction<T>(
  operation: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>,
  timeout: number = CONNECTION_CONFIG.queryTimeout
): Promise<T> {
  return prisma.$transaction(operation, {
    timeout,
    maxWait: CONNECTION_CONFIG.connectTimeout,
  });
}

// Batch operation helper
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }

  return results;
}

export { prisma as db };
