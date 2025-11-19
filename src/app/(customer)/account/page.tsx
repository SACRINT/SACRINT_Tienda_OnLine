"use client";

// Account Dashboard Page
// Overview of recent orders, wishlist preview, and account quick actions

import { Suspense } from "react";
import Link from "next/link";
import { AccountLayout, OrderCard } from "@/components/account";
import type { Order } from "@/components/account";
import {
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  TrendingUp,
  Package,
} from "lucide-react";

// Mock data - In production, fetch from API
const getMockUser = () => ({
  name: "John Doe",
  email: "john.doe@example.com",
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
});

const getMockRecentOrders = (): Order[] => {
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
  ];
};

const getMockStats = () => ({
  totalOrders: 12,
  activeOrders: 2,
  wishlistItems: 5,
  savedAddresses: 2,
});

export default function AccountDashboardPage() {
  const user = getMockUser();
  const recentOrders = getMockRecentOrders();
  const stats = getMockStats();

  return (
    <AccountLayout user={user}>
      <div className="p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here&apos;s an overview of your account activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={stats.totalOrders}
            color="blue"
            href="/account/orders"
          />
          <StatCard
            icon={Package}
            label="Active Orders"
            value={stats.activeOrders}
            color="purple"
            href="/account/orders?status=active"
          />
          <StatCard
            icon={Heart}
            label="Wishlist Items"
            value={stats.wishlistItems}
            color="red"
            href="/account/wishlist"
          />
          <StatCard
            icon={MapPin}
            label="Saved Addresses"
            value={stats.savedAddresses}
            color="green"
            href="/account/addresses"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              icon={ShoppingBag}
              title="Track Orders"
              description="View and track your recent orders"
              href="/account/orders"
            />
            <QuickActionCard
              icon={Heart}
              title="My Wishlist"
              description="View your saved products"
              href="/account/wishlist"
            />
            <QuickActionCard
              icon={MapPin}
              title="Manage Addresses"
              description="Add or edit shipping addresses"
              href="/account/addresses"
            />
            <QuickActionCard
              icon={CreditCard}
              title="Payment Methods"
              description="Manage saved payment methods"
              href="/account/settings#payment"
            />
            <QuickActionCard
              icon={TrendingUp}
              title="Order History"
              description="View all past purchases"
              href="/account/orders?view=all"
            />
            <QuickActionCard
              icon={Package}
              title="Returns"
              description="Request returns or refunds"
              href="/account/orders?tab=returns"
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Orders
            </h2>
            <Link
              href="/account/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All Orders →
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-48 rounded-lg bg-gray-200" />
                <div className="h-48 rounded-lg bg-gray-200" />
              </div>
            }
          >
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 3).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    variant="compact"
                    onViewDetails={(id) =>
                      (window.location.href = `/account/orders/${id}`)
                    }
                    onDownloadInvoice={(id) =>
                      console.log("Download invoice:", id)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No orders yet
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Start shopping to see your orders here
                </p>
                <Link
                  href="/shop"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Start Shopping</span>
                </Link>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </AccountLayout>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: number;
  color: "blue" | "purple" | "red" | "green";
  href: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <Link
      href={href}
      className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof ShoppingBag;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-3 transition-colors group-hover:bg-blue-50">
          <Icon className="h-5 w-5 text-gray-600 transition-colors group-hover:text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}
