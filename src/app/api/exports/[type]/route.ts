/**
 * Data Export API
 * Task 12.12: Data Exports
 *
 * Exporta datos en formato CSV, JSON, Excel
 * Tipos: products, orders, customers, analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const exportSchema = z.object({
  tenantId: z.string().cuid(),
  format: z.enum(["csv", "json"]).default("csv"),
  filters: z
    .object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

/**
 * Convierte array de objetos a CSV
 */
function jsonToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        // Escapar comillas y envolver en comillas si contiene coma
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(","),
  );

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * GET /api/exports/[type]
 */
export async function GET(req: NextRequest, { params }: { params: { type: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { tenantId, format, filters } = exportSchema.parse({
      ...searchParams,
      filters: searchParams.filters ? JSON.parse(searchParams.filters) : {},
    });

    // Verificar acceso al tenant
    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let data: any[] = [];
    let filename = `export-${params.type}-${Date.now()}`;

    // Obtener datos según tipo
    switch (params.type) {
      case "products":
        const products = await db.product.findMany({
          where: { tenantId },
          include: {
            category: { select: { name: true } },
          },
          take: 10000, // Límite de seguridad
        });

        data = products.map((p) => ({
          ID: p.id,
          SKU: p.sku,
          Name: p.name,
          Category: p.category?.name || "",
          Price: Number(p.basePrice),
          Stock: p.stock,
          Published: p.published ? "Yes" : "No",
          Created: p.createdAt.toISOString(),
        }));
        break;

      case "orders":
        const dateFrom = filters?.dateFrom ? new Date(filters.dateFrom) : undefined;
        const dateTo = filters?.dateTo ? new Date(filters.dateTo) : undefined;

        const orders = await db.order.findMany({
          where: {
            tenantId,
            ...(dateFrom && { createdAt: { gte: dateFrom } }),
            ...(dateTo && { createdAt: { lte: dateTo } }),
            ...(filters?.status && { status: filters.status as any }),
          },
          include: {
            user: { select: { name: true, email: true } },
          },
          take: 10000,
        });

        data = orders.map((o) => ({
          OrderNumber: o.orderNumber,
          Customer: o.customerName || o.user?.name || "Guest",
          Email: o.customerEmail || o.user?.email || "",
          Total: Number(o.total),
          Status: o.status,
          PaymentStatus: o.paymentStatus,
          Created: o.createdAt.toISOString(),
        }));
        break;

      case "customers":
        const users = await db.user.findMany({
          where: {
            tenantId,
            role: "CUSTOMER",
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            _count: {
              select: { orders: true },
            },
          },
          take: 10000,
        });

        data = users.map((u) => ({
          ID: u.id,
          Name: u.name || "",
          Email: u.email,
          TotalOrders: u._count.orders,
          Registered: u.createdAt.toISOString(),
        }));
        break;

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    // Generar respuesta según formato
    if (format === "csv") {
      const csv = jsonToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
