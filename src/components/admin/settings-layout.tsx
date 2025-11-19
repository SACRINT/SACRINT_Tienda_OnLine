// Settings Layout Component
// Settings page layout with navigation

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Store,
  User,
  Bell,
  CreditCard,
  Truck,
  Shield,
  Palette,
  Globe,
  Mail,
  LucideIcon,
} from "lucide-react";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

const defaultNavItems: SettingsNavItem[] = [
  {
    id: "store",
    label: "Store",
    icon: Store,
    description: "Store information",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Personal settings",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Notification preferences",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    description: "Payment methods",
  },
  {
    id: "shipping",
    label: "Shipping",
    icon: Truck,
    description: "Shipping options",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Security settings",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Theme and display",
  },
  {
    id: "domains",
    label: "Domains",
    icon: Globe,
    description: "Custom domains",
  },
  { id: "email", label: "Email", icon: Mail, description: "Email templates" },
];

export interface SettingsLayoutProps {
  children: React.ReactNode;
  navItems?: SettingsNavItem[];
  activeItem?: string;
  onNavigate?: (id: string) => void;
  className?: string;
}

export function SettingsLayout({
  children,
  navItems = defaultNavItems,
  activeItem,
  onNavigate,
  className,
}: SettingsLayoutProps) {
  return (
    <div className={cn("flex flex-col lg:flex-row gap-6", className)}>
      {/* Sidebar navigation */}
      <aside className="lg:w-64 flex-shrink-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="min-w-0">
                  <p className={cn("text-sm", isActive && "font-medium")}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// Settings section wrapper
export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  action,
  className,
}: SettingsSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="border rounded-lg p-4">{children}</div>
    </div>
  );
}

export default SettingsLayout;
