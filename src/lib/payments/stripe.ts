import Stripe from "stripe";
import { env } from "@/lib/config/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

export async function createPaymentIntent(
  amount: number,
  currency: string = "mxn",
  metadata?: Stripe.MetadataParam
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Amount in cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    throw new Error("Could not create PaymentIntent.");
  }
}
