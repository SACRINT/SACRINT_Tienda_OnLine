"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckoutWizard, type CheckoutData } from "@/components/checkout/CheckoutWizard";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import { ShippingMethod, DEFAULT_SHIPPING_OPTIONS } from "@/components/checkout/ShippingMethod";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderSummary, type CartItem } from "@/components/checkout/OrderSummary";
import { useCart } from "@/lib/store/useCart";
import type { Address } from "@/components/account";
import type { ShippingOption } from "@/components/checkout/ShippingMethod";
import { toast } from "sonner";

export default function CheckoutWizardPage() {
  const router = useRouter();
  const { items: cartItems, subtotal: getSubtotal, tax: getTax, clear } = useCart();
  const [mounted, setMounted] = React.useState(false);

  // Checkout state
  const [selectedAddress, setSelectedAddress] = React.useState<Address | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = React.useState<ShippingOption | null>(
    null,
  );
  const [checkoutData, setCheckoutData] = React.useState<CheckoutData>({});

  // Mock addresses (en producción vendrían de la API)
  const [savedAddresses, setSavedAddresses] = React.useState<Address[]>([
    {
      id: "addr_1",
      type: "shipping",
      fullName: "Juan Pérez",
      addressLine1: "Av. Reforma 123",
      addressLine2: "Piso 5",
      city: "Ciudad de México",
      state: "CDMX",
      postalCode: "06600",
      country: "México",
      phone: "+52 55 1234 5678",
      isDefault: true,
    },
  ]);

  React.useEffect(() => {
    useCart.persist.rehydrate();
    setMounted(true);
  }, []);

  // Calculate totals
  const subtotal = getSubtotal();
  const shippingCost = selectedShippingMethod?.price || 0;
  const tax = getTax();
  const total = subtotal + shippingCost + tax;

  // Transform cart items to OrderSummary format
  const orderItems: CartItem[] = cartItems.map((item) => ({
    id: item.id,
    productId: item.productId || item.id,
    productName: item.name,
    productImage: item.image,
    quantity: item.quantity,
    price: item.price * item.quantity,
    variantInfo: item.variant ? `Variante: ${item.variant}` : undefined,
  }));

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setCheckoutData((prev) => ({
      ...prev,
      shippingAddress: address,
    }));
  };

  const handleAddNewAddress = async (newAddress: Omit<Address, "id">) => {
    // En producción, esto haría una llamada a la API
    const addressWithId: Address = {
      ...newAddress,
      id: `addr_${Date.now()}`,
    };

    setSavedAddresses((prev) => [...prev, addressWithId]);
    setSelectedAddress(addressWithId);
    setCheckoutData((prev) => ({
      ...prev,
      shippingAddress: addressWithId,
    }));

    toast.success("Dirección guardada correctamente");
  };

  const handleShippingMethodSelect = (method: ShippingOption) => {
    setSelectedShippingMethod(method);
    setCheckoutData((prev) => ({
      ...prev,
      shippingMethod: method,
    }));
  };

  const handlePaymentComplete = (paymentData: any) => {
    setCheckoutData((prev) => ({
      ...prev,
      paymentMethod: paymentData,
    }));
  };

  const handleEditStep = (step: "shipping" | "method" | "payment") => {
    // Esta función sería llamada desde OrderSummary para editar pasos previos
    const stepMap = {
      shipping: 0,
      method: 1,
      payment: 2,
    };
    // El CheckoutWizard maneja la navegación internamente
    console.log(`Editar paso: ${step}`);
  };

  const handleCompleteOrder = async (data: CheckoutData) => {
    try {
      // En producción, esto enviaría la orden a la API
      console.log("Procesando orden:", {
        ...data,
        items: orderItems,
        totals: {
          subtotal,
          shipping: shippingCost,
          tax,
          total,
        },
      });

      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Limpiar carrito
      clear();

      // Redirigir a página de éxito
      toast.success("¡Orden procesada exitosamente!");
      router.push("/checkout/success");
    } catch (error) {
      console.error("Error al procesar orden:", error);
      toast.error("Error al procesar la orden. Por favor, intenta de nuevo.");
      throw error;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded bg-gray-200"></div>
            <div className="h-96 rounded-lg bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold">Tu carrito está vacío</h2>
          <p className="mb-6 text-gray-600">Agrega productos antes de proceder al checkout.</p>
          <button
            onClick={() => router.push("/shop")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Ir a la Tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutWizard initialStep={0} onComplete={handleCompleteOrder}>
      {/* Paso 1: Dirección de Envío */}
      <AddressSelector
        addresses={savedAddresses}
        selectedAddressId={selectedAddress?.id}
        onAddressSelect={handleAddressSelect}
        onAddNewAddress={handleAddNewAddress}
      />

      {/* Paso 2: Método de Envío */}
      <ShippingMethod
        options={DEFAULT_SHIPPING_OPTIONS}
        selectedMethodId={selectedShippingMethod?.id}
        onMethodSelect={handleShippingMethodSelect}
        subtotal={subtotal}
        freeShippingThreshold={999}
      />

      {/* Paso 3: Pago */}
      <PaymentForm amount={total} onPaymentComplete={handlePaymentComplete} />

      {/* Paso 4: Revisar Orden */}
      {selectedAddress && selectedShippingMethod && (
        <OrderSummary
          items={orderItems}
          shippingAddress={selectedAddress}
          shippingMethod={selectedShippingMethod}
          subtotal={subtotal}
          shippingCost={shippingCost}
          tax={tax}
          total={total}
          onEdit={handleEditStep}
        />
      )}
    </CheckoutWizard>
  );
}
