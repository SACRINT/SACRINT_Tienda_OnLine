// GET /api/customers/bulk
// Export customers to CSV

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "STORE_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const customerIdsParam = searchParams.get("customerIds");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    if (
      session.user.role === "STORE_OWNER" &&
      session.user.tenantId !== tenantId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customerIds = customerIdsParam
      ? customerIdsParam.split(",")
      : undefined;

    // Get customers with order stats
    const customers = await db.user.findMany({
      where: {
        role: "CUSTOMER",
        ...(customerIds && { id: { in: customerIds } }),
        orders: {
          some: {
            tenantId,
          },
        },
      },
      include: {
        orders: {
          where: {
            tenantId,
            status: { not: "CANCELLED" },
          },
        },
      },
    });

    // Calculate stats for each customer
    const customersWithStats = customers.map((customer: any) => {
      const orders = customer.orders;
      const totalOrders = orders.length;
      const totalSpent = orders.reduce(
        (sum: number, order: any) => sum + order.total,
        0,
      );
      const lastOrder = orders.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      return {
        id: customer.id,
        name: customer.name || "",
        email: customer.email,
        phone: customer.phone || "",
        totalOrders,
        totalSpent: (totalSpent / 100).toFixed(2),
        lastOrderDate: lastOrder
          ? new Date(lastOrder.createdAt).toISOString().split("T")[0]
          : "",
        createdAt: new Date(customer.createdAt).toISOString().split("T")[0],
      };
    });

    // Generate CSV
    const csvHeaders = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Total Orders",
      "Total Spent (USD)",
      "Last Order Date",
      "Customer Since",
    ];

    const csvRows = customersWithStats.map((customer: any) => [
      customer.id,
      `"${customer.name.replace(/"/g, '""')}"`,
      customer.email,
      customer.phone,
      customer.totalOrders,
      customer.totalSpent,
      customer.lastOrderDate,
      customer.createdAt,
    ]);

    const csv = [
      csvHeaders.join(","),
      ...csvRows.map((row: any) => row.join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="customers-export-${new Date().toISOString()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Customer export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
