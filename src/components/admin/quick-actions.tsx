// Quick Actions Component
// Quick action cards for dashboard

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Upload,
  Download,
  RefreshCw,
  Send,
  FileText,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "primary" | "secondary";
}

export interface QuickActionsProps {
  actions?: QuickAction[];
  title?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

const defaultActions: QuickAction[] = [
  {
    id: "add-product",
    label: "Add Product",
    description: "Create a new product",
    icon: Plus,
    onClick: () => {},
    variant: "primary",
  },
  {
    id: "import",
    label: "Import",
    description: "Import products from CSV",
    icon: Upload,
    onClick: () => {},
  },
  {
    id: "export",
    label: "Export",
    description: "Export data to CSV",
    icon: Download,
    onClick: () => {},
  },
  {
    id: "sync",
    label: "Sync Inventory",
    description: "Sync with warehouse",
    icon: RefreshCw,
    onClick: () => {},
  },
];

export function QuickActions({
  actions = defaultActions,
  title = "Quick Actions",
  columns = 4,
  className,
}: QuickActionsProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("space-y-4", className)}>
      {title && <h3 className="font-semibold">{title}</h3>}

      <div className={cn("grid gap-4", gridCols[columns])}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border text-left transition-colors",
                action.variant === "primary"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-card hover:bg-muted",
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  action.variant === "primary"
                    ? "bg-primary-foreground/20"
                    : "bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{action.label}</p>
                {action.description && (
                  <p
                    className={cn(
                      "text-sm truncate",
                      action.variant === "primary"
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {action.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Simple action buttons row
export interface ActionButtonsProps {
  actions: Array<{
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  }>;
  className?: string;
}

export function ActionButtons({ actions, className }: ActionButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
          >
            {Icon && <Icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

export default QuickActions;
