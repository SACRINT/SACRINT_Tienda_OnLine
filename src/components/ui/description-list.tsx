// Description List Component
// Key-value pairs display for details and metadata

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DescriptionItem {
  term: string;
  description: React.ReactNode;
  className?: string;
}

export interface DescriptionListProps {
  items: DescriptionItem[];
  layout?: "horizontal" | "vertical" | "grid";
  columns?: 1 | 2 | 3;
  striped?: boolean;
  className?: string;
}

export function DescriptionList({
  items,
  layout = "horizontal",
  columns = 1,
  striped,
  className,
}: DescriptionListProps) {
  if (layout === "grid") {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    };

    return (
      <dl className={cn("grid gap-4", gridCols[columns], className)}>
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "space-y-1",
              striped && index % 2 === 0 && "bg-muted/50 p-3 rounded-lg",
              item.className,
            )}
          >
            <dt className="text-sm font-medium text-muted-foreground">
              {item.term}
            </dt>
            <dd className="text-sm">{item.description}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (layout === "vertical") {
    return (
      <dl className={cn("space-y-4", className)}>
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "space-y-1",
              striped && index % 2 === 0 && "bg-muted/50 p-3 rounded-lg",
              item.className,
            )}
          >
            <dt className="text-sm font-medium text-muted-foreground">
              {item.term}
            </dt>
            <dd className="text-sm">{item.description}</dd>
          </div>
        ))}
      </dl>
    );
  }

  // Horizontal layout (default)
  return (
    <dl className={cn("divide-y", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "py-3 sm:grid sm:grid-cols-3 sm:gap-4",
            striped && index % 2 === 0 && "bg-muted/50 px-3 rounded-lg",
            item.className,
          )}
        >
          <dt className="text-sm font-medium text-muted-foreground">
            {item.term}
          </dt>
          <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Single description item for inline use
export interface DescriptionItemInlineProps {
  term: string;
  children: React.ReactNode;
  className?: string;
}

export function DescriptionItemInline({
  term,
  children,
  className,
}: DescriptionItemInlineProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-muted-foreground">{term}:</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

export default DescriptionList;
