// Key Value Component
// Simple key-value display for inline data

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const sizeStyles = {
  sm: {
    label: "text-xs",
    value: "text-xs",
  },
  md: {
    label: "text-sm",
    value: "text-sm",
  },
  lg: {
    label: "text-base",
    value: "text-lg",
  },
};

export function KeyValue({
  label,
  value,
  size = "md",
  orientation = "horizontal",
  className,
}: KeyValueProps) {
  const styles = sizeStyles[size];

  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-1", className)}>
        <dt className={cn("font-medium text-muted-foreground", styles.label)}>
          {label}
        </dt>
        <dd className={cn("font-semibold", styles.value)}>{value}</dd>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <dt className={cn("text-muted-foreground", styles.label)}>{label}</dt>
      <dd className={cn("font-medium text-right", styles.value)}>{value}</dd>
    </div>
  );
}

// Key Value Group
export interface KeyValueGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function KeyValueGroup({ children, className }: KeyValueGroupProps) {
  return <dl className={cn("space-y-2", className)}>{children}</dl>;
}

export default KeyValue;
