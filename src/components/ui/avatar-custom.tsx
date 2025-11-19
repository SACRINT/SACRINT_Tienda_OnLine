// Avatar Custom Component
// Extended avatar with status indicator and group support

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy" | "away";

export interface AvatarCustomProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

const statusStyles: Record<AvatarStatus, string> = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-yellow-500",
};

const statusSizes: Record<AvatarSize, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function AvatarCustom({
  src,
  alt,
  name,
  size = "md",
  status,
  className,
}: AvatarCustomProps) {
  const [imageError, setImageError] = React.useState(false);

  const showImage = src && !imageError;
  const showInitials = !showImage && name;
  const showFallback = !showImage && !name;

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full",
          sizeStyles[size],
          !showImage && (name ? getColorFromName(name) : "bg-muted"),
        )}
      >
        {showImage && (
          <img
            src={src}
            alt={alt || name || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {showInitials && (
          <span className="font-medium text-white">{getInitials(name)}</span>
        )}
        {showFallback && (
          <User
            className="h-1/2 w-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
            statusStyles[status],
            statusSizes[size],
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

// Avatar group for multiple avatars
export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  children,
  max = 5,
  size = "md",
  className,
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const hiddenCount = childArray.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {hiddenCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted ring-2 ring-background",
            sizeStyles[size],
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            +{hiddenCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default AvatarCustom;
