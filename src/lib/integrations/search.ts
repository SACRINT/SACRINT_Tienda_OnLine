// Search Service Integration
// Product search with indexing

import { z } from "zod";

// Search schemas
export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  filters: z.record(z.union([z.string(), z.array(z.string())])).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(["asc", "desc"]),
  }).optional(),
  page: z.number().positive().default(1),
  pageSize: z.number().positive().max(100).default(20),
  facets: z.array(z.string()).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// Search result types
export interface SearchResult<T> {
  hits: SearchHit<T>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: Record<string, FacetResult[]>;
  processingTimeMs: number;
}

export interface SearchHit<T> {
  id: string;
  score: number;
  data: T;
  highlights?: Record<string, string[]>;
}

export interface FacetResult {
  value: string;
  count: number;
}

// Product search specific
export interface ProductSearchData {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  salePrice?: number;
  category: string;
  categoryPath: string[];
  tags: string[];
  brand?: string;
  stock: number;
  rating?: number;
  reviewCount: number;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

// Search service interface
export interface SearchService {
  // Indexing
  indexProduct(product: ProductSearchData): Promise<void>;
  indexProducts(products: ProductSearchData[]): Promise<void>;
  updateProduct(id: string, product: Partial<ProductSearchData>): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  clearIndex(tenantId?: string): Promise<void>;

  // Searching
  search(tenantId: string, query: SearchQuery): Promise<SearchResult<ProductSearchData>>;
  suggest(tenantId: string, query: string, limit?: number): Promise<string[]>;

  // Analytics
  trackSearch(tenantId: string, query: string, resultCount: number): Promise<void>;
  trackClick(tenantId: string, query: string, productId: string, position: number): Promise<void>;
  getPopularSearches(tenantId: string, limit?: number): Promise<string[]>;
}

// Algolia-style implementation
export class AlgoliaSearchService implements SearchService {
  private appId: string;
  private apiKey: string;
  private indexName: string;
  private baseUrl: string;

  constructor(appId: string, apiKey: string, indexName: string = "products") {
    this.appId = appId;
    this.apiKey = apiKey;
    this.indexName = indexName;
    this.baseUrl = `https://${appId}.algolia.net`;
  }

  async indexProduct(product: ProductSearchData): Promise<void> {
    await this.indexProducts([product]);
  }

  async indexProducts(products: ProductSearchData[]): Promise<void> {
    const objects = products.map((p) => ({
      objectID: p.id,
      ...p,
    }));

    const response = await fetch(
      `${this.baseUrl}/1/indexes/${this.indexName}/batch`,
      {
        method: "POST",
        headers: {
          "X-Algolia-Application-Id": this.appId,
          "X-Algolia-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: objects.map((obj) => ({
            action: "updateObject",
            body: obj,
          })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Index failed: ${error.message}`);
    }
  }

  async updateProduct(
    id: string,
    product: Partial<ProductSearchData>
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/1/indexes/${this.indexName}/${id}/partial`,
      {
        method: "POST",
        headers: {
          "X-Algolia-Application-Id": this.appId,
          "X-Algolia-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Update failed: ${error.message}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/1/indexes/${this.indexName}/${id}`,
      {
        method: "DELETE",
        headers: {
          "X-Algolia-Application-Id": this.appId,
          "X-Algolia-API-Key": this.apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async clearIndex(tenantId?: string): Promise<void> {
    if (tenantId) {
      // Delete by query for specific tenant
      const response = await fetch(
        `${this.baseUrl}/1/indexes/${this.indexName}/deleteByQuery`,
        {
          method: "POST",
          headers: {
            "X-Algolia-Application-Id": this.appId,
            "X-Algolia-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filters: `tenantId:${tenantId}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Clear tenant index failed");
      }
    } else {
      // Clear entire index
      const response = await fetch(
        `${this.baseUrl}/1/indexes/${this.indexName}/clear`,
        {
          method: "POST",
          headers: {
            "X-Algolia-Application-Id": this.appId,
            "X-Algolia-API-Key": this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Clear index failed");
      }
    }
  }

  async search(
    tenantId: string,
    query: SearchQuery
  ): Promise<SearchResult<ProductSearchData>> {
    const validated = SearchQuerySchema.parse(query);

    const params: any = {
      query: validated.query,
      filters: `tenantId:${tenantId}`,
      page: validated.page - 1, // Algolia is 0-indexed
      hitsPerPage: validated.pageSize,
      attributesToHighlight: ["name", "description"],
    };

    // Add filters
    if (validated.filters) {
      const filterStrings = Object.entries(validated.filters).map(
        ([key, value]) => {
          if (Array.isArray(value)) {
            return `(${value.map((v) => `${key}:${v}`).join(" OR ")})`;
          }
          return `${key}:${value}`;
        }
      );
      params.filters += ` AND ${filterStrings.join(" AND ")}`;
    }

    // Add facets
    if (validated.facets) {
      params.facets = validated.facets;
    }

    const response = await fetch(
      `${this.baseUrl}/1/indexes/${this.indexName}/query`,
      {
        method: "POST",
        headers: {
          "X-Algolia-Application-Id": this.appId,
          "X-Algolia-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Search failed: ${error.message}`);
    }

    const result = await response.json();

    return {
      hits: result.hits.map((hit: any) => ({
        id: hit.objectID,
        score: hit._score || 1,
        data: hit as ProductSearchData,
        highlights: hit._highlightResult
          ? Object.fromEntries(
              Object.entries(hit._highlightResult).map(([key, value]: [string, any]) => [
                key,
                [value.value],
              ])
            )
          : undefined,
      })),
      total: result.nbHits,
      page: result.page + 1,
      pageSize: result.hitsPerPage,
      totalPages: result.nbPages,
      facets: result.facets
        ? Object.fromEntries(
            Object.entries(result.facets).map(([key, values]: [string, any]) => [
              key,
              Object.entries(values).map(([value, count]) => ({
                value,
                count: count as number,
              })),
            ])
          )
        : undefined,
      processingTimeMs: result.processingTimeMS,
    };
  }

  async suggest(
    tenantId: string,
    query: string,
    limit: number = 10
  ): Promise<string[]> {
    const result = await this.search(tenantId, {
      query,
      page: 1,
      pageSize: limit,
    });

    return result.hits.map((hit) => hit.data.name);
  }

  async trackSearch(
    tenantId: string,
    query: string,
    resultCount: number
  ): Promise<void> {
    // Analytics would be sent to Algolia Insights API
    console.log("Search tracked:", { tenantId, query, resultCount });
  }

  async trackClick(
    tenantId: string,
    query: string,
    productId: string,
    position: number
  ): Promise<void> {
    console.log("Click tracked:", { tenantId, query, productId, position });
  }

  async getPopularSearches(
    tenantId: string,
    limit: number = 10
  ): Promise<string[]> {
    // Would fetch from Algolia Analytics
    return [];
  }
}

// In-memory search for development
export class InMemorySearchService implements SearchService {
  private products = new Map<string, ProductSearchData>();
  private searchHistory: Array<{ tenantId: string; query: string; count: number }> = [];

  async indexProduct(product: ProductSearchData): Promise<void> {
    this.products.set(product.id, product);
  }

  async indexProducts(products: ProductSearchData[]): Promise<void> {
    for (const product of products) {
      this.products.set(product.id, product);
    }
  }

  async updateProduct(
    id: string,
    product: Partial<ProductSearchData>
  ): Promise<void> {
    const existing = this.products.get(id);
    if (existing) {
      this.products.set(id, { ...existing, ...product });
    }
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async clearIndex(tenantId?: string): Promise<void> {
    if (tenantId) {
      for (const [id, product] of this.products.entries()) {
        if (product.tenantId === tenantId) {
          this.products.delete(id);
        }
      }
    } else {
      this.products.clear();
    }
  }

  async search(
    tenantId: string,
    query: SearchQuery
  ): Promise<SearchResult<ProductSearchData>> {
    const startTime = Date.now();
    const validated = SearchQuerySchema.parse(query);

    // Filter by tenant
    let results = Array.from(this.products.values()).filter(
      (p) => p.tenantId === tenantId
    );

    // Text search
    const searchTerms = validated.query.toLowerCase().split(" ");
    results = results.filter((p) =>
      searchTerms.some(
        (term) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      )
    );

    // Apply filters
    if (validated.filters) {
      for (const [key, value] of Object.entries(validated.filters)) {
        const values = Array.isArray(value) ? value : [value];
        results = results.filter((p) => {
          const fieldValue = (p as any)[key];
          if (Array.isArray(fieldValue)) {
            return values.some((v) => fieldValue.includes(v));
          }
          return values.includes(String(fieldValue));
        });
      }
    }

    // Sort
    if (validated.sort) {
      results.sort((a, b) => {
        const aVal = (a as any)[validated.sort!.field];
        const bVal = (b as any)[validated.sort!.field];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return validated.sort!.direction === "asc" ? cmp : -cmp;
      });
    }

    // Calculate facets
    const facets: Record<string, FacetResult[]> = {};
    if (validated.facets) {
      for (const facet of validated.facets) {
        const counts = new Map<string, number>();
        for (const product of results) {
          const value = (product as any)[facet];
          if (value) {
            const values = Array.isArray(value) ? value : [String(value)];
            for (const v of values) {
              counts.set(v, (counts.get(v) || 0) + 1);
            }
          }
        }
        facets[facet] = Array.from(counts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count);
      }
    }

    // Paginate
    const total = results.length;
    const totalPages = Math.ceil(total / validated.pageSize);
    const start = (validated.page - 1) * validated.pageSize;
    const paginatedResults = results.slice(start, start + validated.pageSize);

    return {
      hits: paginatedResults.map((data, index) => ({
        id: data.id,
        score: 1 - index * 0.01,
        data,
        highlights: {
          name: [this.highlight(data.name, searchTerms)],
          description: [this.highlight(data.description, searchTerms)],
        },
      })),
      total,
      page: validated.page,
      pageSize: validated.pageSize,
      totalPages,
      facets: Object.keys(facets).length > 0 ? facets : undefined,
      processingTimeMs: Date.now() - startTime,
    };
  }

  private highlight(text: string, terms: string[]): string {
    let result = text;
    for (const term of terms) {
      const regex = new RegExp(`(${term})`, "gi");
      result = result.replace(regex, "<em>$1</em>");
    }
    return result;
  }

  async suggest(
    tenantId: string,
    query: string,
    limit: number = 10
  ): Promise<string[]> {
    const results = await this.search(tenantId, {
      query,
      page: 1,
      pageSize: limit,
    });

    return results.hits.map((hit) => hit.data.name);
  }

  async trackSearch(
    tenantId: string,
    query: string,
    resultCount: number
  ): Promise<void> {
    this.searchHistory.push({ tenantId, query, count: resultCount });
    console.log("Mock search tracked:", { tenantId, query, resultCount });
  }

  async trackClick(
    tenantId: string,
    query: string,
    productId: string,
    position: number
  ): Promise<void> {
    console.log("Mock click tracked:", { tenantId, query, productId, position });
  }

  async getPopularSearches(
    tenantId: string,
    limit: number = 10
  ): Promise<string[]> {
    const searches = this.searchHistory
      .filter((s) => s.tenantId === tenantId)
      .reduce((acc, s) => {
        acc.set(s.query, (acc.get(s.query) || 0) + 1);
        return acc;
      }, new Map<string, number>());

    return Array.from(searches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  }
}

// Create search service
export function createSearchService(): SearchService {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;

  if (!appId || !apiKey) {
    console.warn("Algolia config missing, using in-memory search");
    return new InMemorySearchService();
  }

  return new AlgoliaSearchService(appId, apiKey);
}

export const searchService = createSearchService();
