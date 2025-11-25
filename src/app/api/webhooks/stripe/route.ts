// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/payments/stripe";
import { db } from "@/lib/db";
import { env } from "@/lib/config/env";
import { OrderStatus } from "@prisma/client";

// Placeholder for email function
const sendOrderConfirmationEmail = async (orderId: string) => {
    console.log(`Sending order confirmation email for order ${orderId}`);
    // Implement actual email sending logic here
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: 'COMPLETED',
            status: OrderStatus.PROCESSING,
            paymentId: session.payment_intent as string,
          },
        });
        await sendOrderConfirmationEmail(orderId);
      }
      break;

    case "payment_intent.succeeded":
      const paymentIntentSucceeded = event.data.object;
      const succeededOrderId = paymentIntentSucceeded.metadata.orderId;

      if (succeededOrderId) {
        await db.order.update({
          where: { id: succeededOrderId },
          data: { 
            paymentStatus: 'COMPLETED',
            status: OrderStatus.PROCESSING 
          },
        });
        await sendOrderConfirmationEmail(succeededOrderId);
      }
      break;

    case "payment_intent.payment_failed":
      const paymentIntentFailed = event.data.object;
      const failedOrderId = paymentIntentFailed.metadata.orderId;

      if (failedOrderId) {
        const order = await db.order.update({
          where: { id: failedOrderId },
          data: { 
            paymentStatus: 'FAILED',
            status: OrderStatus.CANCELLED
          },
          include: { items: true },
        });

        // Restore stock
        for (const item of order.items) {
          await db.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse("OK", { status: 200 });
}
