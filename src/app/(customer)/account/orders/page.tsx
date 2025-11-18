// Orders Page
// Display all orders with filtering and pagination

"use client";

import { useState } from "react";
import { AccountLayout, LazyOrderCard } from "@/components/account";
import type { Order } from "@/components/account";
import { LazyLoad, OrderCardSkeleton } from "@/components/shared/LazyLoad";
import { Search, Filter, Download, ChevronDown } from "lucide-react";

// Mock data - In production, fetch from API
const getMockUser = () => ({
  name: "John Doe",
  email: "john.doe@example.com",
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
});

const getMockOrders = (): Order[] => {
  return [
    {
      id: "1",
      orderNumber: "ORD-2024-001",
      status: "delivered",
      createdAt: new Date(2024, 10, 10).toISOString(),
      items: [
        {
          id: "1",
          productId: "1",
          productName: "Premium Wireless Headphones",
          productImage:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
          quantity: 1,
          price: 249.99,
        },
      ],
      subtotal: 249.99,
      shipping: 0,
      tax: 20.0,
      total: 269.99,
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
      },
      trackingNumber: "TRK123456789",
      estimatedDelivery: new Date(2024, 10, 15).toISOString(),
    },
    {
      id: "2",
      orderNumber: "ORD-2024-002",
      status: "processing",
      createdAt: new Date(2024, 10, 14).toISOString(),
      items: [
        {
          id: "2",
          productId: "2",
          productName: "Wireless Earbuds Pro",
          productImage:
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
          quantity: 2,
          price: 299.98,
        },
      ],
      subtotal: 299.98,
      shipping: 9.99,
      tax: 24.8,
      total: 334.77,
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
      },
    },
    {
      id: "3",
      orderNumber: "ORD-2024-003",
      status: "shipped",
      createdAt: new Date(2024, 9, 28).toISOString(),
      items: [
        {
          id: "3",
          productId: "3",
          productName: "Studio Monitor Headphones",
          quantity: 1,
          price: 349.99,
        },
      ],
      subtotal: 349.99,
      shipping: 0,
      tax: 28.0,
      total: 377.99,
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
      },
      trackingNumber: "TRK987654321",
      estimatedDelivery: new Date(2024, 11, 1).toISOString(),
    },
    {
      id: "4",
      orderNumber: "ORD-2024-004",
      status: "pending",
      createdAt: new Date(2024, 9, 20).toISOString(),
      items: [
        {
          id: "4",
          productId: "4",
          productName: "Portable Bluetooth Speaker",
          quantity: 1,
          price: 129.99,
        },
      ],
      subtotal: 129.99,
      shipping: 9.99,
      tax: 11.2,
      total: 151.18,
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
      },
    },
    {
      id: "5",
      orderNumber: "ORD-2024-005",
      status: "cancelled",
      createdAt: new Date(2024, 9, 15).toISOString(),
      items: [
        {
          id: "5",
          productId: "5",
          productName: "Wireless Gaming Mouse",
          quantity: 1,
          price: 89.99,
        },
      ],
      subtotal: 89.99,
      shipping: 5.99,
      tax: 7.68,
      total: 103.66,
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
      },
    },
  ];
};

type OrderStatus =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export default function OrdersPage() {
  const user = getMockUser();
  const allOrders = getMockOrders();

  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "total">("recent");

  // Filter and sort orders
  const filteredOrders = allOrders
    .filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.items.some((item) =>
            item.productName.toLowerCase().includes(query),
          )
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        return b.total - a.total;
      }
    });

  const statusCounts = {
    all: allOrders.length,
    pending: allOrders.filter((o) => o.status === "pending").length,
    processing: allOrders.filter((o) => o.status === "processing").length,
    shipped: allOrders.filter((o) => o.status === "shipped").length,
    delivered: allOrders.filter((o) => o.status === "delivered").length,
    cancelled: allOrders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <AccountLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600">
            Track and manage your order history
          </p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 border-b border-gray-200">
            {(
              [
                "all",
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ] as OrderStatus[]
            ).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number or product..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort and Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="total">Highest Total</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <LazyLoad
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <OrderCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <LazyOrderCard
                  key={order.id}
                  order={order}
                  variant="compact"
                  onViewDetails={(id) =>
                    (window.location.href = `/account/orders/${id}`)
                  }
                  onDownloadInvoice={(id) =>
                    console.log("Download invoice:", id)
                  }
                  onRequestReturn={(id) =>
                    console.log("Request return for:", id)
                  }
                />
              ))}
            </div>
          </LazyLoad>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No orders found
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "No orders match the selected status"}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
