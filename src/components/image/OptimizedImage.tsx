"use client";

import * as React from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  fallback?: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  showSkeleton?: boolean;
  onLoad?: () => void;
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[2/1]",
};

export function OptimizedImage({
  src,
  alt,
  fallback = "/placeholder.svg",
  aspectRatio,
  showSkeleton = true,
  className,
  onLoad,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  const imageSrc = error ? fallback : src;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatio && aspectRatioClasses[aspectRatio],
        className,
      )}
    >
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        {...props}
      />
    </div>
  );
}

// Product image with zoom on hover
export function ProductImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <div className="group relative overflow-hidden">
      <OptimizedImage
        src={src}
        alt={alt}
        className={cn(
          "transition-transform duration-300 group-hover:scale-105",
          className,
        )}
        {...props}
      />
    </div>
  );
}

// Avatar image with fallback initials
export function AvatarImage({
  src,
  alt,
  size = 40,
  initials,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  initials?: string;
  className?: string;
}) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
          className,
        )}
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {initials || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      onError={() => setError(true)}
    />
  );
}

// Background image with overlay
export function BackgroundImage({
  src,
  alt,
  overlay = true,
  overlayOpacity = 0.5,
  children,
  className,
}: {
  src: string;
  alt: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image src={src} alt={alt} fill className="object-cover" priority />
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
