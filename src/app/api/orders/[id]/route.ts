/**
 * Order Detail API
 * Tasks 15.3, 15.4, 15.5: Order Detail, Status Update, Cancellation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  validateTransition,
  executeTransitionLogic,
  canBeCancelled,
  type OrderStatus,
} from "@/lib/orders/status-workflow";

const updateStatusSchema = z.object({
  newStatus: z.enum([
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  reason: z.string().optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().min(1),
  refund: z.boolean().default(true),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, sku: true, images: { select: { url: true }, take: 1 } },
          },
        },
      },
      shippingAddress: true,
      user: { select: { id: true, name: true, email: true } },
      shipping: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isOwner = order.userId === session.user.id;
  const isStoreOwner = session.user.role === "STORE_OWNER" && session.user.tenantId === order.tenantId;
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isOwner && !isStoreOwner && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = updateStatusSchema.parse(body);

  const order = await db.order.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, tenantId: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const validation = validateTransition(order.status as OrderStatus, data.newStatus as OrderStatus);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await executeTransitionLogic(order.id, order.status as OrderStatus, data.newStatus as OrderStatus);

  const updatedOrder = await db.order.update({
    where: { id: params.id },
    data: { status: data.newStatus, updatedAt: new Date() },
  });

  return NextResponse.json(updatedOrder);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = cancelOrderSchema.parse(body);

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!canBeCancelled(order.status as OrderStatus)) {
    return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: params.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), notes: data.reason },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });

  return NextResponse.json({ message: "Order cancelled" });
}
