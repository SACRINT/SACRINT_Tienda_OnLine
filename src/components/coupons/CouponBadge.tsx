"use client";

import { Tag, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Coupon, formatCoupon, getCouponColor } from "@/lib/coupons";
import { cn } from "@/lib/utils";

interface CouponBadgeProps {
  coupon: Coupon;
  showDetails?: boolean;
  className?: string;
}

export function CouponBadge({
  coupon,
  showDetails = false,
  className,
}: CouponBadgeProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
    }).format(date);

  const daysUntilExpiry = Math.ceil(
    (coupon.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <Badge className={getCouponColor(coupon.type)}>
          {formatCoupon(coupon)}
        </Badge>
        {isExpiringSoon && (
          <span className="text-xs text-warning flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {daysUntilExpiry} días
          </span>
        )}
      </div>

      <div className="space-y-1">
        <code className="text-lg font-bold font-mono">{coupon.code}</code>
        {coupon.description && (
          <p className="text-sm text-muted-foreground">{coupon.description}</p>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
          {coupon.minPurchase && <p>Compra mínima: ${coupon.minPurchase}</p>}
          {coupon.maxDiscount && <p>Descuento máximo: ${coupon.maxDiscount}</p>}
          <p>
            Válido: {formatDate(coupon.validFrom)} -{" "}
            {formatDate(coupon.validUntil)}
          </p>
          {coupon.usageLimit && (
            <p>
              Usos: {coupon.usageCount}/{coupon.usageLimit}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Simple inline coupon tag
export function CouponTag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium",
        className,
      )}
    >
      <Tag className="h-3 w-3" />
      {code}
    </span>
  );
}

// Coupon applied success indicator
export function CouponApplied({
  code,
  discount,
  onRemove,
}: {
  code: string;
  discount: number;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-success/10 rounded">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span className="text-sm font-medium">{code}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-success">
          -${discount.toFixed(0)}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-xs text-error hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}
