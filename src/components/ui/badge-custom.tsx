// Badge Custom Component
// Extended badge component with more variants and features

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, LucideIcon } from "lucide-react";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeCustomProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
  removable?: boolean;
  onRemove?: () => void;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  outline: "border border-input bg-background hover:bg-accent",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-sm",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-primary-foreground",
  secondary: "bg-secondary-foreground",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  outline: "bg-foreground",
};

export function BadgeCustom({
  children,
  variant = "default",
  size = "md",
  icon: Icon,
  removable,
  onRemove,
  dot,
  className,
}: BadgeCustomProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// Badge group for multiple badges
export interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  max?: number;
}

export function BadgeGroup({ children, className, max }: BadgeGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const hiddenCount = max ? childArray.length - max : 0;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visibleChildren}
      {hiddenCount > 0 && (
        <BadgeCustom variant="outline" size="md">
          +{hiddenCount} more
        </BadgeCustom>
      )}
    </div>
  );
}

export default BadgeCustom;
