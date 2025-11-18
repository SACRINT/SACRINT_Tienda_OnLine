// Orders API
// GET /api/orders - Get user's orders

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getOrdersByUser } from "@/lib/db/orders";
import { OrderFilterSchema } from "@/lib/security/schemas/order-schemas";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/orders
 * Returns all orders for the current user
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - status: OrderStatus (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
 * - sort: date-desc|date-asc|total-desc|total-asc
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);

    const filters = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    };

    const validation = OrderFilterSchema.partial().safeParse(filters);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid filters",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const validatedFilters = validation.data;

    // Get orders
    const result = await getOrdersByUser(
      session.user.id,
      tenantId,
      validatedFilters as any,
    );

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
    });
  } catch (error) {
    console.error("[ORDERS] GET error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
