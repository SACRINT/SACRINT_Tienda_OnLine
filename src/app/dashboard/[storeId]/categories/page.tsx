/**
 * Categories Management Page
 * Semana 10.6: Categories CRUD
 *
 * Gestión de categorías de productos
 */

import { requireAuth } from "@/lib/auth/require-auth";
import { getStoreOrThrow } from "@/lib/auth/dashboard";
import { db } from "@/lib/db";
import { CategoriesTable } from "@/components/dashboard/categories/CategoriesTable";
import { Plus } from "lucide-react";
import Link from "next/link";

interface CategoriesPageProps {
  params: {
    storeId: string;
  };
}

export default async function CategoriesPage({
  params: { storeId },
}: CategoriesPageProps) {
  // Require authentication
  const session = await requireAuth();

  // Verify store ownership
  const store = await getStoreOrThrow(storeId, session.user.id);

  // Get categories
  const categories = await db.category.findMany({
    where: { tenantId: storeId },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-1">
            Organiza tus productos en categorías ({categories.length}{" "}
            categorías)
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Categories Table */}
      <CategoriesTable categories={categories} storeId={storeId} />
    </div>
  );
}

export const metadata = {
  title: "Categorías - Dashboard",
  description: "Gestión de categorías",
};
