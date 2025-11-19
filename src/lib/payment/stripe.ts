// Stripe Payment Integration
// Functions for handling Stripe payments, refunds, and webhooks

import Stripe from "stripe";

// Initialize Stripe with secret key from environment
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

/**
 * Creates a Stripe Payment Intent for checkout
 * @param orderId - Order ID for metadata
 * @param amount - Amount in cents (e.g., 1000 = $10.00)
 * @param currency - Currency code (default: USD)
 * @param customerEmail - Customer email for receipt
 * @returns Payment Intent with client secret
 */
export async function createPaymentIntent(
  orderId: string,
  amount: number,
  currency: string = "usd",
  customerEmail: string,
) {
  try {
    // Validate amount (minimum $0.50 USD)
    if (amount < 50) {
      throw new Error("Amount must be at least $0.50 USD");
    }

    // Create idempotency key to prevent duplicate charges
    const idempotencyKey = `order_${orderId}_${Date.now()}`;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount), // Ensure integer
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId,
          timestamp: new Date().toISOString(),
        },
        receipt_email: customerEmail,
        description: `Order #${orderId}`,
      },
      {
        idempotencyKey,
      },
    );

    console.log(
      `[STRIPE] Created Payment Intent: ${paymentIntent.id} for order ${orderId}, amount: $${(amount / 100).toFixed(2)}`,
    );

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error("[STRIPE] Error creating payment intent:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Retrieves and validates a Payment Intent
 * @param paymentIntentId - Payment Intent ID from Stripe
 * @returns Payment Intent details
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      created: new Date(paymentIntent.created * 1000),
    };
  } catch (error) {
    console.error("[STRIPE] Error retrieving payment intent:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Validates that a Payment Intent succeeded
 * @param paymentIntentId - Payment Intent ID
 * @returns True if payment succeeded
 */
export async function validatePaymentIntent(
  paymentIntentId: string,
): Promise<boolean> {
  try {
    const paymentIntent = await getPaymentIntent(paymentIntentId);

    return paymentIntent.status === "succeeded";
  } catch (error) {
    console.error("[STRIPE] Error validating payment intent:", error);
    return false;
  }
}

/**
 * Creates a refund for a payment
 * @param paymentIntentId - Payment Intent ID to refund
 * @param amount - Amount in cents to refund (optional, defaults to full refund)
 * @param reason - Reason for refund
 * @returns Refund details
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string,
) {
  try {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
    };

    if (amount) {
      refundData.amount = Math.round(amount);
    }

    if (reason) {
      refundData.metadata = {
        reason,
        timestamp: new Date().toISOString(),
      };
    }

    const refund = await stripe.refunds.create(refundData);

    console.log(
      `[STRIPE] Created refund: ${refund.id} for ${paymentIntentId}, amount: $${((refund.amount || 0) / 100).toFixed(2)}`,
    );

    return {
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      created: new Date(refund.created * 1000),
    };
  } catch (error) {
    console.error("[STRIPE] Error creating refund:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Handles Stripe webhook events
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Parsed event or null
 */
export async function handleWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Promise<Stripe.Event | null> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[STRIPE] STRIPE_WEBHOOK_SECRET not configured");
    return null;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    console.log(`[STRIPE] Webhook event received: ${event.type}`);

    return event;
  } catch (error) {
    console.error("[STRIPE] Webhook signature verification failed:", error);
    return null;
  }
}

/**
 * Processes webhook events for payment status updates
 * @param event - Stripe webhook event
 * @returns Order ID if payment succeeded, null otherwise
 */
export async function processPaymentWebhook(
  event: Stripe.Event,
): Promise<string | null> {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const orderId = paymentIntent.metadata.orderId;

      console.log(
        `[STRIPE] Payment succeeded for order: ${orderId}, amount: $${(paymentIntent.amount / 100).toFixed(2)}`,
      );

      return orderId;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const orderId = paymentIntent.metadata.orderId;
      const errorMessage =
        paymentIntent.last_payment_error?.message || "Unknown error";

      console.error(
        `[STRIPE] Payment failed for order: ${orderId}, reason: ${errorMessage}`,
      );

      return null;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;

      console.log(`[STRIPE] Refund processed for charge: ${charge.id}`);

      return null;
    }

    default:
      console.log(`[STRIPE] Unhandled event type: ${event.type}`);
      return null;
  }
}

/**
 * Retrieves publishable key for frontend
 * @returns Stripe publishable key
 */
export function getPublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined");
  }

  return publishableKey;
}

// Export Stripe instance for advanced usage
export { stripe };
