// GET /api/products/stock
// Stock management data and alerts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only STORE_OWNER and SUPER_ADMIN can view stock data
    if (session.user.role !== 'STORE_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')

    if (!tenantId || (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get stock threshold from tenant settings (default: 10)
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })

    const lowStockThreshold = (tenant?.settings as any)?.lowStockThreshold || 10

    // Get all products with stock data
    const products = await db.product.findMany({
      where: {
        tenantId,
        status: { not: 'ARCHIVED' },
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        stock: 'asc', // Show lowest stock first
      },
    })

    // Categorize products by stock level
    const outOfStock = products.filter((p: any) => p.stock === 0)
    const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= lowStockThreshold)
    const inStock = products.filter((p: any) => p.stock > lowStockThreshold)

    // Calculate total inventory value
    const totalValue = products.reduce((sum: number, p: any) => sum + p.price * p.stock, 0)

    // Get recent stock changes (from activity logs)
    const recentChanges = await db.activityLog.findMany({
      where: {
        tenantId,
        action: { in: ['BULK_UPDATESTOCK', 'PRODUCT_UPDATE'] },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({
      summary: {
        totalProducts: products.length,
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        inStockCount: inStock.length,
        totalInventoryValue: totalValue,
        lowStockThreshold,
      },
      products: {
        outOfStock: outOfStock.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          price: p.price,
          category: p.category?.name,
          status: p.status,
        })),
        lowStock: lowStock.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          price: p.price,
          category: p.category?.name,
          status: p.status,
        })),
      },
      recentChanges: recentChanges.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityId: log.entityId,
        metadata: log.metadata,
        createdAt: log.createdAt,
        user: log.user,
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Stock data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/products/stock
// Quick stock adjustment
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { tenantId, productId, adjustment, reason } = body

    if (!tenantId || !productId || typeof adjustment !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current product
    const product = await db.product.findFirst({
      where: { id: productId, tenantId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const newStock = Math.max(0, product.stock + adjustment)

    // Update stock
    const updated = await db.product.update({
      where: { id: productId },
      data: { stock: newStock },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'STOCK_ADJUSTMENT',
        entityType: 'PRODUCT',
        entityId: productId,
        metadata: {
          previousStock: product.stock,
          newStock,
          adjustment,
          reason: reason || 'Manual adjustment',
        },
      },
    })

    return NextResponse.json({
      success: true,
      product: {
        id: updated.id,
        name: updated.name,
        stock: updated.stock,
      },
      adjustment,
    })
  } catch (error) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
