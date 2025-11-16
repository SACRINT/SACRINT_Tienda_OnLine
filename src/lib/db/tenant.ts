// Data Access Layer - Tenants
// CRITICAL: Tenant isolation for multi-tenant architecture

import { db } from './client'
import { Prisma } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

/**
 * Get current user's tenant ID from session
 * CRITICAL: Use this in ALL queries to ensure tenant isolation
 */
export async function getCurrentUserTenantId(): Promise<string | null> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized - No session found')
  }

  return session.user.tenantId
}

/**
 * Ensure user has access to tenant
 * Throws error if user doesn't belong to tenant
 */
export async function ensureTenantAccess(tenantId: string): Promise<void> {
  const userTenantId = await getCurrentUserTenantId()

  if (!userTenantId) {
    throw new Error('User has no tenant assigned')
  }

  if (userTenantId !== tenantId) {
    throw new Error('Forbidden - User does not have access to this tenant')
  }
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string) {
  return db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      settings: true,
      _count: {
        select: {
          users: true,
          products: true,
          orders: true,
        },
      },
    },
  })
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  return db.tenant.findUnique({
    where: { slug },
    include: {
      settings: true,
    },
  })
}

/**
 * Create new tenant
 */
export async function createTenant(data: {
  name: string
  slug: string
  logo?: string
  primaryColor?: string
  accentColor?: string
}) {
  return db.tenant.create({
    data: {
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      primaryColor: data.primaryColor || '#0A1128',
      accentColor: data.accentColor || '#D4AF37',
      isActive: true,
    },
  })
}

/**
 * Update tenant
 */
export async function updateTenant(
  tenantId: string,
  data: Prisma.TenantUpdateInput
) {
  // Ensure user has access to this tenant
  await ensureTenantAccess(tenantId)

  return db.tenant.update({
    where: { id: tenantId },
    data,
  })
}

/**
 * Delete tenant (soft delete by setting isActive to false)
 */
export async function deactivateTenant(tenantId: string) {
  // Ensure user has access to this tenant
  await ensureTenantAccess(tenantId)

  return db.tenant.update({
    where: { id: tenantId },
    data: { isActive: false },
  })
}

/**
 * Get tenant settings
 */
export async function getTenantSettings(tenantId: string) {
  await ensureTenantAccess(tenantId)

  return db.tenantSettings.findUnique({
    where: { tenantId },
  })
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  tenantId: string,
  data: Prisma.TenantSettingsUpdateInput
) {
  await ensureTenantAccess(tenantId)

  // Check if settings exist
  const existingSettings = await db.tenantSettings.findUnique({
    where: { tenantId },
  })

  if (!existingSettings) {
    // Create settings if they don't exist
    return db.tenantSettings.create({
      data: {
        tenantId,
        ...data,
      },
    })
  }

  return db.tenantSettings.update({
    where: { tenantId },
    data,
  })
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(tenantId: string) {
  await ensureTenantAccess(tenantId)

  const [
    totalProducts,
    publishedProducts,
    totalOrders,
    totalRevenue,
    totalCustomers,
  ] = await Promise.all([
    db.product.count({ where: { tenantId } }),
    db.product.count({ where: { tenantId, published: true } }),
    db.order.count({ where: { tenantId } }),
    db.order.aggregate({
      where: { tenantId, status: 'CONFIRMED' },
      _sum: { total: true },
    }),
    db.user.count({ where: { tenantId, role: 'CUSTOMER' } }),
  ])

  return {
    totalProducts,
    publishedProducts,
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    totalCustomers,
  }
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.tenant.findUnique({
    where: { slug },
  })

  return !existing
}

/**
 * Tenant-filtered query helper
 * CRITICAL: Use this for all queries that need tenant filtering
 */
export function withTenantFilter<T extends { tenantId: string }>(
  tenantId: string,
  additionalFilters?: Partial<T>
): T {
  return {
    tenantId,
    ...additionalFilters,
  } as T
}
