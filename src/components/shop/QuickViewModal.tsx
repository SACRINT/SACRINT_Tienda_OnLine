"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star, Eye, Minus, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/useCart";
import { useWishlist } from "@/lib/store/useWishlist";
import { toast } from "@/lib/store/useToast";

export interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  images?: string[];
  price: number;
  salePrice?: number | null;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock?: number;
  category?: string;
  sku?: string;
}

interface QuickViewModalProps {
  product: QuickViewProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [imageError, setImageError] = React.useState(false);

  const { addItem } = useCart();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedImage(0);
      setImageError(false);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const displayPrice =
    product.salePrice && product.salePrice < product.price
      ? product.salePrice
      : product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const images = product.images?.length ? product.images : [product.image];
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!product.inStock) return;

    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      sku: product.slug,
      price: displayPrice,
      image: product.image,
      quantity,
      slug: product.slug, // Added slug
    });

    toast.success(
      "Producto agregado",
      `${product.name} x${quantity} agregado al carrito`,
    );
    onClose();
  };

  const handleToggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info("Removido de favoritos", product.name);
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: displayPrice,
        image: product.image,
      });
      toast.success("Agregado a favoritos", product.name);
    }
  };

  const incrementQuantity = () => {
    if (product.stock && quantity >= product.stock) return;
    setQuantity((q) => q + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-gray-100">
            <div className="aspect-square relative">
              {!imageError ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-200">
                  <span className="text-gray-400">Sin imagen</span>
                </div>
              )}

              {/* Discount Badge */}
              {hasDiscount && product.inStock && (
                <div className="absolute right-3 top-3 rounded-lg bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-md">
                  -{discountPercent}%
                </div>
              )}

              {/* Out of Stock Overlay */}
              {!product.inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <span className="rounded-lg bg-white px-4 py-2 font-bold text-gray-900">
                    Agotado
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ${
                      selectedImage === idx
                        ? "ring-2 ring-blue-500"
                        : "ring-1 ring-gray-200"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="p-6 flex flex-col">
            {/* Category */}
            {product.category && (
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {product.category}
              </p>
            )}

            {/* Name */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-gray-500 mb-3">SKU: {product.sku}</p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)} ({product.reviewCount} reseñas)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-gray-900">
                $
                {displayPrice.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-500 line-through">
                  $
                  {product.price.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Stock Status */}
            <div className="mb-4">
              {product.inStock ? (
                <span className="text-sm text-green-600 font-medium">
                  En stock {product.stock && `(${product.stock} disponibles)`}
                </span>
              ) : (
                <span className="text-sm text-red-600 font-medium">
                  Agotado
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">
                  Cantidad:
                </span>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    disabled={product.stock ? quantity >= product.stock : false}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto">
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.inStock ? "Agregar al Carrito" : "Agotado"}
              </Button>

              <Button
                onClick={handleToggleWishlist}
                variant="outline"
                size="lg"
              >
                <Heart
                  className={`h-5 w-5 ${
                    inWishlist ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </div>

            {/* View Full Details Link */}
            <Link
              href={`/shop/products/${product.slug}`}
              onClick={onClose}
              className="mt-4 text-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Ver detalles completos
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick View Button Component for use in ProductCard
export function QuickViewButton({
  onClick,
  className = "",
}: {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label="Vista rápida"
    >
      <Eye className="h-5 w-5 text-gray-600" />
    </button>
  );
}
