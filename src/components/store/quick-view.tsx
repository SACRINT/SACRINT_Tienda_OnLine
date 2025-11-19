// Quick View Component
// Modal for quick product preview

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";

export interface QuickViewProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  stock: number;
  description?: string;
  variants?: Array<{
    type: string;
    options: Array<{
      value: string;
      label: string;
      available: boolean;
    }>;
  }>;
}

export interface QuickViewProps {
  product: QuickViewProduct | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (productId: string, quantity: number, variants: Record<string, string>) => void;
  onViewDetails?: (productId: string) => void;
  currency?: string;
  className?: string;
}

export function QuickView({
  product,
  open,
  onClose,
  onAddToCart,
  onViewDetails,
  currency = "USD",
  className,
}: QuickViewProps) {
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>({});

  // Reset state when product changes
  React.useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    setSelectedVariants({});
  }, [product?.id]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const handlePrevImage = () => {
    if (!product) return;
    setSelectedImage((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!product) return;
    setSelectedImage((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [type]: value }));
  };

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart(product.id, quantity, selectedVariants);
      onClose();
    }
  };

  if (!open || !product) return null;

  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-1 hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-6 p-6 max-h-[90vh] overflow-y-auto">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={product.images[selectedImage]}
                alt={`${product.name} - Image ${selectedImage + 1}`}
                className="h-full w-full object-cover"
              />

              {product.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2",
                      index === selectedImage
                        ? "border-primary"
                        : "border-transparent"
                    )}
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <h2 id="quick-view-title" className="text-xl font-bold">
                {product.name}
              </h2>

              {product.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{product.rating.toFixed(1)}</span>
                  {product.reviewCount && (
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              {product.salePrice ? (
                <>
                  <span className="text-2xl font-bold">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-red-500">-{discount}%</span>
                </>
              ) : (
                <span className="text-2xl font-bold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants?.map((variant) => (
              <div key={variant.type} className="space-y-2">
                <label className="text-sm font-medium capitalize">
                  {variant.type}
                </label>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleVariantChange(variant.type, option.value)
                      }
                      disabled={!option.available}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md border transition-colors",
                        selectedVariants[variant.type] === option.value
                          ? "border-primary bg-primary/10"
                          : "border-input hover:border-muted-foreground",
                        !option.available && "opacity-50 line-through"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <NumberInput
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={product.stock}
                disabled={product.stock === 0}
              />
              {product.stock > 0 && product.stock <= 10 && (
                <p className="text-sm text-warning">
                  Only {product.stock} left in stock
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              {onViewDetails && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onViewDetails(product.id)}
                >
                  View Full Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickView;
