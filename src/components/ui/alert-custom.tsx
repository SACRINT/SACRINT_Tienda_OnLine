// Alert Custom Component
// Inline alerts with variants and actions

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  LucideIcon,
} from "lucide-react";
import { Button } from "./button";

export type AlertVariant = "default" | "success" | "error" | "warning" | "info";

export interface AlertCustomProps {
  title?: string;
  children: React.ReactNode;
  variant?: AlertVariant;
  icon?: LucideIcon | null;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  { bg: string; border: string; icon: LucideIcon }
> = {
  default: {
    bg: "bg-background",
    border: "border",
    icon: Info,
  },
  success: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-200 dark:border-green-800",
    icon: CheckCircle,
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    icon: Info,
  },
};

const iconColors: Record<AlertVariant, string> = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

export function AlertCustom({
  title,
  children,
  variant = "default",
  icon,
  dismissible,
  onDismiss,
  action,
  className,
}: AlertCustomProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const { bg, border, icon: DefaultIcon } = variantStyles[variant];
  const Icon = icon === null ? null : icon || DefaultIcon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn("relative rounded-lg border p-4", bg, border, className)}
      role="alert"
    >
      <div className="flex">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon
              className={cn("h-5 w-5", iconColors[variant])}
              aria-hidden="true"
            />
          </div>
        )}
        <div className={cn("flex-1", Icon && "ml-3")}>
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={cn("text-sm", title && "mt-1")}>{children}</div>
          {action && (
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={action.onClick}>
                {action.label}
              </Button>
            </div>
          )}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={handleDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertCustom;
