// Checkout Page
// Multi-step checkout process with wizard

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckoutWizard,
  AddressSelector,
  ShippingMethod,
  PaymentForm,
  OrderSummary,
  DEFAULT_SHIPPING_OPTIONS,
} from "@/components/checkout";
import type {
  CheckoutData,
  CartItem,
  ShippingOption,
} from "@/components/checkout";
import type { Address } from "@/components/account";

// Mock data
const getMockAddresses = (): Address[] => {
  return [
    {
      id: "1",
      type: "shipping",
      fullName: "John Doe",
      addressLine1: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "United States",
      phone: "+1 (555) 123-4567",
      isDefault: true,
    },
  ];
};

const getMockCartItems = (): CartItem[] => {
  return [
    {
      id: "1",
      productId: "1",
      productName: "Premium Wireless Headphones",
      productImage:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      quantity: 1,
      price: 249.99,
    },
  ];
};

export default function CheckoutPage() {
  const router = useRouter();
  const [addresses] = useState<Address[]>(getMockAddresses());
  const [cartItems] = useState<CartItem[]>(getMockCartItems());

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    addresses.find((a) => a.isDefault) || null,
  );
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);

  // Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = selectedShipping?.price || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleComplete = async (data: CheckoutData) => {
    console.log("Placing order:", data);
    // In production, call API to create order
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push("/order/success?orderId=12345");
  };

  return (
    <CheckoutWizard onComplete={handleComplete}>
      {/* Step 1: Shipping Address */}
      <AddressSelector
        addresses={addresses}
        selectedAddressId={selectedAddress?.id}
        onAddressSelect={setSelectedAddress}
        onAddNewAddress={async (address) => {
          console.log("Add new address:", address);
        }}
      />

      {/* Step 2: Shipping Method */}
      <ShippingMethod
        options={DEFAULT_SHIPPING_OPTIONS}
        selectedMethodId={selectedShipping?.id}
        onMethodSelect={setSelectedShipping}
      />

      {/* Step 3: Payment */}
      <PaymentForm amount={total} />

      {/* Step 4: Review Order */}
      {selectedAddress && selectedShipping && (
        <OrderSummary
          items={cartItems}
          shippingAddress={selectedAddress}
          shippingMethod={selectedShipping}
          subtotal={subtotal}
          shippingCost={shipping}
          tax={tax}
          total={total}
        />
      )}
    </CheckoutWizard>
  );
}
