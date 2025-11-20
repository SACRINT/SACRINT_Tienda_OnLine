/**
 * Bulk Product Import API
 * POST /api/products/import
 * Imports products from CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { parseCSV, validateProductImport } from "@/lib/import/csv";
import { logger } from "@/lib/monitoring/logger";
import { USER_ROLES } from "@/lib/types/user-role";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can import
    if (session.user.role !== USER_ROLES.STORE_OWNER && session.user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read CSV content
    const csvContent = await file.text();

    // Parse CSV
    const parsedData = parseCSV(csvContent);

    // Validate data
    const { valid, invalid } = validateProductImport(parsedData);

    if (valid.length === 0) {
      return NextResponse.json(
        {
          error: "No valid products found",
          invalid,
        },
        { status: 400 }
      );
    }

    // Get or create default category
    let defaultCategory = await db.category.findFirst({
      where: { tenantId, name: "Imported" },
    });

    if (!defaultCategory) {
      defaultCategory = await db.category.create({
        data: {
          tenantId,
          name: "Imported",
          slug: "imported",
          description: "Products imported from CSV",
        },
      });
    }

    // Import products
    const imported: any[] = [];
    const errors: any[] = [];

    for (const product of valid) {
      try {
        // Check if SKU already exists
        const existing = await db.product.findUnique({
          where: { tenantId_sku: { tenantId, sku: product.sku } },
        });

        if (existing) {
          errors.push({
            sku: product.sku,
            error: "SKU already exists",
          });
          continue;
        }

        // Create product
        const created = await db.product.create({
          data: {
            tenantId,
            name: product.name,
            sku: product.sku,
            description: product.description,
            shortDescription: product.description.substring(0, 160),
            slug: product.sku.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            basePrice: product.basePrice,
            salePrice: product.salePrice,
            stock: product.stock,
            published: product.published,
            weight: product.weight,
            length: product.length,
            width: product.width,
            height: product.height,
            categoryId: defaultCategory.id,
            lowStockThreshold: 5,
          },
        });

        imported.push({
          sku: created.sku,
          name: created.name,
        });
      } catch (error) {
        errors.push({
          sku: product.sku,
          error: error instanceof Error ? error.message : "Failed to create product",
        });
      }
    }

    logger.info("Bulk product import completed", {
      userId: session.user.id,
      tenantId,
      imported: imported.length,
      errors: errors.length,
      invalid: invalid.length,
    });

    return NextResponse.json({
      success: true,
      imported: imported.length,
      errors: errors.length > 0 ? errors : undefined,
      invalid: invalid.length > 0 ? invalid : undefined,
      products: imported,
    });
  } catch (error) {
    logger.error("Bulk import failed", error as Error);
    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    );
  }
}
