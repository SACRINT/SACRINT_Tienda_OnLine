/**
 * Stripe Advanced Features
 * Week 13: Tasks 13.1-13.4
 * Refunds, Saved Payment Methods, 3D Secure, Subscriptions
 */

import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// ============ 13.1: REFUNDS SYSTEM ============

export interface RefundInput {
  orderId: string;
  amount?: number; // Optional for partial refund
  reason: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, string>;
}

export async function createRefund(input: RefundInput) {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.paymentId) {
    throw new Error("Order has no payment ID");
  }

  // Create refund in Stripe
  const refund = await stripe.refunds.create({
    payment_intent: order.paymentId,
    amount: input.amount ? Math.round(input.amount * 100) : undefined, // Centavos
    reason: input.reason,
    metadata: {
      orderId: input.orderId,
      ...input.metadata,
    },
  });

  // Update order
  const updatedOrder = await db.order.update({
    where: { id: input.orderId },
    data: {
      paymentStatus: "REFUNDED",
      status: "REFUNDED",
    },
  });

  return { refund, order: updatedOrder };
}

// ============ 13.2: SAVED PAYMENT METHODS ============

export interface SavedPaymentMethodData {
  userId: string;
  stripePaymentMethodId: string;
  isDefault?: boolean;
}

export async function savePaymentMethod(data: SavedPaymentMethodData) {
  // Get payment method details from Stripe
  const paymentMethod = await stripe.paymentMethods.retrieve(
    data.stripePaymentMethodId
  );

  if (paymentMethod.type !== "card") {
    throw new Error("Only card payment methods are supported");
  }

  const card = paymentMethod.card!;

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db.$executeRaw`
      UPDATE "SavedPaymentMethod"
      SET "isDefault" = false
      WHERE "userId" = ${data.userId}
    `;
  }

  // Save to database
  const saved = await db.savedPaymentMethod.create({
    data: {
      userId: data.userId,
      stripeId: data.stripePaymentMethodId,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      isDefault: data.isDefault || false,
    },
  });

  return saved;
}

export async function getUserPaymentMethods(userId: string) {
  return db.savedPaymentMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function deletePaymentMethod(id: string, userId: string) {
  const method = await db.savedPaymentMethod.findFirst({
    where: { id, userId },
  });

  if (!method) {
    throw new Error("Payment method not found");
  }

  // Detach from Stripe
  await stripe.paymentMethods.detach(method.stripeId);

  // Delete from DB
  await db.savedPaymentMethod.delete({
    where: { id },
  });

  return { success: true };
}

// ============ 13.3: 3D SECURE / SCA ============

export async function createPaymentIntentWithSCA(
  amount: number,
  currency: string = "usd",
  customerId?: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
    // SCA is automatically applied by Stripe when needed
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    requiresAction: paymentIntent.status === "requires_action",
  };
}

export async function confirmPaymentWithSCA(
  paymentIntentId: string,
  paymentMethodId: string
) {
  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });

  return {
    status: paymentIntent.status,
    requiresAction: paymentIntent.status === "requires_action",
    clientSecret: paymentIntent.client_secret,
  };
}

// ============ 13.4: SUBSCRIPTIONS ============

export interface SubscriptionInput {
  customerId: string;
  priceId: string; // Stripe Price ID
  userId: string;
  tenantId: string;
}

export async function createSubscription(input: SubscriptionInput) {
  // Create subscription in Stripe
  const subscription = await stripe.subscriptions.create({
    customer: input.customerId,
    items: [{ price: input.priceId }],
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
  });

  // Save to database
  const dbSubscription = await db.subscription.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId,
      stripeId: subscription.id,
      stripeCustomerId: input.customerId,
      stripePriceId: input.priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  return { subscription, dbSubscription };
}

export async function cancelSubscription(subscriptionId: string) {
  // Cancel in Stripe
  const subscription = await stripe.subscriptions.cancel(subscriptionId);

  // Update in database
  await db.subscription.updateMany({
    where: { stripeId: subscriptionId },
    data: {
      status: "canceled",
      canceledAt: new Date(),
    },
  });

  return subscription;
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string
) {
  await db.subscription.updateMany({
    where: { stripeId: subscriptionId },
    data: { status },
  });
}

// ============ UTILITY FUNCTIONS ============

export async function getStripeCustomer(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create customer if doesn't exist
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId },
    });

    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  return user.stripeCustomerId;
}

export { stripe };
