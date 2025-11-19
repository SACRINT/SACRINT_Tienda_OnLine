// API Client Wrapper
// Unified API client with error handling, retries, and caching

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
  headers: Headers;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: unknown;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

// Simple cache for GET requests
const cache: Map<string, { data: unknown; expiry: number }> = new Map();

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  // GET request
  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  // POST request
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  // PUT request
  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  // PATCH request
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  // DELETE request
  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  // Main request method
  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retries,
      cache: useCache = false,
      cacheTTL = 60000,
    } = options;

    const url = this.config.baseUrl + path;

    // Check cache for GET requests
    if (method === "GET" && useCache) {
      const cached = cache.get(url);
      if (cached && cached.expiry > Date.now()) {
        return {
          data: cached.data as T,
          error: null,
          status: 200,
          headers: new Headers(),
        };
      }
    }

    // Prepare request
    const requestHeaders = {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...headers,
    };

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      requestInit.body = JSON.stringify(body);
    }

    // Execute with retries
    let lastError: ApiError | null = null;
    let attempt = 0;

    while (attempt <= retries!) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestInit,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        let data: T | null = null;
        let error: ApiError | null = null;

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const json = await response.json();

          if (response.ok) {
            data = json;

            // Cache successful GET requests
            if (method === "GET" && useCache) {
              cache.set(url, { data, expiry: Date.now() + cacheTTL });
            }
          } else {
            error = {
              message: json.message || json.error || "Request failed",
              code: json.code || "UNKNOWN_ERROR",
              status: response.status,
              details: json.details,
            };
          }
        }

        return {
          data,
          error,
          status: response.status,
          headers: response.headers,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        lastError = {
          message: errorMessage,
          code: errorMessage.includes("abort") ? "TIMEOUT" : "NETWORK_ERROR",
          status: 0,
        };

        // Don't retry on abort
        if (errorMessage.includes("abort")) {
          break;
        }

        // Retry with delay
        if (attempt < retries!) {
          await this.delay(this.config.retryDelay! * Math.pow(2, attempt));
        }

        attempt++;
      }
    }

    return {
      data: null,
      error: lastError,
      status: 0,
      headers: new Headers(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Clear cache
  clearCache(path?: string): void {
    if (path) {
      cache.delete(this.config.baseUrl + path);
    } else {
      cache.clear();
    }
  }

  // Update config
  setConfig(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Set auth token
  setAuthToken(token: string): void {
    this.config.headers = {
      ...this.config.headers,
      Authorization: "Bearer " + token,
    };
  }
}

// Default instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
});

// Create custom instance
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
