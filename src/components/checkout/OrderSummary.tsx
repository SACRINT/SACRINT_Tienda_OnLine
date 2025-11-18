// Order Summary Component
// Final review of order before placing

"use client";
import Image from "next/image";

import { Package, MapPin, Truck, CreditCard, Tag, Edit2 } from "lucide-react";
import type { Address } from "@/components/account";
import type { ShippingOption } from "./ShippingMethod";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  variantInfo?: string;
}

export interface OrderSummaryProps {
  items: CartItem[];
  shippingAddress: Address;
  shippingMethod: ShippingOption;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount?: number;
  couponCode?: string;
  total: number;
  onEdit?: (step: "shipping" | "method" | "payment") => void;
}

export function OrderSummary({
  items,
  shippingAddress,
  shippingMethod,
  subtotal,
  shippingCost,
  tax,
  discount = 0,
  couponCode,
  total,
  onEdit,
}: OrderSummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Review Your Order
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Please review all details before placing your order
        </p>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Package className="h-5 w-5" />
              Order Items ({items.length})
            </h3>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 px-6 py-4">
              {item.productImage ? (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {item.productName}
                </h4>
                {item.variantInfo && (
                  <p className="text-sm text-gray-600">{item.variantInfo}</p>
                )}
                <p className="mt-1 text-sm text-gray-600">
                  Qty: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ${item.price.toFixed(2)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-sm text-gray-600">
                    ${(item.price / item.quantity).toFixed(2)} each
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </h3>
            <button
              onClick={() => onEdit?.("shipping")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="font-medium text-gray-900">
            {shippingAddress.fullName}
          </p>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>{shippingAddress.addressLine1}</p>
            {shippingAddress.addressLine2 && (
              <p>{shippingAddress.addressLine2}</p>
            )}
            <p>
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postalCode}
            </p>
            <p>{shippingAddress.country}</p>
            <p className="mt-2 font-medium">{shippingAddress.phone}</p>
          </div>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Truck className="h-5 w-5" />
              Shipping Method
            </h3>
            <button
              onClick={() => onEdit?.("method")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{shippingMethod.name}</p>
              <p className="text-sm text-gray-600">
                {shippingMethod.description}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Estimated delivery: {shippingMethod.estimatedDays}
              </p>
            </div>
            <div className="text-right">
              {shippingMethod.price === 0 ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  FREE
                </span>
              ) : (
                <p className="font-semibold text-gray-900">
                  ${shippingMethod.price.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </h3>
            <button
              onClick={() => onEdit?.("payment")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Credit Card</p>
              <p className="text-sm text-gray-600">•••• •••• •••• 4242</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Tag className="h-5 w-5" />
            Price Details
          </h3>
        </div>
        <div className="space-y-3 px-6 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-gray-900">
              {shippingCost === 0 ? (
                <span className="text-green-600">FREE</span>
              ) : (
                `$${shippingCost.toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated Tax</span>
            <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                Discount
                {couponCode && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    {couponCode}
                  </span>
                )}
              </span>
              <span className="font-medium text-green-600">
                -${discount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-900">
                Order Total
              </span>
              <span className="text-2xl font-bold text-gray-900">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          By placing this order, you agree to our{" "}
          <a
            href="/terms"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Privacy Policy
          </a>
          . Your payment information is processed securely.
        </p>
      </div>
    </div>
  );
}
