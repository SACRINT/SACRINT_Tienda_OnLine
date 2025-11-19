// Mobile Navigation Component
// Mobile menu and navigation

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Home,
  Search,
  ShoppingBag,
  User,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

export interface MobileNavProps {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (href: string) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  cartCount?: number;
  wishlistCount?: number;
  className?: string;
}

export function MobileNav({
  items,
  isOpen,
  onClose,
  onNavigate,
  user,
  cartCount = 0,
  wishlistCount = 0,
  className,
}: MobileNavProps) {
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);

  const handleNavigate = (href: string) => {
    onNavigate?.(href);
    onClose();
  };

  const activeItem = items.find((item) => item.id === activeSubmenu);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Menu */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-full bg-background shadow-xl z-50 transform transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User section */}
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {activeSubmenu ? (
            // Submenu view
            <div>
              <button
                onClick={() => setActiveSubmenu(null)}
                className="w-full flex items-center gap-2 p-4 border-b font-medium"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              {activeItem?.children?.map((child) => (
                <button
                  key={child.id}
                  onClick={() =>
                    child.href ? handleNavigate(child.href) : null
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-muted"
                >
                  <span>{child.label}</span>
                </button>
              ))}
            </div>
          ) : (
            // Main menu
            <nav className="py-2">
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  {item.children ? (
                    <button
                      onClick={() => setActiveSubmenu(item.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : item.href ? (
                    <button
                      onClick={() => handleNavigate(item.href!)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ) : null}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Quick links */}
        <div className="border-t p-4 space-y-2">
          <button
            onClick={() => handleNavigate("/wishlist")}
            className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md"
          >
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5" />
              <span>Wishlist</span>
            </div>
            {wishlistCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {wishlistCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleNavigate("/cart")}
            className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" />
              <span>Cart</span>
            </div>
            {cartCount > 0 && (
              <span className="text-sm text-muted-foreground">{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// Mobile header with menu button
export interface MobileHeaderProps {
  onMenuOpen: () => void;
  onSearchOpen?: () => void;
  onCartOpen?: () => void;
  cartCount?: number;
  logo?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  onMenuOpen,
  onSearchOpen,
  onCartOpen,
  cartCount = 0,
  logo,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-background border-b lg:hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <button
          onClick={onMenuOpen}
          className="p-2 -ml-2 hover:bg-muted rounded-md"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {logo && <div className="flex-shrink-0">{logo}</div>}

        <div className="flex items-center gap-1">
          {onSearchOpen && (
            <button
              onClick={onSearchOpen}
              className="p-2 hover:bg-muted rounded-md"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          {onCartOpen && (
            <button
              onClick={onCartOpen}
              className="relative p-2 hover:bg-muted rounded-md"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default MobileNav;
