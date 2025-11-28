/**
 * Stripe Webhooks Handler
 * Tasks 13.7, 13.8 - Webhook Handling & Disputes
 */

import Stripe from "stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
}

/**
 * Verify webhook signature
 */
export async function verifyWebhook(body: string, signature: string): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

/**
 * Check if event was already processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await db.webhookEvent.findUnique({
    where: { stripeEventId: eventId },
  });
  return !!existing;
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string, type: string) {
  await db.webhookEvent.create({
    data: {
      stripeEventId: eventId,
      type,
      processedAt: new Date(),
    },
  });
}

/**
 * Handle payment_intent.succeeded
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "COMPLETED",
      status: "PROCESSING",
    },
  });
}

/**
 * Handle payment_intent.payment_failed
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "FAILED",
      status: "CANCELLED",
    },
  });
}

/**
 * Handle charge.refunded
 */
async function handleRefund(charge: Stripe.Charge) {
  const orderId = charge.metadata.orderId;
  if (!orderId) return;

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "REFUNDED",
      status: "REFUNDED",
    },
  });
}

/**
 * Handle charge.dispute.created (Task 13.8)
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const charge = await stripe.charges.retrieve(dispute.charge as string);
  const orderId = charge.metadata.orderId;

  // Create dispute record
  await db.dispute.create({
    data: {
      orderId: orderId!,
      stripeDisputeId: dispute.id,
      amount: dispute.amount / 100,
      reason: dispute.reason,
      status: dispute.status,
      evidence_due_by: new Date(dispute.evidence_details!.due_by! * 1000),
    },
  });

  // Notify admin
  // TODO: Send email notification
}

/**
 * Handle customer.subscription events
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await db.subscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.subscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      status: "canceled",
      canceledAt: new Date(),
    },
  });
}

/**
 * Main webhook handler
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  // Check idempotency
  if (await isEventProcessed(event.id)) {
    console.log(`Event ${event.id} already processed`);
    return { received: true, processed: false };
  }

  // Process event
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark as processed
    await markEventProcessed(event.id, event.type);

    return { received: true, processed: true };
  } catch (error) {
    console.error(`Error processing webhook ${event.id}:`, error);
    throw error;
  }
}

/**
 * Task 13.11: Payment Retry Logic
 */
const RETRY_SCHEDULE = [3, 5, 7]; // Days

export async function retryFailedPayment(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order || !order.paymentId) {
    throw new Error("Order or payment not found");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentId);

  if (paymentIntent.status === "requires_payment_method") {
    // Attempt retry
    try {
      const retried = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: order.user?.stripeCustomerId || undefined,
      });

      if (retried.status === "succeeded") {
        await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "COMPLETED",
            status: "PROCESSING",
          },
        });
      }

      return retried;
    } catch (error) {
      console.error("Retry failed:", error);
      throw error;
    }
  }

  return paymentIntent;
}

/**
 * Schedule automatic retries
 */
export async function schedulePaymentRetries(orderId: string) {
  for (const days of RETRY_SCHEDULE) {
    const retryDate = new Date();
    retryDate.setDate(retryDate.getDate() + days);

    // TODO: Schedule cron job for retryDate
    // await scheduleJob(retryDate, () => retryFailedPayment(orderId));
  }
}
