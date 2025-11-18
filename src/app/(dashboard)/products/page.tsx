import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getProducts } from "@/lib/db/products";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductsTable } from "@/components/dashboard/ProductsTable";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    status?: string;
  };
}) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>;
  }

  const page = parseInt(searchParams.page || "1");
  const pageSize = 10;

  // Get products with filters
  const results = await getProducts(session.user.tenantId, {
    page,
    limit: pageSize,
    sort: "newest",
    search: searchParams.search,
    categoryId: searchParams.category,
    published:
      searchParams.status === "active"
        ? true
        : searchParams.status === "inactive"
          ? false
          : undefined,
  });

  const products = results.products;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Productos</h2>
          <p className="text-gray-600 mt-1">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Agregar Producto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            {products.length} productos en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable products={products} currentPage={page} />
        </CardContent>
      </Card>
    </div>
  );
}
