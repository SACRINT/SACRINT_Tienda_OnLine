// src/app/api/checkout/session/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/payments/stripe";
import { auth } from "@/lib/auth/auth";
import { env } from "@/lib/config/env";

const cartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().url(),
});

const checkoutSessionSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1),
  currency: z.string().default("mxn"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkoutSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { cartItems, currency } = validation.data;

    const line_items = cartItems.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: item.price * 100, // Stripe expects amount in cents
      },
      quantity: item.quantity,
    }));

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXTAUTH_URL}/cart`,
      metadata: {
        userId: session.user.id,
        // You can add more metadata here, like cart details if needed
      },
    });

    return NextResponse.json({ sessionId: stripeSession.id });
  } catch (error) {
    console.error("Stripe Checkout Session Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
