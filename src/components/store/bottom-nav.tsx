// Bottom Navigation Component
// Fixed bottom navigation bar for mobile

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  ShoppingBag,
  Heart,
  User,
  Grid,
  LucideIcon,
} from "lucide-react";

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

export interface BottomNavProps {
  items?: BottomNavItem[];
  activeItem?: string;
  onNavigate?: (href: string) => void;
  cartCount?: number;
  wishlistCount?: number;
  className?: string;
}

const defaultItems: BottomNavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "categories", label: "Categories", icon: Grid, href: "/categories" },
  { id: "search", label: "Search", icon: Search, href: "/search" },
  { id: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist" },
  { id: "account", label: "Account", icon: User, href: "/account" },
];

export function BottomNav({
  items = defaultItems,
  activeItem,
  onNavigate,
  cartCount = 0,
  wishlistCount = 0,
  className,
}: BottomNavProps) {
  const getBadge = (id: string): number | undefined => {
    if (id === "cart") return cartCount > 0 ? cartCount : undefined;
    if (id === "wishlist") return wishlistCount > 0 ? wishlistCount : undefined;
    return items.find((i) => i.id === id)?.badge;
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t z-30 lg:hidden safe-area-pb",
        className,
      )}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const badge = getBadge(item.id);

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badge && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Floating cart button
export interface FloatingCartButtonProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export function FloatingCartButton({
  count,
  onClick,
  className,
}: FloatingCartButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-20 lg:hidden",
        className,
      )}
      aria-label={`Cart (${count} items)`}
    >
      <div className="relative">
        <ShoppingBag className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-background text-foreground rounded-full flex items-center justify-center text-xs font-medium">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
    </button>
  );
}

export default BottomNav;
