/**
 * Página de Listado de Productos
 * Semana 10.1: Product Listing
 *
 * Lista de productos con filtros, búsqueda y paginación
 */

import { requireAuth } from "@/lib/auth/require-auth";
import { getStoreOrThrow } from "@/lib/auth/dashboard";
import { db } from "@/lib/db";
import { ProductsTable } from "@/components/dashboard/products/ProductsTable";
import { ProductsFilters } from "@/components/dashboard/products/ProductsFilters";
import { Plus } from "lucide-react";
import Link from "next/link";

interface ProductsPageProps {
  params: {
    storeId: string;
  };
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export default async function ProductsPage({
  params: { storeId },
  searchParams,
}: ProductsPageProps) {
  // Require authentication
  const session = await requireAuth();

  // Verify store ownership
  const store = await getStoreOrThrow(storeId, session.user.id);

  // Parse search params
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;
  const search = searchParams.search || "";
  const categoryId = searchParams.category || "";
  const status = searchParams.status || "all";
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder || "desc";

  // Build where clause
  const where: any = {
    tenantId: storeId,
  };

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Status filter
  if (status === "active") {
    where.published = true;
    where.archivedAt = null;
  } else if (status === "draft") {
    where.published = false;
    where.archivedAt = null;
  } else if (status === "archived") {
    where.archivedAt = { not: null };
  } else if (status === "all") {
    where.archivedAt = null;
  }

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === "name") {
    orderBy.name = sortOrder;
  } else if (sortBy === "price") {
    orderBy.basePrice = sortOrder;
  } else if (sortBy === "stock") {
    orderBy.stock = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  // Fetch products
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          take: 1,
          orderBy: { order: "asc" },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  // Get categories for filter
  const categories = await db.category.findMany({
    where: { tenantId: storeId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu catálogo de productos ({total} productos)
          </p>
        </div>
        <Link
          href={`/dashboard/${storeId}/products/new`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Agregar Producto
        </Link>
      </div>

      {/* Filters */}
      <ProductsFilters
        storeId={storeId}
        categories={categories}
        searchParams={searchParams}
      />

      {/* Products Table */}
      <ProductsTable
        products={products}
        storeId={storeId}
        currentPage={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}

export const metadata = {
  title: "Productos - Dashboard",
  description: "Gestión de productos",
};
