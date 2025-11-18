// Checkout API
// POST /api/checkout - Process checkout and create order with payment
// Now integrated with inventory reservation system (Sprint 4)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createOrder } from "@/lib/db/orders";
import {
  validateCartBeforeCheckout,
  getCartTotal,
  getCartById,
} from "@/lib/db/cart";
import { createPaymentIntent } from "@/lib/payment/stripe";
import { CheckoutSchema } from "@/lib/security/schemas/order-schemas";
import { db } from "@/lib/db/client";
import {
  reserveInventory,
  confirmInventoryReservation,
} from "@/lib/db/inventory";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * POST /api/checkout
 * Processes checkout flow:
 * 1. Validates cart
 * 2. Creates Stripe Payment Intent
 * 3. Returns client secret for frontend
 * 4. Order is created after payment confirmation via webhook or confirmation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const validation = CheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const {
      cartId,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      couponCode,
      notes,
    } = validation.data;

    // Validate cart before checkout
    const validationResult = await validateCartBeforeCheckout(tenantId, cartId);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: "Cart validation failed",
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        },
        { status: 400 },
      );
    }

    // Get cart total
    const totals = await getCartTotal(tenantId, cartId, 99, 0.16); // $9.99 shipping, 16% tax

    // For Stripe payments, create order first, then reserve inventory, then create Payment Intent
    if (paymentMethod === "STRIPE" || paymentMethod === "CREDIT_CARD") {
      let orderId: string | null = null;
      let reservationId: string | null = null;

      try {
        // Step 1: Create order (without deducting stock)
        const order = await createOrder({
          userId: session.user.id,
          tenantId,
          cartId,
          shippingAddressId,
          billingAddressId,
          paymentMethod,
          couponCode,
          notes,
        });

        orderId = order?.id || null;

        if (!orderId) {
          throw new Error("Failed to create order");
        }

        console.log(
          `[CHECKOUT] Order created: ${orderId}, reserving inventory...`,
        );

        // Step 2: Get cart items for reservation
        const cart = await getCartById(tenantId, cartId);
        if (!cart) {
          throw new Error("Cart not found or does not belong to tenant");
        }

        const reservationItems = cart.items.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        }));

        // Step 3: Reserve inventory
        reservationId = await reserveInventory(
          tenantId,
          orderId,
          reservationItems,
        );

        console.log(
          `[CHECKOUT] Inventory reserved: ${reservationId} for order ${orderId}`,
        );

        // Step 4: Create Stripe Payment Intent
        const paymentIntent = await createPaymentIntent(
          `order_${orderId}`,
          Math.round(totals.total * 100), // Convert to cents
          "usd",
          session.user.email || "",
        );

        console.log(
          `[CHECKOUT] Payment Intent created for order ${orderId}: ${paymentIntent.paymentIntentId}`,
        );

        // Return Payment Intent client secret for frontend to complete payment
        return NextResponse.json({
          success: true,
          orderId,
          orderNumber: order?.orderNumber,
          reservationId,
          clientSecret: paymentIntent.clientSecret,
          paymentIntentId: paymentIntent.paymentIntentId,
          amount: totals.total,
          message:
            "Order created, inventory reserved. Complete payment on frontend.",
        });
      } catch (error) {
        console.error("[CHECKOUT] Stripe checkout error:", error);

        // Rollback: Delete order if it was created
        if (orderId) {
          try {
            await db.order.delete({ where: { id: orderId } });
            console.log(`[CHECKOUT] Rolled back order ${orderId} due to error`);
          } catch (deleteError) {
            console.error(
              `[CHECKOUT] Failed to rollback order ${orderId}:`,
              deleteError,
            );
          }
        }

        // Handle specific errors
        if (
          error instanceof Error &&
          error.message.includes("Insufficient stock")
        ) {
          return NextResponse.json(
            {
              error: "Insufficient stock",
              message: error.message,
            },
            { status: 409 },
          );
        }

        return NextResponse.json(
          {
            error: "Failed to process checkout",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    }

    // For other payment methods (non-Stripe), create order, reserve inventory, and immediately confirm
    // This would be for payment on delivery, bank transfer, etc.
    let orderId: string | null = null;
    let reservationId: string | null = null;

    try {
      // Step 1: Create order (without deducting stock)
      const order = await createOrder({
        userId: session.user.id,
        tenantId,
        cartId,
        shippingAddressId,
        billingAddressId,
        paymentMethod,
        couponCode,
        notes,
      });

      orderId = order?.id || null;

      if (!orderId) {
        throw new Error("Failed to create order");
      }

      console.log(
        `[CHECKOUT] Order created: ${orderId}, reserving inventory...`,
      );

      // Step 2: Get cart items for reservation
      const cart = await getCartById(tenantId, cartId);
      if (!cart) {
        throw new Error("Cart not found or does not belong to tenant");
      }

      const reservationItems = cart.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      // Step 3: Reserve inventory
      reservationId = await reserveInventory(
        tenantId,
        orderId,
        reservationItems,
      );

      console.log(
        `[CHECKOUT] Inventory reserved: ${reservationId} for order ${orderId}`,
      );

      // Step 4: Immediately confirm reservation (for non-Stripe payments)
      // This deducts the actual stock
      if (reservationId) {
        await confirmInventoryReservation(tenantId, reservationId);
      }

      console.log(
        `[CHECKOUT] Inventory confirmed for order ${orderId} (non-Stripe payment)`,
      );

      return NextResponse.json({
        success: true,
        orderId: order?.id,
        orderNumber: order?.orderNumber,
        total: totals.total,
        message: "Order created and inventory confirmed successfully",
      });
    } catch (error) {
      console.error("[CHECKOUT] Order creation error:", error);

      // Rollback: Delete order if it was created
      if (orderId) {
        try {
          await db.order.delete({ where: { id: orderId } });
          console.log(`[CHECKOUT] Rolled back order ${orderId} due to error`);
        } catch (deleteError) {
          console.error(
            `[CHECKOUT] Failed to rollback order ${orderId}:`,
            deleteError,
          );
        }
      }

      // Handle specific errors
      if (
        error instanceof Error &&
        error.message.includes("Insufficient stock")
      ) {
        return NextResponse.json(
          {
            error: "Insufficient stock",
            message: error.message,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          error: "Failed to create order",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[CHECKOUT] POST error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
