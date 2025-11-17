// Product Detail API
// GET /api/products/[id] - Get product details with full relations
// PATCH /api/products/[id] - Update product (STORE_OWNER only)
// DELETE /api/products/[id] - Delete product (STORE_OWNER only, soft delete)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  getProductById,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
  isProductSkuAvailable
} from '@/lib/db/products'
import { getCategoryById } from '@/lib/db/categories'
import { UpdateProductSchema } from '@/lib/security/schemas/product-schemas'
import { USER_ROLES } from '@/lib/types/user-role'

/**
 * GET /api/products/[id]
 * Returns product details with full information
 * Includes: category, images, variants, approved reviews, tenant
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

    const productId = params.id

    const product = await getProductById(productId)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Verify product belongs to user's tenant
    if (product.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Forbidden - Product does not belong to your tenant' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        reserved: product.reserved,
        availableStock: product.stock - product.reserved,
        published: product.published,
        featured: product.featured,
        tags: product.tags,
        lowStockThreshold: product.lowStockThreshold,
        weight: product.weight,
        length: product.length,
        width: product.width,
        height: product.height,
        seo: product.seo,
        category: product.category,
        images: product.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          order: img.order,
        })),
        variants: product.variants.map((variant: any) => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stock: variant.stock,
          image: variant.image ? {
            id: variant.image.id,
            url: variant.image.url,
            alt: variant.image.alt,
          } : null,
        })),
        reviews: product.reviews.map((review: any) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          user: {
            id: review.user.id,
            name: review.user.name,
            image: review.user.image,
          },
          createdAt: review.createdAt,
        })),
        tenant: {
          id: product.tenant.id,
          name: product.tenant.name,
          slug: product.tenant.slug,
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    })
  } catch (error) {
    console.error('[PRODUCTS] GET [id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/products/[id]
 * Updates a product
 * Only STORE_OWNER or SUPER_ADMIN can update products
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

    // Check if user has permission to update products
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can update products' },
        { status: 403 }
      )
    }

    const productId = params.id

    const body = await req.json()
    const validation = UpdateProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      sku,
      basePrice,
      salePrice,
      salePriceExpiresAt,
      stock,
      lowStockThreshold,
      weight,
      length,
      width,
      height,
      categoryId,
      tags,
      seo,
      published,
      featured,
    } = validation.data

    // If categoryId is being updated, verify it exists and belongs to tenant
    if (categoryId) {
      const category = await getCategoryById(categoryId)

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      if (category.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Forbidden - Category does not belong to your tenant' },
          { status: 403 }
        )
      }
    }

    // If SKU is being updated, check if it's available
    if (sku) {
      const skuAvailable = await isProductSkuAvailable(tenantId, sku, productId)

      if (!skuAvailable) {
        return NextResponse.json(
          { error: 'SKU already exists within your store. Please choose a different SKU.' },
          { status: 409 }
        )
      }
    }

    // Update product (updateProduct handles tenant access check)
    const product = await updateProduct(productId, {
      name,
      slug,
      description,
      shortDescription,
      sku,
      basePrice,
      salePrice,
      salePriceExpiresAt,
      stock,
      lowStockThreshold,
      weight,
      length,
      width,
      height,
      tags,
      seo,
      published,
      featured,
      ...(categoryId && {
        category: { connect: { id: categoryId } },
      }),
    })

    console.log('[PRODUCTS] Updated product:', productId, 'by user:', session.user.id)

    return NextResponse.json({
      message: 'Product updated successfully',
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        published: product.published,
        featured: product.featured,
        category: product.category,
        images: product.images,
        variants: product.variants,
        updatedAt: product.updatedAt,
      },
    })
  } catch (error) {
    console.error('[PRODUCTS] PATCH error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Product with this slug already exists in your store' },
          { status: 409 }
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
 * DELETE /api/products/[id]
 * Deletes a product (soft delete by default)
 * Only STORE_OWNER or SUPER_ADMIN can delete products
 *
 * Query param:
 * - hard=true: Perform hard delete (only if product has no orders)
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

    // Check if user has permission to delete products
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can delete products' },
        { status: 403 }
      )
    }

    const productId = params.id
    const { searchParams } = new URL(req.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete (only if no orders)
      await hardDeleteProduct(productId)

      console.log('[PRODUCTS] Hard deleted product:', productId, 'by user:', session.user.id)

      return NextResponse.json({
        message: 'Product permanently deleted',
      })
    } else {
      // Soft delete (set published to false)
      await deleteProduct(productId)

      console.log('[PRODUCTS] Soft deleted product:', productId, 'by user:', session.user.id)

      return NextResponse.json({
        message: 'Product unpublished successfully',
      })
    }
  } catch (error) {
    console.error('[PRODUCTS] DELETE error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes('Cannot delete product with existing orders')) {
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
