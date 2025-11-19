// Search Types

export interface SearchableProduct {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  price: number;
  salePrice?: number;
  image?: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
}

export interface SearchQuery {
  query: string;
  tenantId: string;
  filters?: SearchFilters;
  facets?: string[];
  sort?: SearchSort;
  page?: number;
  limit?: number;
}

export interface SearchFilters {
  categoryId?: string;
  categorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  onSale?: boolean;
  rating?: number;
  tags?: string[];
}

export interface SearchSort {
  field: "relevance" | "price" | "name" | "createdAt" | "rating" | "popularity";
  direction: "asc" | "desc";
}

export interface SearchResult {
  products: SearchResultProduct[];
  total: number;
  page: number;
  totalPages: number;
  facets?: SearchFacets;
  query: string;
  took: number; // milliseconds
}

export interface SearchResultProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  image?: string;
  categoryName: string;
  categorySlug: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  score: number;
  highlights?: SearchHighlights;
}

export interface SearchHighlights {
  name?: string;
  description?: string;
}

export interface SearchFacets {
  categories?: FacetValue[];
  priceRanges?: FacetValue[];
  tags?: FacetValue[];
  ratings?: FacetValue[];
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: "product" | "category" | "query";
  data?: {
    id?: string;
    slug?: string;
    image?: string;
  };
}

export interface SearchAnalytics {
  queryId: string;
  query: string;
  tenantId: string;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  timestamp: Date;
  filters?: SearchFilters;
  clickedProducts?: string[];
  convertedProducts?: string[];
}
