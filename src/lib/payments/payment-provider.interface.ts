// Payment Provider Interface
// Week 19-20: Abstraction for multiple payment gateways

export enum PaymentProvider {
  STRIPE = "STRIPE",
  PAYPAL = "PAYPAL",
  MERCADO_PAGO = "MERCADO_PAGO",
  OPENPAY = "OPENPAY",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  CARD = "CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  DIGITAL_WALLET = "DIGITAL_WALLET",
  BUY_NOW_PAY_LATER = "BUY_NOW_PAY_LATER",
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, any>;
  clientSecret?: string; // For client-side completion
  expiresAt?: Date;
}

export interface PaymentCustomer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: any;
  timestamp: Date;
}

/**
 * Base interface that all payment providers must implement
 */
export interface IPaymentProvider {
  readonly provider: PaymentProvider;
  readonly isConfigured: boolean;

  /**
   * Create a payment intent
   */
  createPaymentIntent(params: {
    amount: number;
    currency?: string;
    customerId?: string;
    metadata?: Record<string, any>;
    paymentMethods?: PaymentMethod[];
  }): Promise<PaymentIntent>;

  /**
   * Retrieve payment intent status
   */
  getPaymentIntent(id: string): Promise<PaymentIntent>;

  /**
   * Cancel a pending payment
   */
  cancelPaymentIntent(id: string): Promise<PaymentIntent>;

  /**
   * Create a refund
   */
  createRefund(request: RefundRequest): Promise<{
    id: string;
    status: string;
    amount: number;
  }>;

  /**
   * Create or retrieve a customer
   */
  createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentCustomer>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent;

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): PaymentMethod[];

  /**
   * Get provider configuration
   */
  getConfig(): {
    publicKey?: string;
    webhookEndpoint: string;
    supportedCurrencies: string[];
    minAmount: number;
    maxAmount: number;
  };
}

/**
 * Payment provider factory
 */
export interface IPaymentProviderFactory {
  getProvider(provider: PaymentProvider): IPaymentProvider;
  getDefaultProvider(): IPaymentProvider;
  getAllProviders(): IPaymentProvider[];
}
