// GET /api/customers/:id
// Get detailed customer information

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    // Get customer with orders and addresses
    const customer = await db.user.findUnique({
      where: {
        id: params.id,
        role: "CUSTOMER",
      },
      include: {
        orders: {
          where: {
            tenantId,
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        addresses: {
          orderBy: {
            isDefault: "desc",
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Calculate stats
    const completedOrders = customer.orders.filter(
      (o: any) => o.status !== "CANCELLED",
    );
    const totalOrders = completedOrders.length;
    const totalSpent = completedOrders.reduce(
      (sum: number, order: any) => sum + order.total,
      0,
    );
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrder = completedOrders[0];

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      orders: customer.orders,
      addresses: customer.addresses,
      stats: {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
      },
    });
  } catch (error) {
    console.error("Get customer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
