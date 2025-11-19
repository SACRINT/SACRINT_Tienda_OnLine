// Banner Component
// Top or bottom banners for announcements and notices

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, LucideIcon } from "lucide-react";
import { Button } from "./button";

export type BannerVariant = "default" | "info" | "success" | "warning" | "error";

export interface BannerProps {
  children: React.ReactNode;
  variant?: BannerVariant;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  position?: "top" | "bottom";
  sticky?: boolean;
  className?: string;
}

const variantStyles: Record<BannerVariant, string> = {
  default: "bg-muted text-foreground",
  info: "bg-blue-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-yellow-500 text-black",
  error: "bg-red-600 text-white",
};

export function Banner({
  children,
  variant = "default",
  icon: Icon,
  action,
  dismissible,
  onDismiss,
  position = "top",
  sticky,
  className,
}: BannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "w-full px-4 py-3",
        variantStyles[variant],
        sticky && "sticky z-40",
        sticky && position === "top" && "top-0",
        sticky && position === "bottom" && "bottom-0",
        className
      )}
      role="banner"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />}
            <p className="text-sm font-medium">{children}</p>
          </div>

          <div className="flex items-center gap-3">
            {action && (
              <Button
                size="sm"
                variant={variant === "default" ? "default" : "secondary"}
                onClick={action.onClick}
                className="whitespace-nowrap"
              >
                {action.label}
              </Button>
            )}
            {dismissible && (
              <button
                type="button"
                className="rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={handleDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Announcement banner with link
export interface AnnouncementBannerProps {
  children: React.ReactNode;
  href: string;
  tag?: string;
  className?: string;
}

export function AnnouncementBanner({
  children,
  href,
  tag,
  className,
}: AnnouncementBannerProps) {
  return (
    <a
      href={href}
      className={cn(
        "block w-full bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:from-primary/90 hover:to-primary/70 transition-colors",
        className
      )}
    >
      {tag && (
        <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold mr-2">
          {tag}
        </span>
      )}
      {children}
      <span className="ml-1" aria-hidden="true">
        &rarr;
      </span>
    </a>
  );
}

export default Banner;
