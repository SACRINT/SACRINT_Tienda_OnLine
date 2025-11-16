// Inventory Reservation API
// POST /api/inventory/reserve - Reserve inventory for an order

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { reserveInventory } from '@/lib/db/inventory'
import { getOrderById } from '@/lib/db/orders'
import { ReserveInventorySchema } from '@/lib/security/schemas/review-schemas'

/**
 * POST /api/inventory/reserve
 * Reserves inventory for an order without deducting stock
 * Must be called after order creation, before payment
 * Requires authentication
 *
 * Body:
 * - orderId: UUID
 * - items: Array<{
 *     productId: UUID
 *     variantId?: UUID
 *     quantity: number
 *   }>
 *
 * Flow:
 * 1. Order created → 2. Reserve inventory → 3. Process payment → 4. Confirm reservation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
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

    // Parse and validate request body
    const body = await req.json()
    const validation = ReserveInventorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { orderId, items } = validation.data

    // Verify order exists and belongs to tenant
    const order = await getOrderById(orderId, tenantId)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify order belongs to current user or user is STORE_OWNER
    if (
      order.userId !== session.user.id &&
      session.user.role !== 'STORE_OWNER' &&
      session.user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        {
          error: 'Forbidden - You do not have access to this order',
        },
        { status: 403 }
      )
    }

    // Reserve inventory (this validates stock availability)
    try {
      const reservationId = await reserveInventory(orderId, items)

      console.log(
        `[INVENTORY] Reserved inventory for order ${orderId}: reservation ${reservationId}`
      )

      return NextResponse.json(
        {
          message: 'Inventory reserved successfully',
          reservationId,
          orderId,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          })),
        },
        { status: 201 }
      )
    } catch (error) {
      // Handle insufficient stock error
      if (error instanceof Error && error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          {
            error: 'Conflict - Insufficient stock',
            message: error.message,
          },
          { status: 409 }
        )
      }

      throw error
    }
  } catch (error) {
    console.error('[INVENTORY] Reserve error:', error)

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          {
            error: 'Conflict - Insufficient stock',
            message: error.message,
          },
          { status: 409 }
        )
      }
      if (error.message.includes('Quantity must be positive')) {
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
