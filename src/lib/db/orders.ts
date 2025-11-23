// Orders Data Access Layer
// CRUD and transaction functions for order management
// ✅ PERFORMANCE [P0.4]: Fixed N+1 query in order creation

import { db } from "./client";
import { ensureTenantAccess } from "./tenant";
import { getCartById, clearCart } from "./cart";
import { validateCoupon, calculateDiscount, incrementCouponUsage } from "./coupons";
import { logger } from "@/lib/monitoring/logger";
import type { Prisma } from "@prisma/client";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@/lib/types/user-role";

/**
 * Generates a unique order number
 * Format: ORD-YYYY-NNNNNN
 */
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Get the last order number for this year
  const lastOrder = await db.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  let sequence = 1;

  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2] || "0", 10);
    sequence = lastSequence + 1;
  }

  const orderNumber = `${prefix}${sequence.toString().padStart(6, "0")}`;

  return orderNumber;
}

/**
 * Creates an order from a cart
 * This is a complex transaction that:
 * 1. Validates cart and stock
 * 2. Creates order and order items
 * 3. Confirms stock deduction
 * 4. Clears cart
 *
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @param cartId - Cart ID
 * @param shippingAddressId - Shipping address ID
 * @param billingAddressId - Billing address ID (optional, uses shipping if null)
 * @param paymentMethod - Payment method
 * @param paymentIntentId - Stripe payment intent ID (optional)
 * @param couponCode - Coupon code (optional)
 * @param notes - Customer notes (optional)
 * @returns Created order
 */
export async function createOrder(data: {
  userId: string;
  tenantId: string;
  cartId: string;
  shippingAddressId: string;
  billingAddressId?: string | null;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string | null;
  couponCode?: string | null;
  notes?: string | null;
}) {
  await ensureTenantAccess(data.tenantId);

  // Get cart with items
  const cart = await getCartById(data.tenantId, data.cartId);

  if (!cart) {
    throw new Error("Cart not found or does not belong to tenant");
  }

  if (cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  if (cart.userId !== data.userId) {
    throw new Error("Cart does not belong to this user");
  }

  // Verify addresses belong to user
  const [shippingAddress, billingAddress] = await Promise.all([
    db.address.findFirst({
      where: { id: data.shippingAddressId, userId: data.userId },
    }),
    data.billingAddressId
      ? db.address.findFirst({
          where: { id: data.billingAddressId, userId: data.userId },
        })
      : null,
  ]);

  if (!shippingAddress) {
    throw new Error("Shipping address not found");
  }

  if (data.billingAddressId && !billingAddress) {
    throw new Error("Billing address not found");
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum: any, item: any) => {
    const price = Number(item.priceSnapshot);
    return sum + price * item.quantity;
  }, 0);

  // Free shipping if subtotal > $100
  const shippingCost = subtotal > 1000 ? 0 : 99; // $9.99 shipping

  // Tax rate 16%
  const tax = subtotal * 0.16;

  // Discount from coupon
  let discount = 0;
  let validatedCoupon = null;

  if (data.couponCode) {
    try {
      // Validate coupon before applying discount
      validatedCoupon = await validateCoupon(
        data.tenantId,
        data.couponCode,
        subtotal + shippingCost + tax,
      );

      // Calculate discount amount
      discount = calculateDiscount(
        {
          type: validatedCoupon.type,
          value: validatedCoupon.value,
          maxDiscount: validatedCoupon.maxDiscount,
        },
        subtotal + shippingCost + tax,
      );

      logger.info(
        {
          couponCode: data.couponCode,
          discount,
          tenantId: data.tenantId,
        },
        "Coupon applied to order",
      );
    } catch (error) {
      logger.warn(
        {
          couponCode: data.couponCode,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Coupon validation failed",
      );
      // Continue without discount if coupon is invalid
      // The API layer should validate before calling this, but we handle it gracefully
    }
  }

  const total = subtotal + shippingCost + tax - discount;

  // Generate order number
  const orderNumber = await generateOrderNumber();

  // Create order with transaction
  const order = await db.$transaction(async (tx: any) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        tenantId: data.tenantId,
        userId: data.userId,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId || data.shippingAddressId,
        paymentMethod: data.paymentMethod,
        paymentId: data.paymentIntentId,
        paymentStatus: data.paymentIntentId ? "COMPLETED" : "PENDING",
        status: data.paymentIntentId ? "PROCESSING" : "PENDING",
        couponCode: data.couponCode,
        notes: data.notes,
      },
    });

    // Create order items
    // ✅ PERFORMANCE: Using createMany() instead of loop with create()
    // Reduces N queries to 1 query (10x faster for 10 items)
    // NOTE: Stock is NO LONGER deducted here
    // Stock management now uses the inventory reservation system:
    // 1. Reserve inventory after order creation (checkout route)
    // 2. Confirm reservation after payment success
    await tx.orderItem.createMany({
      data: cart.items.map((cartItem: any) => ({
        orderId: newOrder.id,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        priceAtPurchase: cartItem.priceSnapshot,
      })),
    });

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: data.cartId },
    });

    return newOrder;
  });

  logger.info(
    {
      orderNumber,
      userId: data.userId,
      tenantId: data.tenantId,
      total,
      itemCount: cart.items.length,
    },
    "Order created successfully",
  );

  // Increment coupon usage count if coupon was used
  if (validatedCoupon) {
    try {
      await incrementCouponUsage(validatedCoupon.id);
      logger.info({ couponCode: data.couponCode }, "Incremented coupon usage count");
    } catch (error) {
      logger.error(
        {
          couponCode: data.couponCode,
          error,
        },
        "Failed to increment coupon usage",
      );
      // Don't fail the order if coupon increment fails
    }
  }

  // Return order with items
  return await getOrderById(order.id, data.tenantId);
}

/**
 * Gets order by ID with full details and tenant validation
 * @param orderId - Order ID
 * @param tenantId - Tenant ID for validation
 * @returns Order with items and addresses
 */
export async function getOrderById(orderId: string, tenantId: string) {
  await ensureTenantAccess(tenantId);

  const order = await db.order.findFirst({
    where: {
      id: orderId,
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
              images: {
                take: 1,
                orderBy: { order: "asc" },
              },
            },
          },
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              model: true,
            },
          },
        },
      },
      shippingAddress: true,
      billingAddress: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return order;
}

/**
 * Gets all orders for a user
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @param filters - Optional filters
 * @returns Orders with pagination
 */
export async function getOrdersByUser(
  userId: string,
  tenantId: string,
  filters?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  },
) {
  await ensureTenantAccess(tenantId);

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
    tenantId,
    ...(filters?.status && { status: filters.status }),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  take: 1,
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets all orders for a tenant (STORE_OWNER only)
 * @param tenantId - Tenant ID
 * @param filters - Filters for status, dates, amount, etc.
 * @returns Orders with pagination
 */
export async function getOrdersByTenant(
  tenantId: string,
  filters: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    customerId?: string;
    sort?: string;
  },
) {
  await ensureTenantAccess(tenantId);

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    tenantId,
    ...(filters.status && { status: filters.status }),
    ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
    ...(filters.customerId && { userId: filters.customerId }),
    ...(filters.minAmount && { total: { gte: filters.minAmount } }),
    ...(filters.maxAmount && { total: { lte: filters.maxAmount } }),
    ...(filters.startDate &&
      filters.endDate && {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
  };

  // Determine sort order
  let orderBy: any = { createdAt: "desc" };

  if (filters.sort) {
    const sortMap: Record<string, any> = {
      "date-asc": { createdAt: "asc" },
      "date-desc": { createdAt: "desc" },
      "total-asc": { total: "asc" },
      "total-desc": { total: "desc" },
      "status-asc": { status: "asc" },
      "status-desc": { status: "desc" },
    };

    orderBy = sortMap[filters.sort] || orderBy;
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  take: 1,
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Updates order status
 * @param orderId - Order ID
 * @param status - New status
 * @param trackingNumber - Optional tracking number
 * @param adminNotes - Optional admin notes
 * @returns Updated order
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  adminNotes?: string,
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { tenantId: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  await ensureTenantAccess(order.tenantId);

  const updated = await db.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(adminNotes && { adminNotes }),
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  console.log(`[ORDERS] Updated order ${orderId} status to ${status}`);

  return updated;
}

/**
 * Cancels an order and restores stock
 * @param orderId - Order ID
 * @returns Cancelled order
 */
export async function cancelOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  await ensureTenantAccess(order.tenantId);

  // Only allow cancellation of PENDING or PROCESSING orders
  if (!["PENDING", "PROCESSING"].includes(order.status)) {
    throw new Error("Cannot cancel order in current status");
  }

  // Restore stock for all items
  await db.$transaction(async (tx: any) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
          reserved: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
      },
    });
  });

  console.log(`[ORDERS] Cancelled order ${orderId} and restored stock`);

  return await getOrderById(orderId, order.tenantId);
}

/**
 * Gets order statistics for a tenant
 * @param tenantId - Tenant ID
 * @returns Order stats
 */
export async function getOrderStats(tenantId: string) {
  await ensureTenantAccess(tenantId);

  const [totalOrders, totalRevenue, pendingOrders, processingOrders, shippedOrders] =
    await Promise.all([
      db.order.count({ where: { tenantId } }),
      db.order.aggregate({
        where: { tenantId, paymentStatus: "COMPLETED" },
        _sum: { total: true },
      }),
      db.order.count({ where: { tenantId, status: "PENDING" } }),
      db.order.count({ where: { tenantId, status: "PROCESSING" } }),
      db.order.count({ where: { tenantId, status: "SHIPPED" } }),
    ]);

  return {
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.total || 0),
    pendingOrders,
    processingOrders,
    shippedOrders,
  };
}
