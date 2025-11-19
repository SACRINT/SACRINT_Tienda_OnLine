// Database Mock for Testing

export const mockProduct = {
  id: "prod_test123",
  tenantId: "tenant_test123",
  name: "Test Product",
  slug: "test-product",
  description: "A test product for testing",
  basePrice: 99.99,
  salePrice: null,
  stock: 100,
  sku: "TEST-SKU-001",
  isActive: true,
  tags: ["test", "sample"],
  categoryId: "cat_test123",
  avgRating: 4.5,
  reviewCount: 10,
  reorderPoint: 10,
  reorderQuantity: 50,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockCategory = {
  id: "cat_test123",
  tenantId: "tenant_test123",
  name: "Test Category",
  slug: "test-category",
  description: "A test category",
  parentId: null,
  image: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockUser = {
  id: "user_test123",
  tenantId: "tenant_test123",
  email: "test@example.com",
  name: "Test User",
  role: "CUSTOMER" as const,
  emailVerified: new Date("2024-01-01"),
  image: null,
  phone: "+1234567890",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockOrder = {
  id: "order_test123",
  tenantId: "tenant_test123",
  userId: "user_test123",
  status: "PENDING" as const,
  paymentStatus: "PENDING" as const,
  subtotal: 99.99,
  tax: 16.0,
  shipping: 10.0,
  discount: 0,
  total: 125.99,
  shippingAddress: {
    name: "Test User",
    street: "123 Test St",
    city: "Test City",
    state: "TS",
    postalCode: "12345",
    country: "MX",
  },
  billingAddress: {
    name: "Test User",
    street: "123 Test St",
    city: "Test City",
    state: "TS",
    postalCode: "12345",
    country: "MX",
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockTenant = {
  id: "tenant_test123",
  name: "Test Store",
  slug: "test-store",
  subdomain: "test",
  customDomain: null,
  domainVerified: false,
  domainVerificationToken: null,
  settings: {},
  branding: {},
  limits: {},
  features: ["basic_analytics"],
  status: "active" as const,
  plan: "starter" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock Prisma Client
export const mockPrismaClient = {
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrismaClient)),
  $queryRaw: jest.fn(),
};

// Helper to reset all mocks
export function resetDbMocks() {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as jest.Mock).mockReset();
        }
      });
    }
  });
}
