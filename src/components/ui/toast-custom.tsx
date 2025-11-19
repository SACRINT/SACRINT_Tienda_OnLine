// Toast Custom Component
// Toast notifications with variants and actions

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

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  onClose?: (id: string) => void;
  className?: string;
}

const variantStyles: Record<ToastVariant, { bg: string; icon: LucideIcon }> = {
  default: { bg: "bg-background border", icon: Info },
  success: {
    bg: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    icon: CheckCircle,
  },
  error: {
    bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    icon: Info,
  },
};

const iconColors: Record<ToastVariant, string> = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

export function ToastCustom({
  id,
  title,
  description,
  variant = "default",
  action,
  onClose,
  className,
}: ToastProps) {
  const { bg, icon: Icon } = variantStyles[variant];

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        bg,
        className,
      )}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon
              className={cn("h-5 w-5", iconColors[variant])}
              aria-hidden="true"
            />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {action && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={action.onClick}>
                  {action.label}
                </Button>
              </div>
            )}
          </div>
          {onClose && (
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => onClose(id)}
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast Container
export interface ToastContainerProps {
  children: React.ReactNode;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

const positionStyles = {
  "top-left": "top-0 left-0",
  "top-center": "top-0 left-1/2 -translate-x-1/2",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-0 right-0",
};

export function ToastContainer({
  children,
  position = "top-right",
}: ToastContainerProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col gap-2 p-4",
        positionStyles[position],
      )}
    >
      {children}
    </div>
  );
}

export default ToastCustom;
