// Cart Data Access Layer
// CRUD and validation functions for shopping cart management

import { db } from './client'
import { ensureTenantAccess } from './tenant'
import { checkProductStock, reserveStock, releaseStock } from './products'

/**
 * Creates or retrieves existing cart for a user
 * @param userId - User ID
 * @param tenantId - Tenant ID for isolation
 * @returns Cart with items
 */
export async function getOrCreateCart(userId: string, tenantId: string) {
  await ensureTenantAccess(tenantId)

  let cart = await db.cart.findUnique({
    where: {
      userId_tenantId: { userId, tenantId },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              stock: true,
              reserved: true,
              published: true,
              images: {
                take: 1,
                orderBy: { order: 'asc' },
              },
            },
          },
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              model: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
  })

  if (!cart) {
    cart = await db.cart.create({
      data: {
        userId,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                stock: true,
                reserved: true,
                published: true,
                images: {
                  take: 1,
                  orderBy: { order: 'asc' },
                },
              },
            },
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                model: true,
                price: true,
                stock: true,
              },
            },
          },
        },
      },
    })
  }

  return cart
}

/**
 * Gets cart by ID with tenant access validation
 * @param tenantId - Tenant ID to validate access
 * @param cartId - Cart ID
 * @returns Cart with items or null
 */
export async function getCartById(tenantId: string, cartId: string) {
  await ensureTenantAccess(tenantId)

  const cart = await db.cart.findFirst({
    where: {
      id: cartId,
      tenantId
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              stock: true,
              reserved: true,
              published: true,
              images: {
                take: 1,
                orderBy: { order: 'asc' },
              },
            },
          },
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              model: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
  })

  return cart
}

/**
 * Adds or updates an item in the cart with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param cartId - Cart ID
 * @param productId - Product ID
 * @param variantId - Optional variant ID
 * @param quantity - Quantity to add
 * @returns Updated cart item
 */
export async function addItemToCart(
  tenantId: string,
  cartId: string,
  productId: string,
  variantId: string | null | undefined,
  quantity: number
) {
  await ensureTenantAccess(tenantId)

  // Get cart and validate tenant access
  const cart = await getCartById(tenantId, cartId)

  if (!cart) {
    throw new Error('Cart not found or does not belong to tenant')
  }

  // Validate quantity
  if (quantity <= 0) {
    throw new Error('Quantity must be positive')
  }

  // Check if product is available and in stock
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      variants: variantId ? { where: { id: variantId } } : undefined,
    },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  if (!product.published) {
    throw new Error('Product is not available for purchase')
  }

  if (product.tenantId !== cart.tenantId) {
    throw new Error('Product does not belong to this store')
  }

  // Validate stock
  let availableStock: number

  if (variantId && product.variants.length > 0) {
    const variant = product.variants[0]
    availableStock = variant.stock
  } else {
    const stockInfo = await checkProductStock(tenantId, productId)
    availableStock = stockInfo.availableStock
  }

  // Check if item already exists
  // Note: Prisma has a known issue with nullable fields in composite unique constraints
  // We work around this by using 'findFirst' instead
  const existingItem = await db.cartItem.findFirst({
    where: {
      cartId,
      productId,
      variantId: variantId ?? null,
    },
  })

  let newQuantity = quantity

  if (existingItem) {
    newQuantity = existingItem.quantity + quantity
  }

  if (newQuantity > availableStock) {
    throw new Error(
      `Insufficient stock. Available: ${availableStock}, Requested: ${newQuantity}`
    )
  }

  // Get current price (variant price or product price)
  let currentPrice = product.salePrice || product.basePrice

  if (variantId && product.variants.length > 0 && product.variants[0].price) {
    currentPrice = product.variants[0].price
  }

  // Update or create cart item
  let cartItem
  if (existingItem) {
    cartItem = await db.cartItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity: newQuantity,
        priceSnapshot: currentPrice,
      },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          stock: true,
          images: {
            take: 1,
            orderBy: { order: 'asc' },
          },
        },
      },
      variant: true,
    },
    })
  } else {
    cartItem = await db.cartItem.create({
      data: {
        cartId,
        productId,
        variantId: variantId ?? null,
        quantity,
        priceSnapshot: currentPrice,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            salePrice: true,
            stock: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        variant: true,
      },
    })
  }

  return cartItem
}

/**
 * Updates quantity of a cart item with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param cartItemId - Cart item ID
 * @param quantity - New quantity
 * @returns Updated cart item
 */
export async function updateCartItemQuantity(
  tenantId: string,
  cartItemId: string,
  quantity: number
) {
  await ensureTenantAccess(tenantId)

  if (quantity <= 0) {
    throw new Error('Quantity must be positive. Use removeCartItem to delete.')
  }

  const cartItem = await db.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: {
        tenantId
      }
    },
    include: {
      cart: true,
      product: true,
      variant: true,
    },
  })

  if (!cartItem) {
    throw new Error('Cart item not found or does not belong to tenant')
  }

  // Check stock availability
  let availableStock: number

  if (cartItem.variant) {
    availableStock = cartItem.variant.stock
  } else {
    const stockInfo = await checkProductStock(tenantId, cartItem.productId)
    availableStock = stockInfo.availableStock
  }

  if (quantity > availableStock) {
    throw new Error(
      `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
    )
  }

  // Update quantity
  const updated = await db.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          images: {
            take: 1,
            orderBy: { order: 'asc' },
          },
        },
      },
      variant: true,
    },
  })

  return updated
}

/**
 * Removes an item from the cart
 * @param cartItemId - Cart item ID
 */
export async function removeCartItem(cartItemId: string) {
  const cartItem = await db.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
    },
  })

  if (!cartItem) {
    throw new Error('Cart item not found')
  }

  // Validate tenant access
  await ensureTenantAccess(cartItem.cart.tenantId)

  await db.cartItem.delete({
    where: { id: cartItemId },
  })

  return { success: true }
}

/**
 * Clears all items from a cart with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param cartId - Cart ID
 */
export async function clearCart(tenantId: string, cartId: string) {
  await ensureTenantAccess(tenantId)

  const cart = await getCartById(tenantId, cartId)

  if (!cart) {
    throw new Error('Cart not found or does not belong to tenant')
  }

  await db.cartItem.deleteMany({
    where: { cartId },
  })

  return { success: true }
}

/**
 * Calculates cart total with tax and shipping and tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param cartId - Cart ID
 * @param shippingCost - Shipping cost (default 0)
 * @param taxRate - Tax rate as decimal (default 0.16 = 16%)
 * @returns Cart totals breakdown
 */
export async function getCartTotal(
  tenantId: string,
  cartId: string,
  shippingCost: number = 0,
  taxRate: number = 0.16
) {
  await ensureTenantAccess(tenantId)

  const cart = await getCartById(tenantId, cartId)

  if (!cart) {
    throw new Error('Cart not found or does not belong to tenant')
  }

  // Calculate subtotal from cart items
  const subtotal = cart.items.reduce((sum: any, item: any) => {
    const price = Number(item.priceSnapshot)
    return sum + price * item.quantity
  }, 0)

  // Free shipping if subtotal > $100
  const finalShippingCost = subtotal > 1000 ? 0 : shippingCost

  // Calculate tax on subtotal only
  const tax = subtotal * taxRate

  // Calculate total
  const total = subtotal + finalShippingCost + tax

  return {
    subtotal: Number(subtotal.toFixed(2)),
    shippingCost: Number(finalShippingCost.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount: cart.items.reduce((sum: any, item: any) => sum + item.quantity, 0),
    items: cart.items.length,
  }
}

/**
 * Validates cart before checkout with tenant validation
 * Checks:
 * - All products still exist and are published
 * - All products have sufficient stock
 * - Prices haven't changed significantly (>10%)
 * @param tenantId - Tenant ID to validate access
 * @param cartId - Cart ID
 * @returns Validation result with warnings
 */
export async function validateCartBeforeCheckout(tenantId: string, cartId: string) {
  await ensureTenantAccess(tenantId)

  const cart = await getCartById(tenantId, cartId)

  if (!cart) {
    throw new Error('Cart not found or does not belong to tenant')
  }

  if (cart.items.length === 0) {
    throw new Error('Cart is empty')
  }

  const warnings: string[] = []
  const errors: string[] = []

  // Validate each item
  for (const item of cart.items) {
    const product = await db.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: item.variantId ? { where: { id: item.variantId } } : undefined,
      },
    })

    // Check if product still exists
    if (!product) {
      errors.push(`Product "${item.product.name}" no longer exists`)
      continue
    }

    // Check if product is published
    if (!product.published) {
      errors.push(`Product "${product.name}" is no longer available`)
      continue
    }

    // Check stock
    let availableStock: number
    let currentPrice: number = Number(product.salePrice || product.basePrice)

    if (item.variant && product.variants.length > 0) {
      const variant = product.variants[0]
      availableStock = variant.stock
      if (variant.price) {
        currentPrice = Number(variant.price)
      }
    } else {
      const stockInfo = await checkProductStock(tenantId, product.id)
      availableStock = stockInfo.availableStock
    }

    if (item.quantity > availableStock) {
      errors.push(
        `Insufficient stock for "${product.name}". Available: ${availableStock}, In cart: ${item.quantity}`
      )
    }

    // Check price changes (>10% difference triggers warning)
    const priceSnapshot = Number(item.priceSnapshot)
    const currentPriceNum = Number(currentPrice)
    const priceDifference = Math.abs(currentPriceNum - priceSnapshot)
    const percentChange = (priceDifference / priceSnapshot) * 100

    if (percentChange > 10) {
      warnings.push(
        `Price changed for "${product.name}". Was $${priceSnapshot.toFixed(2)}, now $${currentPriceNum.toFixed(2)}`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Gets user's active cart for a tenant
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns Cart or null
 */
export async function getUserCart(userId: string, tenantId: string) {
  await ensureTenantAccess(tenantId)

  return await db.cart.findUnique({
    where: {
      userId_tenantId: { userId, tenantId },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              stock: true,
              reserved: true,
              published: true,
              images: {
                take: 1,
                orderBy: { order: 'asc' },
              },
            },
          },
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              model: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
  })
}
