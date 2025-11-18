"use client";

// Shopping Cart Page
// Display cart items with quantity control and checkout button

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { SwipeableCartItem } from "@/components/cart/SwipeableCartItem";
import type { CartItem as SwipeableCartItemType } from "@/components/cart/SwipeableCartItem";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  price: number;
  quantity: number;
  stock: number;
  variantInfo?: string;
}

// Mock cart data
const getMockCartItems = (): CartItem[] => {
  return [
    {
      id: "1",
      productId: "1",
      productName: "Premium Wireless Headphones",
      productSlug: "premium-wireless-headphones",
      productImage:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      price: 249.99,
      quantity: 1,
      stock: 45,
    },
    {
      id: "2",
      productId: "2",
      productName: "Wireless Earbuds Pro",
      productSlug: "wireless-earbuds-pro",
      productImage:
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
      price: 149.99,
      quantity: 2,
      stock: 120,
      variantInfo: "Color: Black",
    },
  ];
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(getMockCartItems());
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(newQuantity, item.stock)),
            }
          : item,
      ),
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId));
  };

  const applyCoupon = () => {
    // Mock coupon validation
    if (couponCode.toUpperCase() === "SAVE10") {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discount: subtotal * 0.1,
      });
      setCouponCode("");
    } else {
      alert("Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + shipping + tax - discount;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-600">
              Add some items to your cart to get started
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Start Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in
            your cart
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-2 md:space-y-4">
              {cartItems.map((item) => {
                // Convert to swipeable cart item format
                const swipeableItem: SwipeableCartItemType = {
                  id: item.id,
                  name: item.productName,
                  image: item.productImage || "",
                  price: item.price,
                  quantity: item.quantity,
                  stock: item.stock,
                  variant: item.variantInfo,
                };

                return (
                  <SwipeableCartItem
                    key={item.id}
                    item={swipeableItem}
                    onQuantityChange={updateQuantity}
                    onRemove={removeItem}
                  />
                );
              })}
            </div>

            {/* Continue Shopping */}
            <Link
              href="/shop"
              className="mt-4 md:mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary - Sticky on desktop, bottom sheet on mobile */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              {/* Summary Card */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  Order Summary
                </h2>

                <div className="mt-4 md:mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span className="font-medium text-gray-900">
                      ${tax.toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600">
                        Discount
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {appliedCoupon.code}
                        </span>
                      </span>
                      <span className="font-medium text-green-600">
                        -${appliedCoupon.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                {!appliedCoupon && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Coupon Code
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={applyCoupon}
                        className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Coupon &quot;{appliedCoupon.code}&quot; applied
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Checkout Button */}
                <Link
                  href="/checkout"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              {/* Free Shipping Notice */}
              {shipping > 0 && (
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    Add <strong>${(50 - subtotal).toFixed(2)}</strong> more to
                    get <strong>FREE shipping</strong>!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
