/**
 * Mercado Pago Checkout API
 * POST /api/checkout/mercadopago - Create payment preference
 * Returns Mercado Pago checkout URL
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createOrder } from "@/lib/db/orders";
import { validateCartBeforeCheckout, getCartTotal, getCartById } from "@/lib/db/cart";
import { createPaymentPreference, getCurrencyForCountry } from "@/lib/payment/mercadopago";
import { CheckoutSchema } from "@/lib/security/schemas/order-schemas";
import { db } from "@/lib/db/client";
import { reserveInventory } from "@/lib/db/inventory";
import { applyRateLimit } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/mercadopago
 * Creates Mercado Pago payment preference and returns checkout URL
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting - 10 checkout attempts per hour
    const rateLimitResult = await applyRateLimit(req, {
      userId: session.user.id,
      config: { interval: 60 * 60 * 1000, limit: 10 },
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json({ error: "User has no tenant assigned" }, { status: 404 });
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
      country, // For currency determination
    } = validation.data;

    // Validate payment method is Mercado Pago
    if (paymentMethod !== "MERCADO_PAGO") {
      return NextResponse.json(
        { error: "Invalid payment method for this endpoint" },
        { status: 400 },
      );
    }

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

    // Get cart and totals
    const cart = await getCartById(tenantId, cartId);
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const totals = await getCartTotal(tenantId, cartId, 99, 0.16);

    let orderId: string | null = null;
    let reservationId: string | null = null;

    try {
      // Step 1: Create order (PENDING status)
      const order = await createOrder({
        userId: session.user.id,
        tenantId,
        cartId,
        shippingAddressId,
        billingAddressId,
        paymentMethod: "MERCADO_PAGO",
        couponCode,
        notes,
      });

      orderId = order?.id || null;

      if (!orderId) {
        throw new Error("Failed to create order");
      }

      logger.info(
        {
          orderId,
          userId: session.user.id,
          tenantId,
        },
        "Order created for Mercado Pago checkout",
      );

      // Step 2: Reserve inventory
      const reservationItems = cart.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      reservationId = await reserveInventory(tenantId, orderId, reservationItems);

      logger.info(
        {
          orderId,
          reservationId,
        },
        "Inventory reserved for Mercado Pago order",
      );

      // Step 3: Determine currency based on country
      const currency = country ? getCurrencyForCountry(country) : "USD";

      // Step 4: Create Mercado Pago payment preference
      const items = cart.items.map((item: any) => ({
        id: item.productId,
        title: item.product?.name || "Product",
        description: item.product?.description || "",
        quantity: item.quantity,
        unit_price: parseFloat(item.product?.basePrice || "0"),
        currency_id: currency,
      }));

      // Add shipping as an item
      if (totals.shippingCost > 0) {
        items.push({
          id: "shipping",
          title: "Shipping",
          description: "Shipping cost",
          quantity: 1,
          unit_price: totals.shippingCost,
          currency_id: currency,
        });
      }

      // Add tax as an item
      if (totals.tax > 0) {
        items.push({
          id: "tax",
          title: "Tax",
          description: "Sales tax",
          quantity: 1,
          unit_price: totals.tax,
          currency_id: currency,
        });
      }

      const preference = await createPaymentPreference({
        items,
        payer: {
          email: session.user.email || "",
          name: session.user.name || undefined,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${orderId}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure?order_id=${orderId}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending?order_id=${orderId}`,
        },
        auto_return: "approved",
        external_reference: orderId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        statement_descriptor: "TIENDA_ONLINE",
        expires: true,
        // Expire in 1 hour
        expiration_date_to: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });

      logger.info(
        {
          orderId,
          preferenceId: preference.id,
        },
        "Mercado Pago preference created",
      );

      // Update order with Mercado Pago preference ID
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentId: preference.id,
        },
      });

      // Return preference details
      return NextResponse.json({
        success: true,
        orderId,
        orderNumber: order?.orderNumber,
        reservationId,
        preferenceId: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        amount: totals.total,
        currency,
        message: "Order created. Redirect to Mercado Pago checkout.",
      });
    } catch (error) {
      logger.error({ error: error }, "Mercado Pago checkout error");

      // Rollback: Delete order if it was created
      if (orderId) {
        try {
          await db.order.delete({ where: { id: orderId } });
          logger.info(
            {
              orderId,
            },
            "Rolled back order due to Mercado Pago error",
          );
        } catch (deleteError) {
          logger.error({ error: deleteError }, "Failed to rollback order");
        }
      }

      // Handle specific errors
      if (error instanceof Error && error.message.includes("Insufficient stock")) {
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
          error: "Failed to process Mercado Pago checkout",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error({ error: error }, "Mercado Pago checkout API error");

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
