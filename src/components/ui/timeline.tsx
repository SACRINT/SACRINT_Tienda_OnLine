// Timeline Component
// Display events in chronological order

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, Circle } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  icon?: LucideIcon;
  iconColor?: string;
  status?: "completed" | "current" | "upcoming";
  content?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function Timeline({
  items,
  orientation = "vertical",
  className,
}: TimelineProps) {
  if (orientation === "horizontal") {
    return (
      <div className={cn("flex overflow-x-auto", className)}>
        {items.map((item, index) => {
          const Icon = item.icon || Circle;
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className="flex flex-col items-center min-w-32">
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    index === 0 ? "bg-transparent" : "bg-border"
                  )}
                />
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                    item.status === "completed" &&
                      "bg-primary border-primary text-primary-foreground",
                    item.status === "current" &&
                      "bg-background border-primary",
                    item.status === "upcoming" &&
                      "bg-muted border-muted-foreground/30"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      item.iconColor,
                      item.status === "upcoming" && "text-muted-foreground"
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    isLast ? "bg-transparent" : "bg-border"
                  )}
                />
              </div>
              <div className="mt-2 text-center px-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.date && (
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical orientation (default)
  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {items.map((item) => {
          const Icon = item.icon || Circle;

          return (
            <div key={item.id} className="relative pl-10">
              <div
                className={cn(
                  "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                  item.status === "completed" &&
                    "bg-primary border-primary text-primary-foreground",
                  item.status === "current" &&
                    "border-primary",
                  item.status === "upcoming" &&
                    "border-muted-foreground/30"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    item.iconColor,
                    item.status === "upcoming" && "text-muted-foreground"
                  )}
                />
              </div>

              <div className="min-h-8 pt-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {item.date && (
                    <span className="text-sm text-muted-foreground">
                      {item.date}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {item.content && <div className="mt-2">{item.content}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Timeline;
