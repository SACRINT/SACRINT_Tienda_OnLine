// Tenants API
// GET /api/tenants - Get current user's tenant
// POST /api/tenants - Create new tenant (STORE_OWNER only)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db/client'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Validation schema for creating a tenant
const CreateTenantSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  logo: z.string().url('Logo must be a valid URL').optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
})

/**
 * GET /api/tenants
 * Returns the current user's tenant information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tenantId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Get tenant with full details
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            categories: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor,
        accentColor: tenant.accentColor,
        stats: {
          totalUsers: tenant._count.users,
          totalProducts: tenant._count.products,
          totalOrders: tenant._count.orders,
          totalCategories: tenant._count.categories,
        },
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    })
  } catch (error) {
    console.error('[TENANTS] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenants
 * Creates a new tenant
 * Only STORE_OWNER or SUPER_ADMIN can create tenants
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to create tenants
    const { role } = session.user

    if (role !== UserRole.STORE_OWNER && role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can create tenants' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = CreateTenantSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, slug, logo, primaryColor, accentColor } = validation.data

    // Check if slug is already taken
    const existingTenant = await db.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug already taken. Please choose a different slug.' },
        { status: 409 }
      )
    }

    // Create tenant with default settings
    const tenant = await db.tenant.create({
      data: {
        name,
        slug,
        logo,
        primaryColor: primaryColor || '#0A1128',
        accentColor: accentColor || '#D4AF37',
        users: {
          connect: {
            id: session.user.id,
          },
        },
      },
    })

    console.log('[TENANTS] Created new tenant:', tenant.id, 'by user:', session.user.id)

    return NextResponse.json(
      {
        message: 'Tenant created successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[TENANTS] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
