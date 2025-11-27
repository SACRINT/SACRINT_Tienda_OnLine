/**
 * Order Management API Routes
 * Semana 35, Tarea 35.2: Order Management API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getAdvancedOrderManager } from "@/lib/payments";
import { logger } from "@/lib/monitoring";
import { z } from "zod";

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  tenantId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive().int(),
      unitPrice: z.number().positive(),
      discount: z.number().min(0).max(100),
      taxRate: z.number().min(0).max(100),
    }),
  ),
  currency: z.string().length(3).default("USD"),
});

const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderData = createOrderSchema.parse(body);

    // Calcular totales
    const items = orderData.items.map((item) => ({
      id: `item_${Math.random()}`,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      total: item.quantity * item.unitPrice * ((100 - item.discount) / 100),
    }));

    const orderManager = getAdvancedOrderManager();
    const order = orderManager.createOrder(
      orderData.customerId,
      orderData.tenantId,
      items,
      orderData.currency,
    );

    // Reservar inventario
    orderManager.holdInventory(order.id, items);

    logger.info(
      { type: "order_created_api", orderId: order.id, customerId: orderData.customerId },
      `Orden creada a través de API`,
    );

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    logger.error({ type: "order_creation_error", error: String(error) }, "Error al crear orden");

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = request.nextUrl.searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    const orderManager = getAdvancedOrderManager();
    const orders = orderManager.getCustomerOrders(customerId, 50);

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderId: o.orderId,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
      })),
      count: orders.length,
    });
  } catch (error) {
    logger.error({ type: "order_fetch_error", error: String(error) }, "Error al obtener órdenes");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
