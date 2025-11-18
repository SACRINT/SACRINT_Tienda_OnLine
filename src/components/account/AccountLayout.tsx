// Account Layout Component
// Sidebar navigation layout for customer account pages

"use client";
import Image from "next/image";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Settings,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";

export interface AccountLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    image?: string;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof User;
  badge?: number;
}

export function AccountLayout({ children, user }: AccountLayoutProps) {
  const pathname = usePathname();

  const navigation: NavItem[] = [
    {
      label: "Overview",
      href: "/account",
      icon: User,
    },
    {
      label: "Orders",
      href: "/account/orders",
      icon: ShoppingBag,
    },
    {
      label: "Wishlist",
      href: "/account/wishlist",
      icon: Heart,
    },
    {
      label: "Addresses",
      href: "/account/addresses",
      icon: MapPin,
    },
    {
      label: "Settings",
      href: "/account/settings",
      icon: Settings,
    },
    {
      label: "Invoices",
      href: "/account/invoices",
      icon: FileText,
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/account") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Store
            </Link>
            <Link
              href="/shop"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white">
              {/* User Profile Header */}
              {user && (
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-semibold text-gray-900">
                        {user.name}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="p-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-5 w-5 ${
                            isActive
                              ? "text-blue-600"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                      )}
                    </Link>
                  );
                })}

                {/* Logout Button */}
                <button
                  onClick={() => {
                    // In production, this would call the logout API
                    window.location.href = "/api/auth/signout";
                  }}
                  className="mt-4 flex w-full items-center gap-3 rounded-lg border-t border-gray-200 px-4 py-3 pt-6 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5 text-gray-400" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>

            {/* Help Card */}
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Contact our support team for assistance with your account or
                orders.
              </p>
              <Link
                href="/support"
                className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Contact Support →
              </Link>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <div className="rounded-lg border border-gray-200 bg-white">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
