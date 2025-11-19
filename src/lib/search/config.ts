// Search Configuration
// Algolia/Elasticsearch ready settings

export interface SearchConfig {
  provider: "local" | "algolia" | "elasticsearch";
  indexName: string;
  apiKey?: string;
  appId?: string;
  endpoint?: string;
}

export const SEARCH_CONFIG: SearchConfig = {
  provider:
    (process.env.SEARCH_PROVIDER as SearchConfig["provider"]) || "local",
  indexName: process.env.SEARCH_INDEX_NAME || "products",
  apiKey: process.env.SEARCH_API_KEY,
  appId: process.env.SEARCH_APP_ID,
  endpoint: process.env.SEARCH_ENDPOINT,
};

// Search weights for relevance scoring
export const SEARCH_WEIGHTS = {
  name: 10,
  description: 5,
  tags: 3,
  category: 2,
  sku: 8,
};

// Minimum characters for search
export const MIN_SEARCH_LENGTH = 2;

// Maximum results per page
export const MAX_RESULTS_PER_PAGE = 50;

// Default results per page
export const DEFAULT_RESULTS_PER_PAGE = 20;

// Autocomplete settings
export const AUTOCOMPLETE_CONFIG = {
  minChars: 2,
  maxSuggestions: 8,
  debounceMs: 300,
};

// Facet configuration
export const FACET_CONFIG = {
  maxValues: 20,
  sortBy: "count" as "count" | "alpha",
};

// Search analytics settings
export const ANALYTICS_CONFIG = {
  trackSearches: true,
  trackClicks: true,
  trackConversions: true,
  anonymize: false,
};
