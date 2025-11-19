// Dashboard Layout Component
// Admin dashboard layout with sidebar

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Tag,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Bell,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCustom } from "@/components/ui/avatar-custom";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  children?: Array<{
    id: string;
    label: string;
    href: string;
  }>;
}

const defaultNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "products", label: "Products", icon: Package, href: "/dashboard/products" },
  { id: "orders", label: "Orders", icon: ShoppingCart, href: "/dashboard/orders", badge: 5 },
  { id: "customers", label: "Customers", icon: Users, href: "/dashboard/customers" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { id: "promotions", label: "Promotions", icon: Tag, href: "/dashboard/promotions" },
  { id: "reviews", label: "Reviews", icon: MessageSquare, href: "/dashboard/reviews" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  activeItem?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  storeName?: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
  notifications?: number;
  className?: string;
}

export function DashboardLayout({
  children,
  navItems = defaultNavItems,
  activeItem,
  user,
  storeName = "Store Dashboard",
  onNavigate,
  onLogout,
  notifications = 0,
  className,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className={cn("min-h-screen bg-muted/30", className)}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-background border-r z-50 transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className="font-semibold truncate">{storeName}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.has(item.id);

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpanded(item.id);
                    } else {
                      onNavigate?.(item.href);
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  )}
                </button>

                {/* Children */}
                {hasChildren && isExpanded && (
                  <div className="ml-6 border-l">
                    {item.children!.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onNavigate?.(child.href);
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-muted",
                          activeItem === child.id && "text-primary font-medium"
                        )}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        {user && (
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <AvatarCustom
                src={user.avatar}
                name={user.name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.role || user.email}
                </p>
              </div>
            </div>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-background border-b flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-md"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-muted rounded-md">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                  {notifications > 9 ? "9+" : notifications}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
