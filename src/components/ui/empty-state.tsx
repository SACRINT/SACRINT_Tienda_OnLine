"use client";

import * as React from "react";
import { Package, Search, ShoppingCart, Heart, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "cart" | "search" | "wishlist" | "orders";
  className?: string;
}

const variantIcons = {
  default: Package,
  cart: ShoppingCart,
  search: Search,
  wishlist: Heart,
  orders: FileText,
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { icon, title, description, action, variant = "default", className },
    ref,
  ) => {
    const IconComponent = variantIcons[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center",
          className,
        )}
      >
        <div className="mb-4 rounded-full bg-muted p-4">
          {icon || <IconComponent className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {action && <Button onClick={action.onClick}>{action.label}</Button>}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
