/**
 * Dashboard Sidebar Component
 * Semana 9.4: Sidebar Navigation Component
 *
 * Navegación lateral del dashboard con logo, menú items, active state, y collapse en mobile
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Store,
  Tag,
  FileText,
} from "lucide-react";

interface SidebarProps {
  store: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
}

const menuItems = [
  {
    title: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Ventas",
    items: [
      {
        label: "Productos",
        href: "/products",
        icon: Package,
      },
      {
        label: "Órdenes",
        href: "/orders",
        icon: ShoppingCart,
      },
      {
        label: "Cupones",
        href: "/coupons",
        icon: Tag,
      },
    ],
  },
  {
    title: "Clientes",
    items: [
      {
        label: "Clientes",
        href: "/customers",
        icon: Users,
      },
      {
        label: "Reseñas",
        href: "/reviews",
        icon: FileText,
      },
    ],
  },
  {
    title: "Analíticas",
    items: [
      {
        label: "Reportes",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        label: "Configuración",
        href: "/settings",
        icon: Settings,
      },
      {
        label: "Ayuda",
        href: "/help",
        icon: HelpCircle,
      },
    ],
  },
];

export function Sidebar({ store }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const basePath = `/dashboard/${store.id}`;
    const fullPath = `${basePath}${href}`;

    if (href === "") {
      return pathname === basePath;
    }

    return pathname.startsWith(fullPath);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo / Store Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link
          href={`/dashboard/${store.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {store.logo ? (
            <img
              src={store.logo}
              alt={store.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-semibold text-gray-900 truncate">{store.name}</span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {/* Section Title */}
            <div className="px-6 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>

            {/* Section Items */}
            <ul className="space-y-1 px-3">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={`/dashboard/${store.id}${item.href}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        active
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 p-4">
        <Link
          href={`/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>Ver tienda</span>
        </Link>
      </div>
    </aside>
  );
}

/**
 * Mobile Sidebar (for future mobile support)
 * Se puede expandir con un drawer/modal para mobile
 */
export function MobileSidebar({ store }: SidebarProps) {
  // TODO: Implement mobile drawer
  return null;
}
