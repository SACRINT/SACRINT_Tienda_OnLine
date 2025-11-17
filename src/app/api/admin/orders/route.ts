// Admin Orders API
// GET /api/admin/orders - Get all orders for tenant (STORE_OWNER only)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getOrdersByTenant, getOrderStats } from '@/lib/db/orders'
import { OrderFilterSchema } from '@/lib/security/schemas/order-schemas'
import { USER_ROLES } from '@/lib/types/user-role'

/**
 * GET /api/admin/orders
 * Returns all orders for the tenant (STORE_OWNER or SUPER_ADMIN only)
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - status: OrderStatus (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
 * - paymentStatus: PaymentStatus (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - minAmount: number
 * - maxAmount: number
 * - customerId: UUID
 * - sort: date-desc|date-asc|total-desc|total-asc|status-asc|status-desc
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, tenantId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Check if user has permission to view all orders
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can view all orders' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)

    const filters = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      paymentStatus: searchParams.get('paymentStatus'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      minAmount: searchParams.get('minAmount'),
      maxAmount: searchParams.get('maxAmount'),
      customerId: searchParams.get('customerId'),
      sort: searchParams.get('sort') || 'date-desc',
    }

    const validation = OrderFilterSchema.safeParse(filters)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid filters',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const validatedFilters = validation.data

    // Get orders
    const result = await getOrdersByTenant(tenantId, validatedFilters as any)

    // Get stats if requested
    const includeStats = searchParams.get('includeStats') === 'true'
    let stats = null

    if (includeStats) {
      stats = await getOrderStats(tenantId)
    }

    return NextResponse.json({
      orders: result.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        tax: Number(order.tax),
        discount: Number(order.discount),
        total: Number(order.total),
        trackingNumber: order.trackingNumber,
        customer: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        },
        items: order.items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          priceAtPurchase: Number(item.priceAtPurchase),
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.images[0]?.url || null,
          },
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      pagination: result.pagination,
      ...(stats && { stats }),
    })
  } catch (error) {
    console.error('[ADMIN] GET orders error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
