"use client";

import * as React from "react";
import Link from "next/link";
import { X, ArrowRight, Tag, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  title: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  variant?: "default" | "accent" | "mint" | "gradient";
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function PromoBanner({
  title,
  description,
  ctaText = "Ver más",
  ctaLink = "/ofertas",
  variant = "default",
  dismissible = true,
  onDismiss,
  className,
}: PromoBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const variantStyles = {
    default: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
    mint: "bg-mint text-mint-foreground",
    gradient: "bg-gradient-to-r from-primary via-accent to-mint text-white",
  };

  return (
    <div
      className={cn("relative py-3 px-4", variantStyles[variant], className)}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Tag className="h-5 w-5 shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-semibold">{title}</span>
            {description && (
              <span className="text-sm opacity-90">{description}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ctaLink && (
            <Link href={ctaLink}>
              <Button
                variant={variant === "default" ? "secondary" : "outline"}
                size="sm"
                className="whitespace-nowrap"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}

          {dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Cerrar banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Countdown Banner variant
interface CountdownBannerProps {
  title: string;
  endDate: Date;
  ctaText?: string;
  ctaLink?: string;
  className?: string;
}

export function CountdownBanner({
  title,
  endDate,
  ctaText = "Comprar ahora",
  ctaLink = "/ofertas",
  className,
}: CountdownBannerProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-error to-accent py-4 px-4 text-white",
        className,
      )}
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 animate-pulse" />
          <span className="font-bold text-lg">{title}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[
              { label: "Días", value: timeLeft.days },
              { label: "Hrs", value: timeLeft.hours },
              { label: "Min", value: timeLeft.minutes },
              { label: "Seg", value: timeLeft.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/20 rounded px-2 py-1 text-center min-w-[50px]"
              >
                <div className="text-xl font-bold">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="text-xs opacity-80">{item.label}</div>
              </div>
            ))}
          </div>

          <Link href={ctaLink}>
            <Button variant="secondary" size="sm">
              {ctaText}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Flash Sale Banner
interface FlashSaleBannerProps {
  discount: number;
  productCount?: number;
  ctaLink?: string;
  className?: string;
}

export function FlashSaleBanner({
  discount,
  productCount,
  ctaLink = "/ofertas/flash",
  className,
}: FlashSaleBannerProps) {
  return (
    <div
      className={cn(
        "bg-error text-white py-3 px-4 overflow-hidden relative",
        className,
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      <div className="container mx-auto flex items-center justify-between gap-4 relative">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-accent animate-pulse" />
          <div>
            <span className="font-bold text-lg">
              ¡VENTA FLASH! {discount}% OFF
            </span>
            {productCount && (
              <span className="ml-2 text-sm opacity-90">
                en {productCount}+ productos
              </span>
            )}
          </div>
        </div>

        <Link href={ctaLink}>
          <Button
            variant="secondary"
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Ver ofertas
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
