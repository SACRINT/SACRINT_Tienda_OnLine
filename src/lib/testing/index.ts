// Testing Utilities

import { vi } from "vitest"

// Mock localStorage
export function createMockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    },
    // Helper to get raw store
    __store: store,
  }
}

// Mock window.matchMedia
export function createMockMatchMedia(matches = false) {
  return vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Mock IntersectionObserver
export function createMockIntersectionObserver() {
  return vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: "",
    thresholds: [],
  }))
}

// Mock ResizeObserver
export function createMockResizeObserver() {
  return vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

// Mock fetch
export function createMockFetch(responses: Map<string, Response> = new Map()) {
  return vi.fn().mockImplementation((url: string) => {
    const response = responses.get(url)
    if (response) {
      return Promise.resolve(response)
    }
    return Promise.resolve(
      new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      })
    )
  })
}

// Create mock response
export function createMockResponse(
  data: unknown,
  options?: {
    status?: number
    headers?: Record<string, string>
  }
) {
  return new Response(JSON.stringify(data), {
    status: options?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
}

// Mock Request
export function createMockRequest(
  url: string,
  options?: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  }
) {
  return new Request(url, {
    method: options?.method || "GET",
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
}

// Wait for next tick
export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

// Wait for specific time
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Flush promises
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
}

// Generate test data
export const testData = {
  user: {
    id: "user-test-123",
    name: "Usuario Test",
    email: "test@example.com",
    role: "CUSTOMER",
  },

  tenant: {
    id: "tenant-test-123",
    name: "Tienda Test",
    slug: "tienda-test",
  },

  product: {
    id: "product-test-123",
    name: "Producto Test",
    description: "Descripción del producto",
    price: 299.99,
    compareAtPrice: 399.99,
    stock: 10,
    images: ["/placeholder-product.jpg"],
    category: "test-category",
  },

  order: {
    id: "order-test-123",
    status: "PENDING",
    total: 599.98,
    items: [
      {
        id: "item-1",
        productId: "product-test-123",
        name: "Producto Test",
        price: 299.99,
        quantity: 2,
      },
    ],
  },

  address: {
    street: "Calle Test 123",
    colony: "Colonia Test",
    city: "Ciudad Test",
    state: "Estado Test",
    postalCode: "12345",
    country: "México",
  },

  coupon: {
    code: "TEST10",
    type: "percentage" as const,
    value: 10,
    minPurchase: 100,
    expiresAt: new Date(Date.now() + 86400000),
  },
}

// Generate random test ID
export function generateTestId(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Assert helpers
export function assertDefined<T>(
  value: T | undefined | null,
  message = "Value should be defined"
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message)
  }
}

// Create date helpers
export function createTestDate(daysOffset = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date
}

// Format currency for testing
export function formatTestCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

// Setup global mocks
export function setupGlobalMocks() {
  const localStorage = createMockLocalStorage()
  Object.defineProperty(window, "localStorage", { value: localStorage })

  window.matchMedia = createMockMatchMedia()
  window.IntersectionObserver = createMockIntersectionObserver() as unknown as typeof IntersectionObserver
  window.ResizeObserver = createMockResizeObserver() as unknown as typeof ResizeObserver

  return {
    localStorage,
    cleanup: () => {
      localStorage.clear()
      vi.clearAllMocks()
    },
  }
}

// Clean up after tests
export function cleanupTests() {
  vi.clearAllMocks()
  vi.clearAllTimers()
}
