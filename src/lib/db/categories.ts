// Data Access Layer - Categories
// Reusable database operations for category management with tenant isolation

import { db } from './client'
import { getCurrentUserTenantId, ensureTenantAccess } from './tenant'

/**
 * Get all categories for a tenant (tree structure)
 */
export async function getCategoriesByTenant(
  tenantId: string,
  options?: {
    includeSubcategories?: boolean
    parentId?: string | null
  }
) {
  await ensureTenantAccess(tenantId)

  return db.category.findMany({
    where: {
      tenantId,
      parentId: options?.parentId !== undefined ? options.parentId : undefined,
    },
    include: {
      subcategories: options?.includeSubcategories ? {
        include: {
          subcategories: true, // 2 levels deep
        },
      } : false,
      _count: {
        select: {
          products: true,
          subcategories: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get category by ID with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param categoryId - Category ID to retrieve
 */
export async function getCategoryById(tenantId: string, categoryId: string) {
  await ensureTenantAccess(tenantId)

  return db.category.findFirst({
    where: {
      id: categoryId,
      tenantId
    },
    include: {
      parent: true,
      subcategories: {
        include: {
          _count: {
            select: { products: true },
          },
        },
      },
      _count: {
        select: { products: true, subcategories: true },
      },
    },
  })
}

/**
 * Get category by slug (within tenant)
 */
export async function getCategoryBySlug(tenantId: string, slug: string) {
  await ensureTenantAccess(tenantId)

  return db.category.findUnique({
    where: {
      tenantId_slug: { tenantId, slug },
    },
    include: {
      subcategories: true,
      _count: {
        select: { products: true },
      },
    },
  })
}

/**
 * Create new category
 */
export async function createCategory(data: {
  tenantId: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
}) {
  await ensureTenantAccess(data.tenantId)

  // Validate parent category exists and belongs to same tenant
  if (data.parentId) {
    const parentCategory = await db.category.findFirst({
      where: {
        id: data.parentId,
        tenantId: data.tenantId,
      },
    })

    if (!parentCategory) {
      throw new Error('Parent category not found or does not belong to this tenant')
    }
  }

  // Check slug uniqueness within tenant
  const existingSlug = await db.category.findUnique({
    where: {
      tenantId_slug: {
        tenantId: data.tenantId,
        slug: data.slug,
      },
    },
  })

  if (existingSlug) {
    throw new Error('Category slug already exists in this tenant')
  }

  return db.category.create({
    data,
    include: {
      parent: true,
      _count: {
        select: { products: true },
      },
    },
  })
}

/**
 * Update category
 */
export async function updateCategory(
  categoryId: string,
  data: Record<string, any>
) {
  const category = await db.category.findUnique({
    where: { id: categoryId },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  await ensureTenantAccess(category.tenantId)

  return db.category.update({
    where: { id: categoryId },
    data,
    include: {
      parent: true,
      subcategories: true,
      _count: {
        select: { products: true },
      },
    },
  })
}

/**
 * Delete category (soft delete by setting products to null category)
 * or hard delete if no products
 */
export async function deleteCategory(categoryId: string) {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: {
          products: true,
          subcategories: true,
        },
      },
    },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  await ensureTenantAccess(category.tenantId)

  // Cannot delete if has subcategories
  if (category._count.subcategories > 0) {
    throw new Error('Cannot delete category with subcategories. Delete subcategories first.')
  }

  // If has products, set their category to null (uncategorized)
  if (category._count.products > 0) {
    await db.product.updateMany({
      where: { categoryId },
      data: { categoryId: null as any },
    })
  }

  // Delete category
  return db.category.delete({
    where: { id: categoryId },
  })
}

/**
 * Get category tree (hierarchical structure)
 */
export async function getCategoryTree(tenantId: string) {
  await ensureTenantAccess(tenantId)

  // Get top-level categories (no parent)
  const topLevelCategories = await db.category.findMany({
    where: {
      tenantId,
      parentId: null,
    },
    include: {
      subcategories: {
        include: {
          subcategories: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return topLevelCategories
}

/**
 * Search categories by name
 */
export async function searchCategories(
  tenantId: string,
  searchTerm: string
) {
  await ensureTenantAccess(tenantId)

  return db.category.findMany({
    where: {
      tenantId,
      name: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    },
    include: {
      parent: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
    take: 20,
  })
}

/**
 * Count categories by tenant
 */
export async function countCategoriesByTenant(tenantId: string) {
  await ensureTenantAccess(tenantId)

  return db.category.count({
    where: { tenantId },
  })
}

/**
 * Check if category slug is available
 */
export async function isCategorySlugAvailable(
  tenantId: string,
  slug: string,
  excludeCategoryId?: string
): Promise<boolean> {
  const existing = await db.category.findUnique({
    where: {
      tenantId_slug: { tenantId, slug },
    },
  })

  if (!existing) return true
  if (excludeCategoryId && existing.id === excludeCategoryId) return true

  return false
}
