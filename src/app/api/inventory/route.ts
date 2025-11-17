// Inventory Management API
// GET /api/inventory - Get inventory report or low stock products
// PATCH /api/inventory - Adjust product stock manually

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  getInventoryReport,
  getLowStockProducts,
  adjustProductStock,
} from '@/lib/db/inventory'
import { getProductById } from '@/lib/db/products'
import {
  AdjustInventorySchema,
  InventoryFilterSchema,
} from '@/lib/security/schemas/review-schemas'
import { USER_ROLES } from '@/lib/types/user-role'

/**
 * GET /api/inventory
 * Returns inventory report or low stock products
 * Requires STORE_OWNER role
 *
 * Query params:
 * - lowStock: boolean (optional) - if true, return only low stock products
 * - threshold: number (optional, default 10) - threshold for low stock
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
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

    // Check if user is STORE_OWNER
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can access inventory',
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)

    const filters = {
      lowStock: searchParams.get('lowStock'),
      threshold: searchParams.get('threshold'),
    }

    const validation = InventoryFilterSchema.safeParse(filters)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { lowStock, threshold } = validation.data

    // If lowStock is true, return only low stock products
    if (lowStock === true) {
      const lowStockProducts = await getLowStockProducts(
        tenantId,
        threshold || 10
      )

      return NextResponse.json({
        lowStockProducts: lowStockProducts.map((product: any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          variants: product.variants.map((variant: any) => ({
            id: variant.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
          })),
        })),
        threshold: threshold || 10,
      })
    }

    // Otherwise, return complete inventory report
    const report = await getInventoryReport(tenantId)

    return NextResponse.json({
      summary: report.summary,
      products: report.products,
    })
  } catch (error) {
    console.error('[INVENTORY] GET error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/inventory
 * Adjusts product stock manually
 * Requires STORE_OWNER role
 *
 * Body:
 * - productId: UUID
 * - adjustment: integer (positive or negative)
 * - reason: 'RECOUNT' | 'RETURN' | 'DAMAGE' | 'PURCHASE' | 'OTHER'
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
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

    // Check if user is STORE_OWNER
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can adjust inventory',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = AdjustInventorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { productId, adjustment, reason } = validation.data

    // Verify product exists and belongs to tenant
    const product = await getProductById(tenantId, productId)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to your tenant' },
        { status: 404 }
      )
    }

    // Adjust stock
    const updatedProduct = await adjustProductStock(productId, adjustment, reason)

    console.log(
      `[INVENTORY] Adjusted stock for product ${productId}: ${adjustment} (reason: ${reason}) by user ${session.user.id}`
    )

    return NextResponse.json({
      message: 'Stock adjusted successfully',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        stock: updatedProduct.stock,
        category: updatedProduct.category,
        variants: updatedProduct.variants,
      },
      adjustment: {
        amount: adjustment,
        reason,
      },
    })
  } catch (error) {
    console.error('[INVENTORY] PATCH error:', error)

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('negative stock')) {
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
