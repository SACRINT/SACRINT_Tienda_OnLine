// Category Detail API
// GET /api/categories/[id] - Get category details
// PATCH /api/categories/[id] - Update category (STORE_OWNER only)
// DELETE /api/categories/[id] - Delete category (STORE_OWNER only)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
  isCategorySlugAvailable
} from '@/lib/db/categories'
import { UpdateCategorySchema } from '@/lib/security/schemas/product-schemas'
import { USER_ROLES } from '@/lib/types/user-role'

/**
 * GET /api/categories/[id]
 * Returns category details with subcategories and product count
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const categoryId = params.id

    const category = await getCategoryById(tenantId, categoryId)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or does not belong to your tenant' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        parent: category.parent ? {
          id: category.parent.id,
          name: category.parent.name,
          slug: category.parent.slug,
        } : null,
        subcategories: category.subcategories.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          image: sub.image,
        })),
        stats: {
          totalProducts: category._count.products,
          totalSubcategories: category._count.subcategories,
        },
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    })
  } catch (error) {
    console.error('[CATEGORIES] GET [id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/categories/[id]
 * Updates a category
 * Only STORE_OWNER or SUPER_ADMIN can update categories
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user has permission to update categories
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can update categories' },
        { status: 403 }
      )
    }

    const categoryId = params.id

    const body = await req.json()
    const validation = UpdateCategorySchema.safeParse(body)

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

    // If slug is being updated, check if it's available
    if (slug) {
      const slugAvailable = await isCategorySlugAvailable(tenantId, slug, categoryId)

      if (!slugAvailable) {
        return NextResponse.json(
          { error: 'Slug already taken within your store. Please choose a different slug.' },
          { status: 409 }
        )
      }
    }

    // Update category (updateCategory handles tenant access check)
    const category = await updateCategory(categoryId, {
      name,
      slug,
      description,
      image,
      ...(parentId !== undefined && {
        parent: parentId ? { connect: { id: parentId } } : { disconnect: true },
      }),
    })

    console.log('[CATEGORIES] Updated category:', categoryId, 'by user:', session.user.id)

    return NextResponse.json({
      message: 'Category updated successfully',
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        updatedAt: category.updatedAt,
      },
    })
  } catch (error) {
    console.error('[CATEGORIES] PATCH error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes('Parent category')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * Deletes a category
 * Only STORE_OWNER or SUPER_ADMIN can delete categories
 * Cannot delete if category has subcategories
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user has permission to delete categories
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can delete categories' },
        { status: 403 }
      )
    }

    const categoryId = params.id

    // Delete category (deleteCategory handles tenant access check and subcategory validation)
    await deleteCategory(categoryId)

    console.log('[CATEGORIES] Deleted category:', categoryId, 'by user:', session.user.id)

    return NextResponse.json({
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('[CATEGORIES] DELETE error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes('Cannot delete category with subcategories')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
