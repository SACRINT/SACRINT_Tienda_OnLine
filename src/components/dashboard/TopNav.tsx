/**
 * Dashboard Top Navigation Bar
 * Semana 9.5: Top Navigation Bar
 *
 * Barra superior con breadcrumbs, búsqueda, notificaciones y user menu
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Search,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface TopNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  storeId: string;
}

export function TopNav({ user, storeId }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate breadcrumbs from pathname
  const breadcrumbs = generateBreadcrumbs(pathname, storeId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/${storeId}/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Right: Search, Notifications, User Menu */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos, órdenes..."
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </form>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {/* Placeholder notifications */}
                <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <p className="text-sm text-gray-900 font-medium">Nueva orden recibida</p>
                  <p className="text-xs text-gray-500 mt-1">Hace 5 minutos</p>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <p className="text-sm text-gray-900 font-medium">Producto con bajo stock</p>
                  <p className="text-xs text-gray-500 mt-1">Hace 1 hora</p>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm text-gray-900 font-medium">Nueva reseña</p>
                  <p className="text-xs text-gray-500 mt-1">Hace 2 horas</p>
                </div>
              </div>
              <div className="p-3 border-t border-gray-200 text-center">
                <Link
                  href={`/dashboard/${storeId}/notifications`}
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowNotifications(false)}
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">
              {user.name || "Usuario"}
            </span>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <nav className="py-2">
                <Link
                  href={`/dashboard/${storeId}/profile`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Mi perfil</span>
                </Link>
                <Link
                  href={`/dashboard/${storeId}/settings`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Preferencias</span>
                </Link>
                <Link
                  href={`/dashboard/${storeId}/help`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Ayuda</span>
                </Link>
              </nav>
              <div className="border-t border-gray-200 py-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string, storeId: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: Array<{ label: string; href?: string }> = [];

  // Remove "dashboard" and storeId from segments
  const relevantSegments = segments.slice(2); // Skip "dashboard" and storeId

  // Always start with Dashboard
  breadcrumbs.push({
    label: "Dashboard",
    href: `/dashboard/${storeId}`,
  });

  // Build breadcrumbs from remaining segments
  let currentPath = `/dashboard/${storeId}`;
  relevantSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === relevantSegments.length - 1;

    breadcrumbs.push({
      label: formatSegment(segment),
      href: isLast ? undefined : currentPath, // Last item is not a link
    });
  });

  return breadcrumbs;
}

/**
 * Format URL segment to readable label
 */
function formatSegment(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    products: "Productos",
    orders: "Órdenes",
    customers: "Clientes",
    reports: "Reportes",
    settings: "Configuración",
    profile: "Perfil",
    help: "Ayuda",
    coupons: "Cupones",
    reviews: "Reseñas",
  };

  if (specialCases[segment]) {
    return specialCases[segment];
  }

  // Capitalize first letter and replace hyphens
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
