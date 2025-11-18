import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getOrdersByTenant } from "@/lib/db/orders";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrdersTable } from "@/components/dashboard/OrdersTable";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; search?: string };
}) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>;
  }

  const page = parseInt(searchParams.page || "1");
  const pageSize = 20;

  const result = await getOrdersByTenant(session.user.tenantId, {
    page,
    limit: pageSize,
    status: searchParams.status as any,
  });

  const orders = result.orders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Órdenes</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las órdenes de tus clientes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Órdenes</CardTitle>
          <CardDescription>
            {result.pagination.total} órdenes encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} currentPage={page} />
        </CardContent>
      </Card>
    </div>
  );
}
