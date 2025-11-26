/**
 * Edit Product Page
 * Semana 10.3: Edit Product Form
 *
 * Formulario para editar producto existente
 */

import { requireAuth } from "@/lib/auth/require-auth";
import { getStoreOrThrow } from "@/lib/auth/dashboard";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/products/ProductForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";

interface EditProductPageProps {
  params: {
    storeId: string;
    productId: string;
  };
}

export default async function EditProductPage({
  params: { storeId, productId },
}: EditProductPageProps) {
  // Require authentication
  const session = await requireAuth();

  // Verify store ownership
  const store = await getStoreOrThrow(storeId, session.user.id);

  // Get product
  const product = await db.product.findUnique({
    where: {
      id: productId,
      tenantId: storeId,
    },
  });

  if (!product) {
    notFound();
  }

  // Get categories for dropdown
  const categories = await db.category.findMany({
    where: { tenantId: storeId },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  // Convert Decimal to number for form
  const initialData = {
    name: product.name,
    description: product.description || "",
    sku: product.sku,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : 0,
    stock: product.stock,
    categoryId: product.categoryId || "",
    published: product.published,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/${storeId}/products`} className="rounded p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
            <p className="mt-1 text-gray-600">{product.name}</p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          title="Duplicar Producto"
        >
          <Copy className="h-4 w-4" />
          Duplicar
        </button>
      </div>

      {/* Product Form */}
      <ProductForm
        storeId={storeId}
        categories={categories}
        initialData={initialData}
        productId={productId}
      />
    </div>
  );
}

export async function generateMetadata({ params }: EditProductPageProps) {
  const product = await db.product.findUnique({
    where: { id: params.productId },
    select: { name: true },
  });

  return {
    title: `Editar ${product?.name || "Producto"} - Dashboard`,
    description: "Editar información del producto",
  };
}
