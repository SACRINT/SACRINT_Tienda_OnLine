// Payment Service Integration
// Stripe payment processing

import { z } from "zod";

// Payment schemas
export const PaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  customerId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  description: z.string().optional(),
  receiptEmail: z.string().email().optional(),
});

export const RefundSchema = z.object({
  paymentIntentId: z.string(),
  amount: z.number().positive().optional(), // Partial refund
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;
export type Refund = z.infer<typeof RefundSchema>;

// Payment result types
export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
}

export type PaymentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "requires_capture"
  | "canceled"
  | "succeeded";

// Customer types
export interface PaymentCustomer {
  id: string;
  email: string;
  name?: string;
  defaultPaymentMethod?: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_transfer" | "wallet";
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

// Payment service interface
export interface PaymentService {
  createPaymentIntent(data: PaymentIntent): Promise<PaymentIntentResult>;
  confirmPayment(paymentIntentId: string): Promise<PaymentIntentResult>;
  cancelPayment(paymentIntentId: string): Promise<void>;
  refund(data: Refund): Promise<RefundResult>;

  // Customer management
  createCustomer(email: string, name?: string): Promise<PaymentCustomer>;
  getCustomer(customerId: string): Promise<PaymentCustomer | null>;
  updateCustomer(customerId: string, data: Partial<PaymentCustomer>): Promise<PaymentCustomer>;

  // Payment methods
  listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
}

// Stripe implementation
export class StripePaymentService implements PaymentService {
  private apiKey: string;
  private baseUrl = "https://api.stripe.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createPaymentIntent(data: PaymentIntent): Promise<PaymentIntentResult> {
    const validated = PaymentIntentSchema.parse(data);

    const params = new URLSearchParams({
      amount: validated.amount.toString(),
      currency: validated.currency,
      automatic_payment_methods: JSON.stringify({ enabled: true }),
    });

    if (validated.customerId) {
      params.append("customer", validated.customerId);
    }

    if (validated.description) {
      params.append("description", validated.description);
    }

    if (validated.receiptEmail) {
      params.append("receipt_email", validated.receiptEmail);
    }

    if (validated.metadata) {
      for (const [key, value] of Object.entries(validated.metadata)) {
        params.append(`metadata[${key}]`, value);
      }
    }

    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Payment intent failed: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      clientSecret: result.client_secret,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntentResult> {
    const response = await fetch(
      `${this.baseUrl}/payment_intents/${paymentIntentId}/confirm`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Payment confirmation failed: ${error.error?.message}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      clientSecret: result.client_secret,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
    };
  }

  async cancelPayment(paymentIntentId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/payment_intents/${paymentIntentId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Payment cancellation failed: ${error.error?.message}`);
    }
  }

  async refund(data: Refund): Promise<RefundResult> {
    const validated = RefundSchema.parse(data);

    const params = new URLSearchParams({
      payment_intent: validated.paymentIntentId,
    });

    if (validated.amount) {
      params.append("amount", validated.amount.toString());
    }

    if (validated.reason) {
      params.append("reason", validated.reason);
    }

    const response = await fetch(`${this.baseUrl}/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Refund failed: ${error.error?.message}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      amount: result.amount,
      status: result.status,
    };
  }

  async createCustomer(email: string, name?: string): Promise<PaymentCustomer> {
    const params = new URLSearchParams({ email });
    if (name) {
      params.append("name", name);
    }

    const response = await fetch(`${this.baseUrl}/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Customer creation failed: ${error.error?.message}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      defaultPaymentMethod: result.invoice_settings?.default_payment_method,
    };
  }

  async getCustomer(customerId: string): Promise<PaymentCustomer | null> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Get customer failed: ${error.error?.message}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      defaultPaymentMethod: result.invoice_settings?.default_payment_method,
    };
  }

  async updateCustomer(
    customerId: string,
    data: Partial<PaymentCustomer>
  ): Promise<PaymentCustomer> {
    const params = new URLSearchParams();
    if (data.email) params.append("email", data.email);
    if (data.name) params.append("name", data.name);

    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Update customer failed: ${error.error?.message}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      defaultPaymentMethod: result.invoice_settings?.default_payment_method,
    };
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const response = await fetch(
      `${this.baseUrl}/payment_methods?customer=${customerId}&type=card`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`List payment methods failed: ${error.error?.message}`);
    }

    const result = await response.json();

    // Get customer to check default
    const customer = await this.getCustomer(customerId);

    return result.data.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : undefined,
      isDefault: pm.id === customer?.defaultPaymentMethod,
    }));
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/payment_methods/${paymentMethodId}/attach`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ customer: customerId }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Attach payment method failed: ${error.error?.message}`);
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/payment_methods/${paymentMethodId}/detach`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Detach payment method failed: ${error.error?.message}`);
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "invoice_settings[default_payment_method]": paymentMethodId,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Set default payment method failed: ${error.error?.message}`);
    }
  }
}

// Create payment service
export function createPaymentService(): PaymentService {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.warn("STRIPE_SECRET_KEY not set, using mock payment service");
    return new MockPaymentService();
  }

  return new StripePaymentService(apiKey);
}

// Mock service for development
class MockPaymentService implements PaymentService {
  private customers = new Map<string, PaymentCustomer>();
  private paymentMethods = new Map<string, PaymentMethod[]>();

  async createPaymentIntent(data: PaymentIntent): Promise<PaymentIntentResult> {
    const id = `pi_mock_${Date.now()}`;
    console.log("Mock payment intent created:", id, data);

    return {
      id,
      clientSecret: `${id}_secret_mock`,
      status: "requires_payment_method",
      amount: data.amount,
      currency: data.currency,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntentResult> {
    console.log("Mock payment confirmed:", paymentIntentId);

    return {
      id: paymentIntentId,
      clientSecret: `${paymentIntentId}_secret`,
      status: "succeeded",
      amount: 1000,
      currency: "usd",
    };
  }

  async cancelPayment(paymentIntentId: string): Promise<void> {
    console.log("Mock payment canceled:", paymentIntentId);
  }

  async refund(data: Refund): Promise<RefundResult> {
    const id = `re_mock_${Date.now()}`;
    console.log("Mock refund created:", id, data);

    return {
      id,
      amount: data.amount || 1000,
      status: "succeeded",
    };
  }

  async createCustomer(email: string, name?: string): Promise<PaymentCustomer> {
    const id = `cus_mock_${Date.now()}`;
    const customer: PaymentCustomer = { id, email, name };
    this.customers.set(id, customer);
    this.paymentMethods.set(id, []);
    console.log("Mock customer created:", id);

    return customer;
  }

  async getCustomer(customerId: string): Promise<PaymentCustomer | null> {
    return this.customers.get(customerId) || null;
  }

  async updateCustomer(
    customerId: string,
    data: Partial<PaymentCustomer>
  ): Promise<PaymentCustomer> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const updated = { ...customer, ...data };
    this.customers.set(customerId, updated);
    return updated;
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    return this.paymentMethods.get(customerId) || [];
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    const methods = this.paymentMethods.get(customerId) || [];
    methods.push({
      id: paymentMethodId,
      type: "card",
      card: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2025,
      },
      isDefault: methods.length === 0,
    });
    this.paymentMethods.set(customerId, methods);
    console.log("Mock payment method attached:", paymentMethodId);
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    for (const [customerId, methods] of this.paymentMethods.entries()) {
      const filtered = methods.filter((m) => m.id !== paymentMethodId);
      if (filtered.length !== methods.length) {
        this.paymentMethods.set(customerId, filtered);
        console.log("Mock payment method detached:", paymentMethodId);
        return;
      }
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    const methods = this.paymentMethods.get(customerId) || [];
    for (const method of methods) {
      method.isDefault = method.id === paymentMethodId;
    }
    console.log("Mock default payment method set:", paymentMethodId);
  }
}

export const paymentService = createPaymentService();
