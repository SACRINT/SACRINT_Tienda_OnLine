"use client";

/**
 * DashboardSidebar Component
 *
 * Main navigation sidebar for the dashboard.
 * Features:
 * - Responsive design (desktop + mobile menu)
 * - Active route highlighting
 * - User profile section
 * - Logout functionality
 * - RBAC-aware navigation
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface DashboardSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    tenantId?: string | null;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; // If specified, only show for these roles
}

const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Productos",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    name: "Órdenes",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    name: "Análisis",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const getUserInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Filter navigation items based on user role if needed
  const visibleNavItems = navigationItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile Menu Button - Fixed top-left */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white lg:hidden hover:bg-primary/90 transition-colors"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-primary text-white transition-transform duration-300",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center border-b border-primary-light px-6">
            <Link
              href="/dashboard"
              className="text-xl font-bold hover:text-white/90 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tienda Online
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-light text-white"
                      : "text-white/80 hover:bg-primary-light hover:text-white",
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-primary-light p-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                {getUserInitial(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-300 truncate">{user.email}</p>
              </div>
            </div>

            {/* Profile & Logout Buttons */}
            <div className="space-y-2">
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white text-white hover:bg-primary-light hover:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Mi Perfil
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-white text-white hover:bg-primary-light hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop layout */}
      <div className="hidden lg:block w-64 flex-shrink-0" aria-hidden="true" />
    </>
  );
}
