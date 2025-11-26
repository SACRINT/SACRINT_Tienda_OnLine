/**
 * Orders API - Enhanced Version
 * Task 15.2: Order API - List Orders
 *
 * GET /api/orders - Get user's orders with advanced filtering
 * POST /api/orders - Create new order
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// ============================================================================
// SCHEMAS
// ============================================================================

const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ])
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minTotal: z.coerce.number().positive().optional(),
  maxTotal: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "total", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createOrderSchema = z.object({
  tenantId: z.string().cuid(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingAddressId: z.string().cuid(),
  paymentMethod: z.enum(["STRIPE", "MERCADO_PAGO", "CASH"]),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// GET /api/orders - Enhanced with Advanced Filtering
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session.user;

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const params = listOrdersSchema.parse(searchParams);

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (session.user.role === "CUSTOMER") {
      // Customers see only their own orders
      where.userId = session.user.id;
    } else if (session.user.role === "STORE_OWNER") {
      // Store owners see orders from their tenant
      if (!tenantId) {
        return NextResponse.json(
          { error: "User has no tenant assigned" },
          { status: 404 }
        );
      }
      where.tenantId = tenantId;
    }
    // SUPER_ADMIN sees all orders (no filter)

    // Status filter
    if (params.status) {
      where.status = params.status;
    }

    // Date range filter
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        where.createdAt.lte = new Date(params.dateTo);
      }
    }

    // Total amount range filter
    if (params.minTotal || params.maxTotal) {
      where.total = {};
      if (params.minTotal) {
        where.total.gte = params.minTotal;
      }
      if (params.maxTotal) {
        where.total.lte = params.maxTotal;
      }
    }

    // Search filter (orderNumber, customerName, customerEmail)
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: "insensitive" } },
        { customerName: { contains: params.search, mode: "insensitive" } },
        { customerEmail: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Pagination
    const skip = (params.page - 1) * params.limit;
    const take = params.limit;

    // Sorting
    const orderBy: any = {};
    orderBy[params.sortBy] = params.sortOrder;

    // Execute query
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
                    select: { url: true },
                    take: 1,
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
        take,
      }),
      db.order.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / params.limit);

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName || order.user?.name,
        customerEmail: order.customerEmail || order.user?.email,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        tax: Number(order.tax),
        discount: Number(order.discount),
        total: Number(order.total),
        itemCount: order.items.length,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: Number(item.price),
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
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPreviousPage: params.page > 1,
      },
    });
  } catch (error) {
    console.error("[ORDERS] GET error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/orders - Create New Order
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createOrderSchema.parse(body);

    // Get products with prices
    const products = await db.product.findMany({
      where: {
        id: { in: data.items.map((i) => i.productId) },
        tenantId: data.tenantId,
        published: true,
      },
    });

    if (products.length !== data.items.length) {
      return NextResponse.json(
        { error: "One or more products not found or unavailable" },
        { status: 404 }
      );
    }

    // Verify stock availability
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for product: ${product?.name || item.productId}`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const itemsWithPrices = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        ...item,
        price: Number(product.basePrice),
        productName: product.name,
      };
    });

    const subtotal = itemsWithPrices.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let discount = 0;

    // Apply coupon if provided
    if (data.couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: data.couponCode,
          tenantId: data.tenantId,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (coupon) {
        if (coupon.discountType === "PERCENTAGE") {
          discount = (subtotal * Number(coupon.discountValue)) / 100;
        } else {
          discount = Number(coupon.discountValue);
        }

        // Increment usage count
        await db.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const total = subtotal - discount;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order in transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId: data.tenantId,
          userId: session.user.id,
          orderNumber,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: data.paymentMethod,
          subtotal,
          discount,
          total,
          notes: data.notes,
          shippingAddressId: data.shippingAddressId,
          items: {
            create: itemsWithPrices.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[ORDERS] POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
