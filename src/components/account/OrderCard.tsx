// Order Card Component
// Display order summary with status, items, and actions

"use client";
import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  variantInfo?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface OrderCardProps {
  order: Order;
  onViewDetails?: (orderId: string) => void;
  onDownloadInvoice?: (orderId: string) => void;
  onRequestReturn?: (orderId: string) => void;
  variant?: "compact" | "expanded";
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  processing: {
    label: "Processing",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

export function OrderCard({
  order,
  onViewDetails,
  onDownloadInvoice,
  onRequestReturn,
  variant = "compact",
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(variant === "expanded");
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canRequestReturn = order.status === "delivered";
  const canTrack = order.status === "shipped" && order.trackingNumber;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Order Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="font-mono text-sm font-semibold text-gray-900">
                #{order.orderNumber}
              </p>
            </div>
            <div className="h-10 w-px bg-gray-300" />
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div
              className={`inline-flex items-center gap-2 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border px-4 py-2`}
            >
              <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
              <span className={`text-sm font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Tracking Info (if shipped) */}
        {canTrack && (
          <div className="mt-3 rounded-lg bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Tracking Number: {order.trackingNumber}
                </p>
                {order.estimatedDelivery && (
                  <p className="text-sm text-gray-600">
                    Estimated Delivery: {formatDate(order.estimatedDelivery)}
                  </p>
                )}
              </div>
              <Link
                href={`/track/${order.trackingNumber}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Track Package →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Order Items (Expandable) */}
      {isExpanded && (
        <div className="p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            Order Items ({order.items.length})
          </h4>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
              >
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    href={`/shop/products/${item.productId}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {item.productName}
                  </Link>
                  {item.variantInfo && (
                    <p className="text-sm text-gray-600">{item.variantInfo}</p>
                  )}
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
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

          {/* Order Summary */}
          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                ${order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-900">
                ${order.shipping.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">
                ${order.tax.toFixed(2)}
              </span>
            </div>
            {order.discount && order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-green-600">
                  -${order.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <h5 className="mb-2 text-sm font-semibold text-gray-900">
              Shipping Address
            </h5>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 bg-gray-50 p-4">
        <button
          onClick={() => onViewDetails?.(order.id)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          <span>View Details</span>
        </button>

        <button
          onClick={() => onDownloadInvoice?.(order.id)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          <span>Download Invoice</span>
        </button>

        {canRequestReturn && (
          <button
            onClick={() => onRequestReturn?.(order.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Package className="h-4 w-4" />
            <span>Request Return</span>
          </button>
        )}

        {!isExpanded && (
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-600">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </p>
            <p className="font-semibold text-gray-900">
              ${order.total.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
