import { auth } from "@/lib/auth/auth";
import { getCategoriesByTenant } from "@/lib/db/categories";
import { ProductForm } from "@/components/dashboard/ProductForm";

export default async function NewProductPage() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>;
  }

  const categories = await getCategoriesByTenant(session.user.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Nuevo Producto</h2>
        <p className="text-gray-600 mt-1">
          Agrega un nuevo producto a tu catálogo
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
