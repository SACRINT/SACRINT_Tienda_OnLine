// Cart API
// GET /api/cart - Get user's cart
// POST /api/cart/items - Add item to cart

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  getOrCreateCart,
  getUserCart,
  addItemToCart,
  getCartTotal,
} from '@/lib/db/cart'
import { AddCartItemSchema } from '@/lib/security/schemas/order-schemas'

/**
 * GET /api/cart
 * Returns user's cart with items
 */
export async function GET(req: NextRequest) {
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

    // Get or create cart
    const cart = await getOrCreateCart(session.user.id, tenantId)

    // Calculate totals
    const totals = await getCartTotal(cart.id, 99, 0.16)

    return NextResponse.json({
      cart: {
        id: cart.id,
        items: cart.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceSnapshot: Number(item.priceSnapshot),
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            basePrice: Number(item.product.basePrice),
            salePrice: item.product.salePrice
              ? Number(item.product.salePrice)
              : null,
            stock: item.product.stock,
            availableStock: item.product.stock - item.product.reserved,
            published: item.product.published,
            image: item.product.images[0]?.url || null,
          },
          variant: item.variant
            ? {
                id: item.variant.id,
                size: item.variant.size,
                color: item.variant.color,
                model: item.variant.model,
                price: item.variant.price ? Number(item.variant.price) : null,
                stock: item.variant.stock,
              }
            : null,
          subtotal: Number(item.priceSnapshot) * item.quantity,
        })),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
      totals,
    })
  } catch (error) {
    console.error('[CART] GET error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cart
 * Adds item to cart
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const validation = AddCartItemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { productId, variantId, quantity } = validation.data

    // Get or create cart
    const cart = await getOrCreateCart(session.user.id, tenantId)

    // Add item to cart
    try {
      const cartItem = await addItemToCart(
        cart.id,
        productId,
        variantId,
        quantity
      )

      console.log(
        `[CART] Added ${quantity}x product ${cartItem.productId} to cart ${cart.id}`
      )

      return NextResponse.json(
        {
          message: 'Item added to cart',
          cartItem: {
            id: cartItem.id,
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            quantity: cartItem.quantity,
            priceSnapshot: Number(cartItem.priceSnapshot),
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('[CART] Add item error:', error)

      return NextResponse.json(
        {
          error: 'Failed to add item to cart',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[CART] POST error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
