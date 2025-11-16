// Categories API
// GET /api/categories - Get all categories for current user's tenant (with tree structure)
// POST /api/categories - Create new category (STORE_OWNER only)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  getCategoriesByTenant,
  getCategoryTree,
  createCategory,
  isCategorySlugAvailable
} from '@/lib/db/categories'
import { CreateCategorySchema } from '@/lib/security/schemas/product-schemas'
import { UserRole } from '@prisma/client'

/**
 * GET /api/categories
 * Returns all categories for the current user's tenant
 * Supports both flat list and hierarchical tree structure
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

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'flat' // 'flat' or 'tree'
    const parentId = searchParams.get('parentId')
    const includeSubcategories = searchParams.get('includeSubcategories') === 'true'

    let categories

    if (format === 'tree') {
      // Return hierarchical tree structure
      categories = await getCategoryTree(tenantId)

      return NextResponse.json({
        categories,
        format: 'tree',
      })
    } else {
      // Return flat list with optional filtering
      categories = await getCategoriesByTenant(tenantId, {
        parentId: parentId === 'null' ? null : parentId || undefined,
        includeSubcategories,
      })

      return NextResponse.json({
        categories,
        format: 'flat',
        total: categories.length,
      })
    }
  } catch (error) {
    console.error('[CATEGORIES] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * Creates a new category
 * Only STORE_OWNER or SUPER_ADMIN can create categories
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

    const { role, tenantId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Check if user has permission to create categories
    if (role !== UserRole.STORE_OWNER && role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can create categories' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = CreateCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, slug, description, image, parentId } = validation.data

    // Check if slug is already taken within this tenant
    const slugAvailable = await isCategorySlugAvailable(tenantId, slug)

    if (!slugAvailable) {
      return NextResponse.json(
        { error: 'Slug already taken within your store. Please choose a different slug.' },
        { status: 409 }
      )
    }

    // Create category
    const category = await createCategory({
      tenantId,
      name,
      slug,
      description,
      image,
      parentId: parentId || null,
    })

    console.log('[CATEGORIES] Created new category:', category.id, 'by user:', session.user.id)

    return NextResponse.json(
      {
        message: 'Category created successfully',
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          parentId: category.parentId,
          createdAt: category.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[CATEGORIES] POST error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Parent category not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
