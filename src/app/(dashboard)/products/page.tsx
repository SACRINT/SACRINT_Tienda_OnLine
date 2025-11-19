import Link from "next/link";
import { Plus } from "lucide-react";
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
import { CSVOperations, PRODUCT_CSV_COLUMNS } from "@/components/dashboard/CSVOperations";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Productos</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CSVOperations
            entityType="products"
            columns={PRODUCT_CSV_COLUMNS}
            onImport={async (data) => {
              // This would call the API to import products
              return {
                success: data.length,
                errors: [],
                warnings: [],
              };
            }}
            onExport={async () => {
              // This would call the API to get all products
              return [];
            }}
          />
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </Link>
        </div>
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
