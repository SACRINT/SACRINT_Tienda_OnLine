// Order Detail API
// GET /api/orders/[id] - Get order details
// PATCH /api/orders/[id] - Update order status (STORE_OWNER only)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getOrderById, updateOrderStatus } from '@/lib/db/orders'
import { OrderStatusUpdateSchema } from '@/lib/security/schemas/order-schemas'
import { USER_ROLES } from '@/lib/types/user-role'

/**
 * GET /api/orders/[id]
 * Returns order details with items and addresses
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    const orderId = params.id

    const order = await getOrderById(orderId, tenantId)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify user has access to this order
    if (order.userId !== session.user.id && session.user.role !== USER_ROLES.STORE_OWNER && session.user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this order' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentId: order.paymentId,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        tax: Number(order.tax),
        discount: Number(order.discount),
        total: Number(order.total),
        couponCode: order.couponCode,
        notes: order.notes,
        adminNotes: order.adminNotes,
        trackingNumber: order.trackingNumber,
        shippingMethod: order.shippingMethod,
        shippingAddress: {
          name: order.shippingAddress.name,
          email: order.shippingAddress.email,
          phone: order.shippingAddress.phone,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        },
        billingAddress: order.billingAddress ? {
          name: order.billingAddress.name,
          email: order.billingAddress.email,
          phone: order.billingAddress.phone,
          street: order.billingAddress.street,
          city: order.billingAddress.city,
          state: order.billingAddress.state,
          postalCode: order.billingAddress.postalCode,
          country: order.billingAddress.country,
        } : null,
        items: order.items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          priceAtPurchase: Number(item.priceAtPurchase),
          subtotal: Number(item.priceAtPurchase) * item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.images[0]?.url || null,
          },
          variant: item.variant ? {
            id: item.variant.id,
            size: item.variant.size,
            color: item.variant.color,
            model: item.variant.model,
          } : null,
        })),
        user: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error('[ORDERS] GET [id] error:', error)

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/orders/[id]
 * Updates order status (STORE_OWNER or SUPER_ADMIN only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user has permission to update orders
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can update orders' },
        { status: 403 }
      )
    }

    const orderId = params.id

    const body = await req.json()
    const validation = OrderStatusUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { status, trackingNumber, adminNotes } = validation.data

    try {
      const order = await updateOrderStatus(
        orderId,
        status,
        trackingNumber,
        adminNotes
      )

      console.log(`[ORDERS] Updated order ${orderId} status to ${status} by user ${session.user.id}`)

      return NextResponse.json({
        message: 'Order updated successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
          adminNotes: order.adminNotes,
          updatedAt: order.updatedAt,
        },
      })
    } catch (error) {
      console.error('[ORDERS] PATCH error:', error)

      return NextResponse.json(
        {
          error: 'Failed to update order',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[ORDERS] PATCH error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
