// Status Indicator Component
// Visual indicators for various states

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  LucideIcon,
} from "lucide-react";

export type StatusType =
  | "success"
  | "error"
  | "warning"
  | "pending"
  | "processing"
  | "default";

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { icon: LucideIcon; color: string; bgColor: string; dotColor: string }
> = {
  success: {
    icon: CheckCircle,
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
    dotColor: "bg-green-500",
  },
  error: {
    icon: XCircle,
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
    dotColor: "bg-red-500",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    dotColor: "bg-yellow-500",
  },
  pending: {
    icon: Clock,
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    dotColor: "bg-gray-500",
  },
  processing: {
    icon: Loader2,
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    dotColor: "bg-blue-500",
  },
  default: {
    icon: AlertCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    dotColor: "bg-muted-foreground",
  },
};

const sizeStyles = {
  sm: {
    dot: "h-1.5 w-1.5",
    icon: "h-3 w-3",
    text: "text-xs",
    padding: "px-2 py-0.5",
  },
  md: {
    dot: "h-2 w-2",
    icon: "h-4 w-4",
    text: "text-sm",
    padding: "px-2.5 py-1",
  },
  lg: {
    dot: "h-2.5 w-2.5",
    icon: "h-5 w-5",
    text: "text-base",
    padding: "px-3 py-1.5",
  },
};

export function StatusIndicator({
  status,
  label,
  showIcon = true,
  size = "md",
  pulse,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const styles = sizeStyles[size];
  const Icon = config.icon;

  if (!label) {
    // Dot only
    return (
      <span
        className={cn(
          "relative inline-flex rounded-full",
          styles.dot,
          config.dotColor,
          className
        )}
      >
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.dotColor
            )}
          />
        )}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.color,
        styles.padding,
        styles.text,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            styles.icon,
            status === "processing" && "animate-spin"
          )}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

// Order status specific
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const orderStatusMap: Record<OrderStatus, { status: StatusType; label: string }> = {
  pending: { status: "pending", label: "Pending" },
  confirmed: { status: "success", label: "Confirmed" },
  processing: { status: "processing", label: "Processing" },
  shipped: { status: "processing", label: "Shipped" },
  delivered: { status: "success", label: "Delivered" },
  cancelled: { status: "error", label: "Cancelled" },
  refunded: { status: "warning", label: "Refunded" },
};

export function OrderStatusIndicator({
  status,
  size = "md",
  className,
}: {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = orderStatusMap[status];
  return (
    <StatusIndicator
      status={config.status}
      label={config.label}
      size={size}
      pulse={status === "processing" || status === "shipped"}
      className={className}
    />
  );
}

// Payment status specific
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

const paymentStatusMap: Record<PaymentStatus, { status: StatusType; label: string }> = {
  pending: { status: "pending", label: "Pending" },
  paid: { status: "success", label: "Paid" },
  failed: { status: "error", label: "Failed" },
  refunded: { status: "warning", label: "Refunded" },
};

export function PaymentStatusIndicator({
  status,
  size = "md",
  className,
}: {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = paymentStatusMap[status];
  return (
    <StatusIndicator
      status={config.status}
      label={config.label}
      size={size}
      className={className}
    />
  );
}

export default StatusIndicator;
