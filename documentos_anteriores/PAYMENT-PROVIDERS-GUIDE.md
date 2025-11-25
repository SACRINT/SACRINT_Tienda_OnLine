# Payment Providers Architecture Guide

**Version**: 1.0.0
**Date**: November 22, 2025
**Week**: 19-20 - Multiple Payment Gateways

---

## 🎯 Overview

This guide explains the multi-provider payment architecture designed to support multiple payment gateways (Stripe, PayPal, MercadoPago, etc.) through a unified interface.

## 🏗️ Architecture

### Design Pattern: Strategy + Factory

```
┌─────────────────────────────────────────┐
│     PaymentProviderFactory              │
│  (Singleton)                             │
│                                          │
│  + getProvider(type)                     │
│  + getDefaultProvider()                  │
│  + getAllProviders()                     │
└────────────┬────────────────────────────┘
             │
             │ manages
             ▼
┌────────────────────────────────────────────────┐
│          IPaymentProvider                       │
│  (Interface)                                    │
│                                                 │
│  + createPaymentIntent()                        │
│  + getPaymentIntent()                           │
│  + cancelPaymentIntent()                        │
│  + createRefund()                               │
│  + createCustomer()                             │
│  + verifyWebhookSignature()                     │
│  + parseWebhookEvent()                          │
└───┬────────────────────────────────────────────┘
    │
    │ implements
    ├──────────┬──────────┬──────────┬──────────
    ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Stripe  │ │ PayPal  │ │ Mercado │ │ OpenPay │
│Provider │ │Provider │ │  Pago   │ │Provider │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## 📂 File Structure

```
src/lib/payments/
├── payment-provider.interface.ts    # Base interface & types
├── payment-provider.factory.ts      # Factory for provider management
└── providers/
    ├── stripe-provider.ts           # Stripe implementation ✅
    ├── paypal-provider.ts           # PayPal template 🚧
    ├── mercadopago-provider.ts      # MercadoPago template 🚧
    └── openpay-provider.ts          # OpenPay template 🚧
```

## 🔑 Key Interfaces

### IPaymentProvider

All payment providers must implement this interface:

```typescript
interface IPaymentProvider {
  readonly provider: PaymentProvider;
  readonly isConfigured: boolean;

  createPaymentIntent(params: {...}): Promise<PaymentIntent>;
  getPaymentIntent(id: string): Promise<PaymentIntent>;
  cancelPaymentIntent(id: string): Promise<PaymentIntent>;
  createRefund(request: RefundRequest): Promise<{...}>;
  createCustomer(params: {...}): Promise<PaymentCustomer>;
  verifyWebhookSignature(payload, signature, secret): boolean;
  parseWebhookEvent(payload: any): WebhookEvent;
  getSupportedPaymentMethods(): PaymentMethod[];
  getConfig(): {...};
}
```

### PaymentProvider Enum

```typescript
enum PaymentProvider {
  STRIPE = "STRIPE",
  PAYPAL = "PAYPAL",
  MERCADO_PAGO = "MERCADO_PAGO",
  OPENPAY = "OPENPAY",
}
```

### PaymentStatus Enum

```typescript
enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}
```

## 🚀 Usage Examples

### 1. Using the Default Provider (Stripe)

```typescript
import { getPaymentProvider } from "@/lib/payments/payment-provider.factory";

// Get default provider
const provider = getPaymentProvider();

// Create payment intent
const intent = await provider.createPaymentIntent({
  amount: 100.0, // $100.00
  currency: "usd",
  metadata: {
    orderId: "order_123",
    customerId: "user_456",
  },
});

console.log(intent.clientSecret); // For client-side Stripe.js
```

### 2. Using a Specific Provider

```typescript
import { getPaymentProvider } from "@/lib/payments/payment-provider.factory";
import { PaymentProvider } from "@/lib/payments/payment-provider.interface";

// Get PayPal provider
const paypal = getPaymentProvider(PaymentProvider.PAYPAL);

const intent = await paypal.createPaymentIntent({
  amount: 50.0,
  currency: "mxn",
});
```

### 3. Get All Available Providers

```typescript
import { paymentProviderFactory } from "@/lib/payments/payment-provider.factory";

const providers = paymentProviderFactory.getConfiguredProviders();

providers.forEach((provider) => {
  console.log(`${provider.provider} is ready`);
  console.log(`Supports: ${provider.getSupportedPaymentMethods().join(", ")}`);
});
```

### 4. Create a Customer

```typescript
const provider = getPaymentProvider();

const customer = await provider.createCustomer({
  email: "customer@example.com",
  name: "John Doe",
  phone: "+52 1 234 5678",
  metadata: {
    userId: "user_123",
  },
});
```

### 5. Handle Refunds

```typescript
const provider = getPaymentProvider();

const refund = await provider.createRefund({
  paymentIntentId: "pi_123",
  amount: 25.0, // Partial refund
  reason: "Customer request",
});

console.log(`Refund ${refund.id} - Status: ${refund.status}`);
```

## 🔧 Adding a New Provider

### Step 1: Create Provider Class

```typescript
// src/lib/payments/providers/new-provider.ts

import {
  IPaymentProvider,
  PaymentProvider,
  PaymentIntent,
  // ... other imports
} from "../payment-provider.interface";

export class NewPaymentProvider implements IPaymentProvider {
  readonly provider = PaymentProvider.NEW_PROVIDER;

  constructor() {
    // Initialize SDK
  }

  get isConfigured(): boolean {
    return !!process.env.NEW_PROVIDER_API_KEY;
  }

  async createPaymentIntent(params): Promise<PaymentIntent> {
    // Implement using provider's SDK
  }

  // ... implement all other interface methods
}
```

### Step 2: Add to Enum

```typescript
// payment-provider.interface.ts

export enum PaymentProvider {
  STRIPE = "STRIPE",
  PAYPAL = "PAYPAL",
  NEW_PROVIDER = "NEW_PROVIDER", // Add here
}
```

### Step 3: Register in Factory

```typescript
// payment-provider.factory.ts

private constructor() {
  this.providers = new Map();

  this.registerProvider(new StripePaymentProvider());
  this.registerProvider(new PayPalPaymentProvider());
  this.registerProvider(new NewPaymentProvider()); // Add here
}
```

### Step 4: Environment Variables

```bash
# .env.local

NEW_PROVIDER_API_KEY=your_api_key_here
NEW_PROVIDER_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_NEW_PROVIDER_PUBLIC_KEY=your_public_key
```

### Step 5: Create Webhook Handler

```typescript
// src/app/api/webhooks/new-provider/route.ts

import { getPaymentProvider } from "@/lib/payments/payment-provider.factory";
import { PaymentProvider } from "@/lib/payments/payment-provider.interface";

export async function POST(req: Request) {
  const provider = getPaymentProvider(PaymentProvider.NEW_PROVIDER);

  const payload = await req.text();
  const signature = req.headers.get("x-provider-signature");

  const isValid = provider.verifyWebhookSignature(
    payload,
    signature,
    process.env.NEW_PROVIDER_WEBHOOK_SECRET!,
  );

  if (!isValid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = provider.parseWebhookEvent(JSON.parse(payload));

  // Handle event types
  switch (event.type) {
    case "payment.succeeded":
      // Update order status
      break;
    case "payment.failed":
      // Handle failure
      break;
  }

  return new Response("OK", { status: 200 });
}
```

## 🔐 Environment Variables

### Stripe (Already Configured)

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### PayPal (To Be Configured)

```bash
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or 'live'
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_public_client_id
```

### MercadoPago (To Be Configured)

```bash
MERCADO_PAGO_ACCESS_TOKEN=your_access_token
MERCADO_PAGO_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=your_public_key
```

### OpenPay (To Be Configured)

```bash
OPENPAY_MERCHANT_ID=your_merchant_id
OPENPAY_PRIVATE_KEY=your_private_key
OPENPAY_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_OPENPAY_PUBLIC_KEY=your_public_key
```

## 📊 Database Schema Updates

Add payment provider tracking to orders:

```prisma
model Order {
  id                String   @id @default(cuid())
  // ... existing fields

  // Payment provider info
  paymentProvider   PaymentProvider  @default(STRIPE)
  paymentIntentId   String?
  paymentStatus     PaymentStatus    @default(PENDING)
  paymentMethod     PaymentMethod?

  // ... rest of model
}

enum PaymentProvider {
  STRIPE
  PAYPAL
  MERCADO_PAGO
  OPENPAY
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  CASH
  DIGITAL_WALLET
  BUY_NOW_PAY_LATER
}
```

## 🎨 Frontend Integration

### Provider Selection UI

```typescript
// components/checkout/PaymentProviderSelector.tsx

const providers = paymentProviderFactory.getConfiguredProviders();

return (
  <div>
    <h3>Selecciona método de pago</h3>
    {providers.map((provider) => (
      <button
        key={provider.provider}
        onClick={() => setSelectedProvider(provider.provider)}
      >
        <Image src={`/logos/${provider.provider.toLowerCase()}.svg`} />
        {provider.provider}
      </button>
    ))}
  </div>
);
```

### Dynamic Payment Form

```typescript
// Based on selected provider, load appropriate SDK

if (selectedProvider === PaymentProvider.STRIPE) {
  return <StripeCheckoutForm clientSecret={intent.clientSecret} />;
} else if (selectedProvider === PaymentProvider.PAYPAL) {
  return <PayPalButtons orderId={intent.id} />;
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe("PaymentProviderFactory", () => {
  it("should return default provider", () => {
    const provider = paymentProviderFactory.getDefaultProvider();
    expect(provider.provider).toBe(PaymentProvider.STRIPE);
  });

  it("should return all configured providers", () => {
    const providers = paymentProviderFactory.getConfiguredProviders();
    expect(providers.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
describe("Stripe Provider", () => {
  it("should create payment intent", async () => {
    const provider = getPaymentProvider(PaymentProvider.STRIPE);
    const intent = await provider.createPaymentIntent({
      amount: 10.0,
      currency: "usd",
    });

    expect(intent.id).toBeDefined();
    expect(intent.status).toBe(PaymentStatus.PENDING);
  });
});
```

## 📈 Analytics

Track payment provider performance:

```typescript
// Log provider metrics
await db.paymentAnalytics.create({
  data: {
    provider: provider.provider,
    paymentIntentId: intent.id,
    amount: params.amount,
    currency: params.currency,
    status: "created",
    metadata: params.metadata,
  },
});
```

## 🚨 Error Handling

```typescript
try {
  const provider = getPaymentProvider(selectedProvider);
  const intent = await provider.createPaymentIntent(params);
} catch (error) {
  if (error.message.includes("not configured")) {
    // Provider not available, fallback to default
    const fallback = getPaymentProvider();
    // ... use fallback
  } else {
    // Log error and show user-friendly message
    console.error("Payment error:", error);
    throw new Error("Unable to process payment");
  }
}
```

## 🔜 Future Enhancements

1. **Auto-retry with Fallback**: If primary provider fails, auto-retry with secondary
2. **Dynamic Provider Selection**: Based on user location, currency, or amount
3. **A/B Testing**: Test conversion rates across providers
4. **Fee Optimization**: Automatically select provider with lowest fees
5. **Payment Method Routing**: Route card payments to Stripe, wallets to PayPal, etc.

## 📚 Resources

- [Stripe API Docs](https://stripe.com/docs/api)
- [PayPal API Docs](https://developer.paypal.com/api/rest/)
- [MercadoPago API Docs](https://www.mercadopago.com.mx/developers/en/docs)
- [OpenPay API Docs](https://www.openpay.mx/docs/)

---

**Last Updated**: November 22, 2025
**Maintainer**: Development Team
