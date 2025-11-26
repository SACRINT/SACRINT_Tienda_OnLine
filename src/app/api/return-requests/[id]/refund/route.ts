/**
 * Refund Processing API - Task 17.9
 * POST /api/return-requests/[id]/refund
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const returnRequest = await db.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        items: {
          where: { accepted: true },
          include: {
            product: true,
          },
        },
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: "Return request not found" },
        { status: 404 }
      );
    }

    if (returnRequest.status !== "INSPECTED") {
      return NextResponse.json(
        { error: `Cannot refund return in status: ${returnRequest.status}. Must be INSPECTED first.` },
        { status: 400 }
      );
    }

    // Calculate actual refund amount (only accepted items)
    const refundAmount = returnRequest.items.reduce(
      (sum, item) => sum + Number(item.refundPrice),
      0
    );

    // Process refund through payment provider
    let refundId: string | undefined;

    if (returnRequest.order.paymentMethod === "STRIPE") {
      // TODO: Process Stripe refund
      // const refund = await stripe.refunds.create({
      //   payment_intent: returnRequest.order.paymentId!,
      //   amount: Math.round(refundAmount * 100),
      //   reason: "requested_by_customer",
      // });
      // refundId = refund.id;
      console.log(`Stripe refund would be processed for $${refundAmount}`);
      refundId = `stripe_refund_${Date.now()}`;
    } else if (returnRequest.order.paymentMethod === "MERCADO_PAGO") {
      // TODO: Process Mercado Pago refund
      // const refund = await mp.refund(returnRequest.order.paymentId!);
      // refundId = refund.id;
      console.log(`Mercado Pago refund would be processed for $${refundAmount}`);
      refundId = `mp_refund_${Date.now()}`;
    }

    // Restore stock for accepted returns
    for (const item of returnRequest.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    // Update return request
    const updated = await db.returnRequest.update({
      where: { id: params.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundProvider: returnRequest.order.paymentMethod,
        refundId,
      },
    });

    // Create order note
    await db.orderNote.create({
      data: {
        orderId: returnRequest.orderId,
        content: `Refund processed: $${refundAmount}\nRefund ID: ${refundId}`,
        isPublic: false,
        createdBy: "system",
      },
    });

    // TODO: Send confirmation email to customer
    console.log(`Refund processed for order ${returnRequest.order.orderNumber}. Confirmation email pending.`);

    return NextResponse.json({
      success: true,
      refund: {
        id: refundId,
        amount: refundAmount,
        provider: returnRequest.order.paymentMethod,
        refundedAt: updated.refundedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
