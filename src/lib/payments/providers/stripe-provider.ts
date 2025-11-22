// Stripe Payment Provider Implementation
// Week 19-20: Concrete implementation for Stripe

import Stripe from "stripe";
import {
  IPaymentProvider,
  PaymentProvider,
  PaymentIntent,
  PaymentCustomer,
  PaymentStatus,
  PaymentMethod,
  RefundRequest,
  WebhookEvent,
} from "../payment-provider.interface";

export class StripePaymentProvider implements IPaymentProvider {
  readonly provider = PaymentProvider.STRIPE;
  private stripe: Stripe;
  private readonly webhookSecret: string;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!apiKey) {
      console.warn("Stripe API key not configured");
    }

    this.stripe = new Stripe(apiKey || "", {
      apiVersion: "2025-10-29.clover",
    });
  }

  get isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    customerId?: string;
    metadata?: Record<string, any>;
    paymentMethods?: PaymentMethod[];
  }): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency || "mxn",
      customer: params.customerId,
      metadata: params.metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return this.mapToPaymentIntent(paymentIntent);
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(id);
    return this.mapToPaymentIntent(paymentIntent);
  }

  async cancelPaymentIntent(id: string): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.cancel(id);
    return this.mapToPaymentIntent(paymentIntent);
  }

  async createRefund(request: RefundRequest): Promise<{
    id: string;
    status: string;
    amount: number;
  }> {
    const refund = await this.stripe.refunds.create({
      payment_intent: request.paymentIntentId,
      amount: request.amount ? Math.round(request.amount * 100) : undefined,
      reason: request.reason as any,
      metadata: request.metadata,
    });

    return {
      id: refund.id,
      status: refund.status || "pending",
      amount: refund.amount / 100,
    };
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentCustomer> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    });

    return {
      id: customer.id,
      email: customer.email!,
      name: customer.name || undefined,
      phone: customer.phone || undefined,
      metadata: customer.metadata,
    };
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);
      return false;
    }
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      id: payload.id,
      type: payload.type,
      provider: PaymentProvider.STRIPE,
      data: payload.data,
      timestamp: new Date(payload.created * 1000),
    };
  }

  getSupportedPaymentMethods(): PaymentMethod[] {
    return [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.DIGITAL_WALLET];
  }

  getConfig() {
    return {
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookEndpoint: "/api/webhooks/stripe",
      supportedCurrencies: ["usd", "mxn", "eur", "gbp"],
      minAmount: 0.5, // $0.50 USD
      maxAmount: 999999,
    };
  }

  // Helper methods

  private mapToPaymentIntent(pi: Stripe.PaymentIntent): PaymentIntent {
    return {
      id: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: this.mapStatus(pi.status),
      clientSecret: pi.client_secret || undefined,
      metadata: pi.metadata,
    };
  }

  private mapStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.SUCCEEDED,
      canceled: PaymentStatus.CANCELLED,
    };

    return statusMap[status] || PaymentStatus.FAILED;
  }
}
