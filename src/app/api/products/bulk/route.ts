// POST /api/products/bulk
// Bulk operations for products

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

import { db } from '@/lib/db'
import { z } from 'zod'

const BulkOperationSchema = z.object({
  tenantId: z.string().uuid(),
  productIds: z.array(z.string().uuid()),
  operation: z.enum([
    'delete',
    'publish',
    'unpublish',
    'updatePrice',
    'updateStock',
    'assignCategory',
  ]),
  value: z.any().optional(), // For operations that need a value
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only STORE_OWNER and SUPER_ADMIN can perform bulk operations
    if (session.user.role !== 'STORE_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validation = BulkOperationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, productIds, operation, value } = validation.data

    // Validate tenant access
    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let result

    switch (operation) {
      case 'delete':
        // Soft delete products
        result = await db.product.updateMany({
          where: {
            id: { in: productIds },
            tenantId,
          },
          data: {
            status: 'ARCHIVED',
            deletedAt: new Date(),
          },
        })
        break

      case 'publish':
        result = await db.product.updateMany({
          where: {
            id: { in: productIds },
            tenantId,
          },
          data: {
            status: 'ACTIVE',
          },
        })
        break

      case 'unpublish':
        result = await db.product.updateMany({
          where: {
            id: { in: productIds },
            tenantId,
          },
          data: {
            status: 'DRAFT',
          },
        })
        break

      case 'updatePrice':
        if (!value || typeof value !== 'number') {
          return NextResponse.json(
            { error: 'Price value required' },
            { status: 400 }
          )
        }

        result = await db.product.updateMany({
          where: {
            id: { in: productIds },
            tenantId,
          },
          data: {
            price: value,
          },
        })
        break

      case 'updateStock':
        if (!value || typeof value !== 'number') {
          return NextResponse.json(
            { error: 'Stock value required' },
            { status: 400 }
          )
        }

        result = await db.product.updateMany({
          where: {
            id: { in: productIds },
            tenantId,
          },
          data: {
            stock: value,
          },
        })
        break

      case 'assignCategory':
        if (!value || typeof value !== 'string') {
          return NextResponse.json(
            { error: 'Category ID required' },
            { status: 400 }
          )
        }

        // Verify category exists and belongs to tenant
        const category = await db.category.findFirst({
          where: {
            id: value,
            tenantId,
          },
        })

        if (!category) {
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 404 }
          )
        }

        result = await db.product.updateMany({
          where: {
            id: { in: productIds },
            tenantId,
          },
          data: {
            categoryId: value,
          },
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: `BULK_${operation.toUpperCase()}`,
        entityType: 'PRODUCT',
        entityId: productIds[0], // First product as reference
        metadata: {
          productCount: productIds.length,
          productIds,
          value,
        },
      },
    })

    return NextResponse.json({
      success: true,
      affected: result.count,
      operation,
    })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/products/bulk/export
// Export products to CSV
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const productIds = searchParams.get('productIds')?.split(',')

    if (!tenantId || (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch products
    const products = await db.product.findMany({
      where: {
        tenantId,
        ...(productIds && { id: { in: productIds } }),
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert to CSV format
    const csvHeaders = [
      'ID',
      'Name',
      'SKU',
      'Description',
      'Category',
      'Price',
      'Stock',
      'Status',
      'Created At',
    ]

    const csvRows = products.map((product: any) => [
      product.id,
      `"${product.name.replace(/"/g, '""')}"`, // Escape quotes
      product.sku || '',
      `"${(product.description || '').replace(/"/g, '""')}"`,
      product.category?.name || '',
      product.price.toString(),
      product.stock.toString(),
      product.status,
      product.createdAt.toISOString(),
    ])

    const csv = [csvHeaders.join(','), ...csvRows.map((row: any) => row.join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
