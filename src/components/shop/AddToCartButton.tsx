"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/store/useCart";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  productImage: string;
  stock: number;
  variantId?: string | null;
}

export function AddToCartButton({
  productId,
  productName,
  productSlug,
  productPrice,
  productImage,
  stock,
  variantId = null,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    useCart.persist.rehydrate();
  }, []);

  const handleAddToCart = () => {
    if (stock === 0) return;

    addItem({
      productId,
      variantId,
      quantity,
      price: productPrice,
      name: productName,
      image: productImage,
      sku: productSlug,
      slug: productSlug, // Added slug
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {stock > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Cantidad:</label>
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-4 py-2 border-x">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
              disabled={quantity >= stock}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={stock === 0}
        className={`flex-1 w-full rounded-lg px-8 py-4 font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          isAdded
            ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        }`}
      >
        {stock === 0 ? (
          "Agotado"
        ) : isAdded ? (
          <span className="flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            Agregado al Carrito
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Agregar al Carrito
          </span>
        )}
      </button>
    </div>
  );
}
