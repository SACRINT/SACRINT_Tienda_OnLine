// Order Detail Component
// Order details view for admin

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Package,
  Truck,
  MapPin,
  CreditCard,
  Clock,
  User,
  FileText,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import {
  OrderStatusIndicator,
  PaymentStatusIndicator,
  OrderStatus,
  PaymentStatus,
} from "@/components/ui/status-indicator";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { SelectField } from "@/components/ui/select-field";
import Image from "next/image";


export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface OrderDetailData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4?: string;
  };
  tracking?: {
    carrier: string;
    number: string;
    url?: string;
  };
  notes?: string;
  timeline: Array<{
    id: string;
    title: string;
    description?: string;
    date: string;
    status: "completed" | "current" | "upcoming";
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailProps {
  order: OrderDetailData;
  currency?: string;
  onUpdateStatus?: (status: OrderStatus) => void;
  onAddTracking?: () => void;
  onPrintInvoice?: () => void;
  onSendEmail?: () => void;
  onRefund?: () => void;
  onAddNote?: (note: string) => void;
  loading?: boolean;
  className?: string;
}

export function OrderDetail({
  order,
  currency = "USD",
  onUpdateStatus,
  onAddTracking,
  onPrintInvoice,
  onSendEmail,
  onRefund,
  onAddNote,
  loading,
  className,
}: OrderDetailProps) {
  const [noteInput, setNoteInput] = React.useState("");

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const handleAddNote = () => {
    if (noteInput.trim()) {
      onAddNote?.(noteInput.trim());
      setNoteInput("");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">Placed on {order.createdAt}</p>
        </div>
        <div className="flex items-center gap-2">
          {onPrintInvoice && (
            <Button variant="outline" size="sm" onClick={onPrintInvoice}>
              <FileText className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          )}
          {onSendEmail && (
            <Button variant="outline" size="sm" onClick={onSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Email
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Order Status</h3>
              {onUpdateStatus && (
                <SelectField
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "confirmed", label: "Confirmed" },
                    { value: "processing", label: "Processing" },
                    { value: "shipped", label: "Shipped" },
                    { value: "delivered", label: "Delivered" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  value={order.status}
                  onChange={(e) =>
                    onUpdateStatus(e.target.value as OrderStatus)
                  }
                  className="w-40"
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusIndicator status={order.status} />
              <PaymentStatusIndicator status={order.paymentStatus} />
            </div>
          </div>

          {/* Items */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.image && (
                    <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku}
                      {item.variant && ` • ${item.variant}`}
                    </p>
                    <p className="text-sm">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Order Timeline</h3>
            <Timeline
              items={order.timeline.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                date: item.date,
                status: item.status,
                icon: Clock,
              }))}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4" />
              <h3 className="font-semibold">Customer</h3>
            </div>
            <div className="flex items-center gap-3">
              <AvatarCustom
                src={order.customer.avatar}
                name={order.customer.name}
                size="md"
              />
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer.email}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4" />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="text-sm">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.address}
              </p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-muted-foreground">
                {order.shippingAddress.country}
              </p>
            </div>
          </div>

          {/* Tracking */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <h3 className="font-semibold">Tracking</h3>
              </div>
              {onAddTracking && !order.tracking && (
                <Button variant="ghost" size="sm" onClick={onAddTracking}>
                  Add
                </Button>
              )}
            </div>
            {order.tracking ? (
              <div className="text-sm">
                <p className="font-medium">{order.tracking.carrier}</p>
                <p className="text-muted-foreground">{order.tracking.number}</p>
                {order.tracking.url && (
                  <a
                    href={order.tracking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Track shipment
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tracking information
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4" />
              <h3 className="font-semibold">Payment</h3>
            </div>
            <div className="text-sm">
              <p className="font-medium">{order.paymentMethod.type}</p>
              {order.paymentMethod.last4 && (
                <p className="text-muted-foreground">
                  ending in {order.paymentMethod.last4}
                </p>
              )}
            </div>
            {onRefund && order.paymentStatus === "paid" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={onRefund}
              >
                Issue Refund
              </Button>
            )}
          </div>

          {/* Notes */}
          {onAddNote && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Notes</h3>
              {order.notes && (
                <p className="text-sm text-muted-foreground mb-3">
                  {order.notes}
                </p>
              )}
              <div className="space-y-2">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteInput.trim()}
                >
                  Add Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
