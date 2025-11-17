// Data Access Layer - Products
// Complete database operations for product management with tenant isolation

import { db } from './client'
import { Prisma } from '@prisma/client'
import { getCurrentUserTenantId, ensureTenantAccess } from './tenant'
import type { ProductFilters, ProductSearchInput } from '../security/schemas/product-schemas'

/**
 * Get products with advanced filtering and pagination
 */
export async function getProducts(
  tenantId: string,
  filters: ProductFilters
) {
  await ensureTenantAccess(tenantId)

  const {
    page,
    limit,
    categoryId,
    search,
    minPrice,
    maxPrice,
    inStock,
    published,
    featured,
    tags,
    sort,
  } = filters

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    tenantId,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(minPrice !== undefined && {
      basePrice: { gte: minPrice },
    }),
    ...(maxPrice !== undefined && {
      basePrice: { lte: maxPrice },
    }),
    ...(inStock !== undefined && {
      stock: inStock ? { gt: 0 } : { lte: 0 },
    }),
    ...(published !== undefined && { published }),
    ...(featured !== undefined && { featured }),
    ...(tags && {
      tags: { hasSome: tags.split(',').map(t => t.trim()) },
    }),
  }

  // Build orderBy clause
  const orderBy = getProductOrderBy(sort)

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 4,
        },
        variants: {
          select: {
            id: true,
            size: true,
            color: true,
            price: true,
            stock: true,
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy,
    }),
    db.product.count({ where }),
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get product by ID with full details and tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID to retrieve
 */
export async function getProductById(tenantId: string, productId: string) {
  await ensureTenantAccess(tenantId)

  return db.product.findFirst({
    where: {
      id: productId,
      tenantId
    },
    include: {
      category: true,
      images: {
        orderBy: { order: 'asc' },
      },
      variants: {
        include: {
          image: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      reviews: {
        where: { status: 'APPROVED' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

/**
 * Get product by slug (within tenant)
 */
export async function getProductBySlug(tenantId: string, slug: string) {
  await ensureTenantAccess(tenantId)

  return db.product.findFirst({
    where: {
      tenantId,
      slug,
    },
    include: {
      category: true,
      images: {
        orderBy: { order: 'asc' },
      },
      variants: {
        include: {
          image: true,
        },
      },
      reviews: {
        where: { status: 'APPROVED' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

/**
 * Create new product with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param data - Product data to create
 */
export async function createProduct(tenantId: string, data: any) {
  await ensureTenantAccess(tenantId)

  return db.product.create({
    data: {
      ...data,
      tenantId // Explicitly set tenantId
    },
    include: {
      category: true,
      images: true,
    },
  })
}

/**
 * Update product
 */
export async function updateProduct(
  productId: string,
  data: any
) {
  const product = await db.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  await ensureTenantAccess(product.tenantId)

  return db.product.update({
    where: { id: productId },
    data,
    include: {
      category: true,
      images: true,
      variants: true,
    },
  })
}

/**
 * Delete product (soft delete by unpublishing)
 */
export async function deleteProduct(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  await ensureTenantAccess(product.tenantId)

  // Soft delete: set published to false
  return db.product.update({
    where: { id: productId },
    data: { published: false },
  })
}

/**
 * Hard delete product (use with caution)
 */
export async function hardDeleteProduct(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  await ensureTenantAccess(product.tenantId)

  // Cannot hard delete if has order items
  if (product._count.orderItems > 0) {
    throw new Error('Cannot delete product with existing orders. Use soft delete instead.')
  }

  return db.product.delete({
    where: { id: productId },
  })
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  tenantId: string,
  categoryId: string,
  options?: {
    page?: number
    limit?: number
    published?: boolean
  }
) {
  await ensureTenantAccess(tenantId)

  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit

  const where: any = {
    tenantId,
    categoryId,
    ...(options?.published !== undefined && { published: options.published }),
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        images: { take: 1 },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.product.count({ where }),
  ])

  return { products, total, page, pages: Math.ceil(total / limit) }
}

/**
 * Search products (advanced)
 */
export async function searchProducts(
  tenantId: string,
  searchInput: ProductSearchInput
) {
  await ensureTenantAccess(tenantId)

  const { q, categoryId, minPrice, maxPrice, page, limit } = searchInput
  const skip = (page - 1) * limit

  const where: any = {
    tenantId,
    published: true, // Only search published products
    ...(categoryId && { categoryId }),
    ...(minPrice && { basePrice: { gte: minPrice } }),
    ...(maxPrice && { basePrice: { lte: maxPrice } }),
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } },
    ],
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        images: { take: 1 },
        _count: { select: { reviews: true } },
      },
      orderBy: [
        { featured: 'desc' }, // Featured first
        { createdAt: 'desc' },
      ],
    }),
    db.product.count({ where }),
  ])

  return { products, total, page, pages: Math.ceil(total / limit) }
}

/**
 * Check product stock availability with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID to check stock
 */
export async function checkProductStock(tenantId: string, productId: string): Promise<{
  available: boolean
  stock: number
  reserved: number
  availableStock: number
}> {
  await ensureTenantAccess(tenantId)

  const product = await db.product.findFirst({
    where: {
      id: productId,
      tenantId
    },
    select: { stock: true, reserved: true },
  })

  if (!product) {
    throw new Error('Product not found or does not belong to tenant')
  }

  const availableStock = product.stock - product.reserved

  return {
    available: availableStock > 0,
    stock: product.stock,
    reserved: product.reserved,
    availableStock,
  }
}

/**
 * Reserve stock for order with tenant validation (prevent overselling)
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID to reserve stock
 * @param quantity - Quantity to reserve
 */
export async function reserveStock(
  tenantId: string,
  productId: string,
  quantity: number
): Promise<void> {
  await ensureTenantAccess(tenantId)

  const stockCheck = await checkProductStock(tenantId, productId)

  if (stockCheck.availableStock < quantity) {
    throw new Error(`Insufficient stock. Available: ${stockCheck.availableStock}, Requested: ${quantity}`)
  }

  // Verify product belongs to tenant before updating
  const product = await db.product.findFirst({
    where: { id: productId, tenantId }
  })

  if (!product) {
    throw new Error('Product not found or does not belong to tenant')
  }

  await db.product.update({
    where: { id: productId },
    data: {
      reserved: { increment: quantity },
    },
  })
}

/**
 * Release reserved stock with tenant validation (e.g., when order is cancelled)
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID to release stock
 * @param quantity - Quantity to release
 */
export async function releaseStock(
  tenantId: string,
  productId: string,
  quantity: number
): Promise<void> {
  await ensureTenantAccess(tenantId)

  // Verify product belongs to tenant before updating
  const product = await db.product.findFirst({
    where: { id: productId, tenantId }
  })

  if (!product) {
    throw new Error('Product not found or does not belong to tenant')
  }

  await db.product.update({
    where: { id: productId },
    data: {
      reserved: { decrement: quantity },
    },
  })
}

/**
 * Confirm stock deduction with tenant validation (when order is paid)
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID to deduct stock
 * @param quantity - Quantity to deduct
 */
export async function confirmStockDeduction(
  tenantId: string,
  productId: string,
  quantity: number
): Promise<void> {
  await ensureTenantAccess(tenantId)

  // Verify product belongs to tenant before updating
  const product = await db.product.findFirst({
    where: { id: productId, tenantId }
  })

  if (!product) {
    throw new Error('Product not found or does not belong to tenant')
  }

  await db.product.update({
    where: { id: productId },
    data: {
      stock: { decrement: quantity },
      reserved: { decrement: quantity },
    },
  })
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(tenantId: string) {
  await ensureTenantAccess(tenantId)

  return db.product.findMany({
    where: {
      tenantId,
      published: true,
      stock: {
        lte: db.product.fields.lowStockThreshold,
      },
    },
    include: {
      category: true,
    },
    orderBy: { stock: 'asc' },
  })
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(
  tenantId: string,
  limit: number = 10
) {
  await ensureTenantAccess(tenantId)

  return db.product.findMany({
    where: {
      tenantId,
      published: true,
      featured: true,
    },
    include: {
      images: { take: 1 },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Count products by tenant
 */
export async function countProductsByTenant(
  tenantId: string,
  published?: boolean
) {
  await ensureTenantAccess(tenantId)

  return db.product.count({
    where: {
      tenantId,
      ...(published !== undefined && { published }),
    },
  })
}

/**
 * Check if product SKU is available
 */
export async function isProductSkuAvailable(
  tenantId: string,
  sku: string,
  excludeProductId?: string
): Promise<boolean> {
  const existing = await db.product.findUnique({
    where: {
      tenantId_sku: { tenantId, sku },
    },
  })

  if (!existing) return true
  if (excludeProductId && existing.id === excludeProductId) return true

  return false
}

// ============ HELPER FUNCTIONS ============

/**
 * Get Prisma orderBy clause from sort parameter
 */
function getProductOrderBy(sort: string): any {
  switch (sort) {
    case 'newest':
      return { createdAt: 'desc' }
    case 'oldest':
      return { createdAt: 'asc' }
    case 'price-asc':
      return { basePrice: 'asc' }
    case 'price-desc':
      return { basePrice: 'desc' }
    case 'name-asc':
      return { name: 'asc' }
    case 'name-desc':
      return { name: 'desc' }
    case 'stock-asc':
      return { stock: 'asc' }
    case 'stock-desc':
      return { stock: 'desc' }
    default:
      return { createdAt: 'desc' }
  }
}
