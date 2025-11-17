import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getProductById } from '@/lib/db/products'
import { getCategoriesByTenant } from '@/lib/db/categories'
import { ProductForm } from '@/components/dashboard/ProductForm'

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>
  }

  const product = await getProductById(params.id, session.user.tenantId)

  if (!product) {
    notFound()
  }

  const categories = await getCategoriesByTenant(session.user.tenantId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Editar Producto</h2>
        <p className="text-gray-600 mt-1">
          Actualiza la información de {product.name}
        </p>
      </div>

      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          sku: product.sku,
          categoryId: product.categoryId,
          isActive: product.isActive,
        }}
        categories={categories}
      />
    </div>
  )
}
