"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Mail,
  Calendar,
  ShoppingCart,
  DollarSign,
  MapPin,
  Phone,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/analytics/types";
import { format } from "date-fns";
import Link from "next/link";

interface CustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
      };
    }>;
  }>;
  addresses: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }>;
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string | null;
  };
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchCustomer();
    }
  }, [session]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${params.id}?tenantId=${session?.user?.tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/customers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{customer.name || "Customer"}</h1>
          <p className="text-gray-600">{customer.email}</p>
        </div>
        <Button onClick={fetchCustomer} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Customer Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Total Orders</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Total Spent</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(customer.stats.totalSpent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Avg Order Value</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customer.stats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Last Order</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {customer.stats.lastOrderDate
                ? format(new Date(customer.stats.lastOrderDate), "MMM d, yyyy")
                : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Customer since {format(new Date(customer.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses ({customer.addresses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No addresses on file</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border bg-gray-50 p-3 text-sm">
                    {address.isDefault && (
                      <Badge className="mb-2" variant="outline">
                        Default
                      </Badge>
                    )}
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>All orders from this customer</CardDescription>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
