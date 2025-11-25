/**
 * Create Product Page
 * Semana 10.2: Create Product Form
 *
 * Formulario para crear nuevo producto
 */

import { requireAuth } from "@/lib/auth/require-auth";
import { getStoreOrThrow } from "@/lib/auth/dashboard";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/products/ProductForm";

interface NewProductPageProps {
  params: {
    storeId: string;
  };
}

export default async function NewProductPage({
  params: { storeId },
}: NewProductPageProps) {
  // Require authentication
  const session = await requireAuth();

  // Verify store ownership
  const store = await getStoreOrThrow(storeId, session.user.id);

  // Get categories for dropdown
  const categories = await db.category.findMany({
    where: { tenantId: storeId },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Agregar Nuevo Producto
        </h1>
        <p className="text-gray-600 mt-1">
          Completa la información del producto
        </p>
      </div>

      {/* Product Form */}
      <ProductForm storeId={storeId} categories={categories} />
    </div>
  );
}

export const metadata = {
  title: "Nuevo Producto - Dashboard",
  description: "Crear nuevo producto",
};
