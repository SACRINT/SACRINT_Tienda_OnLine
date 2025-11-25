import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/payments/stripe";
import { z } from "zod";
import { auth } from "@/lib/auth/auth"; // Corrected import

const intentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  orderId: z.string().uuid("Invalid order ID"),
});

export async function POST(request: Request) {
  try {
    const session = await auth(); // Use auth() to get session
    if (!session) { // Manually check if session exists
        return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    const body = await request.json();

    const validation = intentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, orderId } = validation.data;

    // TODO: In a real app, verify that the amount matches the order total in the DB
    // const order = await db.order.findUnique({ where: { id: orderId }});
    // if (!order || order.total !== amount) {
    //   return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    // }

    const paymentIntent = await createPaymentIntent(amount, "mxn", {
      orderId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, ...paymentIntent });
  } catch (error) {
    console.error("Create Intent Error:", error);
    if (error instanceof Error && error.message.includes("No autenticado")) {
        return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
