import Link from "next/link";
import {
  Search,
  Users,
  Mail,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getUsersByTenant } from "@/lib/db/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; sort?: string };
}) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>;
  }

  const page = parseInt(searchParams.page || "1");
  const pageSize = 20;

  const customers = await getUsersByTenant(session.user.tenantId);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Calculate stats
  const totalCustomers = customers.length;
  const newThisMonth = customers.filter((c: any) => {
    const date = new Date(c.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const withOrders = customers.filter((c: any) => (c._count?.orders || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Clientes</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona tus clientes y su historial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nuevos Este Mes</p>
                <p className="text-2xl font-bold">{newThisMonth}</p>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Con Órdenes</p>
                <p className="text-2xl font-bold">{withOrders}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <ShoppingBag className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-10"
                defaultValue={searchParams.search}
              />
            </div>
            <Select defaultValue={searchParams.sort || "newest"}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="orders">Más órdenes</SelectItem>
                <SelectItem value="spent">Mayor gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {totalCustomers} clientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Órdenes</TableHead>
                <TableHead>Total Gastado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay clientes registrados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer: any) => {
                  const ordersCount = customer._count?.orders || 0;
                  const totalSpent = customer.totalSpent || 0;
                  const initial = customer.name?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase();

                  return (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={customer.image} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {initial}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {customer.name || "Sin nombre"}
                            </p>
                            {customer.phone && (
                              <p className="text-xs text-muted-foreground">
                                {customer.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <span>{ordersCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatPrice(totalSpent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(customer.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ordersCount > 0 ? (
                          <Badge variant="default" className="bg-success/10 text-success border-success/20">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Nuevo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {customers.length > pageSize && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {page}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Link href={`?page=${page - 1}`}>
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href={`?page=${page + 1}`}>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
