// List Item Component
// Flexible list item with avatar, actions, and metadata

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, LucideIcon } from "lucide-react";

export interface ListItemProps {
  children?: React.ReactNode;
  title: string;
  description?: string;
  avatar?: React.ReactNode;
  icon?: LucideIcon;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  className?: string;
}

export function ListItem({
  children,
  title,
  description,
  avatar,
  icon: Icon,
  metadata,
  actions,
  href,
  onClick,
  selected,
  disabled,
  showChevron,
  className,
}: ListItemProps) {
  const isInteractive = href || onClick;
  const Component = href ? "a" : "div";

  const content = (
    <>
      {(avatar || Icon) && (
        <div className="flex-shrink-0">
          {avatar ||
            (Icon && <Icon className="h-5 w-5 text-muted-foreground" />)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium truncate",
              disabled && "text-muted-foreground",
            )}
          >
            {title}
          </p>
          {metadata && (
            <div className="flex-shrink-0 text-xs text-muted-foreground">
              {metadata}
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground truncate">
            {description}
          </p>
        )}
        {children}
      </div>

      {(actions || showChevron) && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {actions}
          {showChevron && (
            <ChevronRight
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </>
  );

  return (
    <Component
      href={href}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "flex items-center gap-4 p-4",
        isInteractive && !disabled && "cursor-pointer hover:bg-muted/50",
        selected && "bg-muted",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      aria-disabled={disabled}
    >
      {content}
    </Component>
  );
}

// List container
export interface ListProps {
  children: React.ReactNode;
  divided?: boolean;
  className?: string;
}

export function List({ children, divided = true, className }: ListProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card",
        divided && "[&>*:not(:last-child)]:border-b",
        className,
      )}
    >
      {children}
    </div>
  );
}

// Simple list for basic items
export interface SimpleListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function SimpleListItem({ children, className }: SimpleListItemProps) {
  return <div className={cn("px-4 py-3 text-sm", className)}>{children}</div>;
}

export default ListItem;
