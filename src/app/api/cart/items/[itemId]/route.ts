// Cart Item API
// PATCH /api/cart/items/[itemId] - Update item quantity
// DELETE /api/cart/items/[itemId] - Remove item from cart

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  updateCartItemQuantity,
  removeCartItem,
} from '@/lib/db/cart'
import { UpdateCartItemSchema } from '@/lib/security/schemas/order-schemas'

/**
 * PATCH /api/cart/items/[itemId]
 * Updates cart item quantity
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
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

    const itemId = params.itemId

    const body = await req.json()
    const validation = UpdateCartItemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { quantity } = validation.data

    try {
      const cartItem = await updateCartItemQuantity(itemId, quantity)

      console.log(
        `[CART] Updated item ${itemId} quantity to ${quantity}`
      )

      return NextResponse.json({
        message: 'Cart item updated',
        cartItem: {
          id: cartItem.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          priceSnapshot: Number(cartItem.priceSnapshot),
          product: {
            id: cartItem.product.id,
            name: cartItem.product.name,
            slug: cartItem.product.slug,
            image: cartItem.product.images[0]?.url || null,
          },
          variant: cartItem.variant || null,
        },
      })
    } catch (error) {
      console.error('[CART] Update item error:', error)

      return NextResponse.json(
        {
          error: 'Failed to update cart item',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[CART] PATCH error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cart/items/[itemId]
 * Removes item from cart
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
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

    const itemId = params.itemId

    try {
      await removeCartItem(itemId)

      console.log(`[CART] Removed item ${itemId} from cart`)

      return NextResponse.json({
        message: 'Item removed from cart',
      })
    } catch (error) {
      console.error('[CART] Remove item error:', error)

      return NextResponse.json(
        {
          error: 'Failed to remove cart item',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[CART] DELETE error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
