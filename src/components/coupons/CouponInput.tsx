"use client";

import * as React from "react";
import { Tag, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateCoupon, type Coupon } from "@/lib/coupons";
import { cn } from "@/lib/utils";

interface CouponInputProps {
  subtotal: number;
  onApply: (coupon: Coupon, discount: number) => void;
  onRemove: () => void;
  appliedCoupon?: Coupon | null;
  className?: string;
}

export function CouponInput({
  subtotal,
  onApply,
  onRemove,
  appliedCoupon,
  className,
}: CouponInputProps) {
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = validateCoupon(code, subtotal);

    if (result.valid && result.coupon && result.discount !== undefined) {
      setSuccess(result.message);
      onApply(result.coupon, result.discount);
      setCode("");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleRemove = () => {
    onRemove();
    setSuccess("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  if (appliedCoupon) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-success" />
            <div>
              <span className="font-medium text-sm">{appliedCoupon.code}</span>
              {appliedCoupon.description && (
                <p className="text-xs text-muted-foreground">
                  {appliedCoupon.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 w-8 p-0 text-error hover:text-error hover:bg-error/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {success && (
          <p className="text-sm text-success flex items-center gap-1">
            <Check className="h-4 w-4" />
            {success}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Código de cupón"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={!code.trim() || loading}
          variant="outline"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-error flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Suggested coupons */}
      <div className="text-xs text-muted-foreground">
        Prueba: <code className="bg-muted px-1 rounded">DESCUENTO10</code> o{" "}
        <code className="bg-muted px-1 rounded">ENVIOGRATIS</code>
      </div>
    </div>
  );
}
