/**
 * Test Utilities and Helpers
 * Common functions for mocking and testing
 */

import { Session } from 'next-auth'

// Mock user sessions
export const mockAdminSession: Session = {
  user: {
    id: 'test-user-id',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'STORE_OWNER',
    tenantId: 'test-tenant-id',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockSuperAdminSession: Session = {
  user: {
    id: 'super-admin-id',
    name: 'Super Admin',
    email: 'super@test.com',
    role: 'SUPER_ADMIN',
    tenantId: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockCustomerSession: Session = {
  user: {
    id: 'customer-id',
    name: 'Test Customer',
    email: 'customer@test.com',
    role: 'CUSTOMER',
    tenantId: 'test-tenant-id',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// Mock product data
export const mockProduct = {
  id: 'product-1',
  tenantId: 'test-tenant-id',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  price: 1999,
  stock: 100,
  sku: 'TEST-001',
  status: 'PUBLISHED',
  categoryId: 'category-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
  category: {
    id: 'category-1',
    name: 'Test Category',
    slug: 'test-category',
  },
  images: [
    {
      id: 'image-1',
      url: 'https://example.com/image1.jpg',
      alt: 'Test image',
      order: 0,
    },
  ],
}

// Mock order data
export const mockOrder = {
  id: 'order-1',
  tenantId: 'test-tenant-id',
  orderNumber: 'ORD-001',
  userId: 'customer-id',
  status: 'PENDING',
  total: 2999,
  subtotal: 2500,
  tax: 250,
  shipping: 249,
  stripePaymentIntentId: 'pi_test_123',
  refundedAmount: 0,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
  items: [
    {
      id: 'item-1',
      quantity: 1,
      price: 2500,
      product: {
        name: 'Test Product',
      },
    },
  ],
  user: {
    id: 'customer-id',
    name: 'Test Customer',
    email: 'customer@test.com',
  },
}

// Mock customer data
export const mockCustomer = {
  id: 'customer-1',
  tenantId: 'test-tenant-id',
  name: 'John Doe',
  email: 'john@test.com',
  phone: '+1234567890',
  role: 'CUSTOMER',
  createdAt: new Date('2024-01-01'),
  orders: [],
  addresses: [
    {
      id: 'address-1',
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US',
      isDefault: true,
    },
  ],
}

// Helper to create mock Prisma responses
export const createMockPrismaClient = (overrides: any = {}) => {
  return {
    product: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    orderNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ...overrides,
  }
}

// Helper to parse CSV
export const parseCSV = (csv: string): string[][] => {
  const lines = csv.trim().split('\n')
  return lines.map((line) => {
    // Simple CSV parser (doesn't handle all edge cases)
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current) // Add last field
    return values
  })
}

// Helper to calculate RFM scores (matching backend logic)
export const calculateRFMScore = (
  recencyDays: number,
  frequency: number,
  monetary: number
) => {
  let recencyScore = 1
  if (recencyDays <= 30) recencyScore = 5
  else if (recencyDays <= 60) recencyScore = 4
  else if (recencyDays <= 90) recencyScore = 3
  else if (recencyDays <= 180) recencyScore = 2

  let frequencyScore = 1
  if (frequency >= 10) frequencyScore = 5
  else if (frequency >= 5) frequencyScore = 4
  else if (frequency >= 3) frequencyScore = 3
  else if (frequency >= 2) frequencyScore = 2

  let monetaryScore = 1
  if (monetary >= 1000) monetaryScore = 5
  else if (monetary >= 500) monetaryScore = 4
  else if (monetary >= 250) monetaryScore = 3
  else if (monetary >= 100) monetaryScore = 2

  return {
    recency: recencyScore,
    frequency: frequencyScore,
    monetary: monetaryScore,
    total: recencyScore + frequencyScore + monetaryScore,
  }
}

// Helper to assign customer segment
export const assignSegment = (
  rfmScore: { recency: number; frequency: number; monetary: number },
  recencyDays: number
): string => {
  const { recency, frequency, monetary } = rfmScore

  // Champions: High in all dimensions
  if (recency >= 4 && frequency >= 4 && monetary >= 4) return 'champions'

  // Loyal: Good frequency and monetary, decent recency
  if (frequency >= 3 && monetary >= 3 && recency >= 2) return 'loyal'

  // Promising: Recent but low frequency
  if (recency >= 4 && frequency <= 2) return 'promising'

  // New: Very recent and single purchase
  if (recency === 5 && frequency === 1) return 'new'

  // At Risk: Low recency but historically valuable
  if (recency <= 2 && (frequency >= 3 || monetary >= 3)) return 'atRisk'

  // Lost: Very low recency and old
  if (recency === 1 && recencyDays > 180) return 'lost'

  // Default to promising
  return 'promising'
}
