/**
 * Database Query Optimizer
 * Optimización de queries y performance de base de datos
 */

import { logger } from "../monitoring/logger";

export class QueryOptimizer {
  /**
   * Build optimized pagination query
   */
  static buildPaginationQuery(page: number, pageSize: number): { skip: number; take: number } {
    const normalizedPage = Math.max(1, page);
    const normalizedPageSize = Math.min(Math.max(1, pageSize), 100);

    return {
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize,
    };
  }

  /**
   * Build optimized select fields
   */
  static buildSelectFields<T extends Record<string, boolean>>(fields: string[]): T {
    return fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as any) as T;
  }

  /**
   * Build optimized where clause
   */
  static buildWhereClause(filters: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        where[key] = { in: value };
      } else if (typeof value === "string" && value.includes("%")) {
        where[key] = { contains: value.replace(/%/g, ""), mode: "insensitive" };
      } else {
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * Build optimized orderBy clause
   */
  static buildOrderBy(
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Record<string, "asc" | "desc"> | undefined {
    if (!sortBy) return undefined;

    return {
      [sortBy]: sortOrder || "asc",
    };
  }

  /**
   * Analyze query performance
   */
  static async analyzeQueryPerformance<T>(
    queryName: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      if (duration > 1000) {
        logger.warn(
          {
            type: "slow_query",
            queryName,
            duration,
          },
          `Slow query detected: ${queryName}`,
        );
      } else {
        logger.debug(
          {
            type: "query_performance",
            queryName,
            duration,
          },
          `Query executed: ${queryName}`,
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        {
          type: "query_error",
          queryName,
          duration,
          error,
        },
        `Query failed: ${queryName}`,
      );

      throw error;
    }
  }

  /**
   * Build batch insert
   */
  static buildBatchInsert<T>(data: T[], batchSize: number = 1000): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Build includes for related data
   */
  static buildIncludes(relations: string[]): Record<string, boolean | object> {
    return relations.reduce(
      (acc, relation) => {
        const parts = relation.split(".");

        if (parts.length === 1) {
          acc[relation] = true;
        } else {
          const [parent, ...children] = parts;
          acc[parent] = {
            include: this.buildIncludes([children.join(".")]),
          };
        }

        return acc;
      },
      {} as Record<string, boolean | object>,
    );
  }

  /**
   * Optimize aggregate queries
   */
  static buildAggregateQuery(
    groupBy: string[],
    aggregations: Record<string, "sum" | "avg" | "count" | "min" | "max">,
  ) {
    return {
      by: groupBy,
      _sum: Object.entries(aggregations)
        .filter(([_, op]) => op === "sum")
        .reduce((acc, [field]) => ({ ...acc, [field]: true }), {}),
      _avg: Object.entries(aggregations)
        .filter(([_, op]) => op === "avg")
        .reduce((acc, [field]) => ({ ...acc, [field]: true }), {}),
      _count: Object.entries(aggregations)
        .filter(([_, op]) => op === "count")
        .reduce((acc, [field]) => ({ ...acc, [field]: true }), {}),
      _min: Object.entries(aggregations)
        .filter(([_, op]) => op === "min")
        .reduce((acc, [field]) => ({ ...acc, [field]: true }), {}),
      _max: Object.entries(aggregations)
        .filter(([_, op]) => op === "max")
        .reduce((acc, [field]) => ({ ...acc, [field]: true }), {}),
    };
  }
}

export default QueryOptimizer;
