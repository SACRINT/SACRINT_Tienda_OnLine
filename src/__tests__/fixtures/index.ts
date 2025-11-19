// Test Fixtures
// Reusable test data

export const fixtures = {
  // Tenant fixtures
  tenants: {
    active: {
      id: "tenant_active",
      name: "Active Store",
      slug: "active-store",
      status: "active",
      plan: "professional",
    },
    trial: {
      id: "tenant_trial",
      name: "Trial Store",
      slug: "trial-store",
      status: "trial",
      plan: "free",
    },
  },

  // User fixtures
  users: {
    admin: {
      id: "user_admin",
      email: "admin@test.com",
      name: "Admin User",
      role: "SUPER_ADMIN",
      tenantId: "tenant_active",
    },
    owner: {
      id: "user_owner",
      email: "owner@test.com",
      name: "Store Owner",
      role: "STORE_OWNER",
      tenantId: "tenant_active",
    },
    customer: {
      id: "user_customer",
      email: "customer@test.com",
      name: "Customer User",
      role: "CUSTOMER",
      tenantId: "tenant_active",
    },
  },

  // Product fixtures
  products: {
    inStock: {
      id: "prod_instock",
      name: "In Stock Product",
      slug: "in-stock-product",
      basePrice: 99.99,
      stock: 100,
      isActive: true,
    },
    outOfStock: {
      id: "prod_outofstock",
      name: "Out of Stock Product",
      slug: "out-of-stock-product",
      basePrice: 149.99,
      stock: 0,
      isActive: true,
    },
    onSale: {
      id: "prod_onsale",
      name: "Sale Product",
      slug: "sale-product",
      basePrice: 199.99,
      salePrice: 149.99,
      stock: 50,
      isActive: true,
    },
    inactive: {
      id: "prod_inactive",
      name: "Inactive Product",
      slug: "inactive-product",
      basePrice: 79.99,
      stock: 20,
      isActive: false,
    },
  },

  // Order fixtures
  orders: {
    pending: {
      id: "order_pending",
      status: "PENDING",
      paymentStatus: "PENDING",
      total: 125.99,
    },
    completed: {
      id: "order_completed",
      status: "COMPLETED",
      paymentStatus: "PAID",
      total: 299.99,
    },
    cancelled: {
      id: "order_cancelled",
      status: "CANCELLED",
      paymentStatus: "REFUNDED",
      total: 99.99,
    },
  },

  // API key fixtures
  apiKeys: {
    valid: {
      key: "sk_live_valid_test_key_123456789",
      tenantId: "tenant_active",
      permissions: ["*"],
      rateLimit: 1000,
    },
    limited: {
      key: "sk_live_limited_test_key_123456",
      tenantId: "tenant_active",
      permissions: ["products.read", "orders.read"],
      rateLimit: 100,
    },
    expired: {
      key: "sk_live_expired_test_key_12345",
      tenantId: "tenant_active",
      expiresAt: new Date("2020-01-01"),
    },
  },
};

// Helper to create complete test objects
export function createTestProduct(overrides = {}) {
  return {
    id: "prod_" + Date.now(),
    tenantId: "tenant_active",
    name: "Test Product",
    slug: "test-product",
    description: "Test description",
    basePrice: 99.99,
    salePrice: null,
    stock: 100,
    sku: "TEST-" + Date.now(),
    isActive: true,
    tags: [],
    categoryId: "cat_default",
    avgRating: null,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestUser(overrides = {}) {
  return {
    id: "user_" + Date.now(),
    tenantId: "tenant_active",
    email: "test" + Date.now() + "@example.com",
    name: "Test User",
    role: "CUSTOMER",
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestOrder(overrides = {}) {
  return {
    id: "order_" + Date.now(),
    tenantId: "tenant_active",
    userId: "user_customer",
    status: "PENDING",
    paymentStatus: "PENDING",
    subtotal: 99.99,
    tax: 16.0,
    shipping: 10.0,
    discount: 0,
    total: 125.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
