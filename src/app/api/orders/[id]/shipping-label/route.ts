/**
 * Shipping Label Generation API - Task 16.4
 * POST /api/orders/[id]/shipping-label
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProvider, isProviderSupported, ShippingProviderType } from "@/lib/shipping/provider-manager";
import { z } from "zod";

// Validation schema
const LabelRequestSchema = z.object({
  provider: z.enum(["ESTAFETA", "MERCADO_ENVIOS", "FEDEX", "DHL", "UPS", "CUSTOM"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse and validate request
    const body = await req.json();
    const { provider } = LabelRequestSchema.parse(body);

    // Validate provider is supported
    if (!isProviderSupported(provider)) {
      return NextResponse.json(
        { error: `Provider ${provider} is not yet supported` },
        { status: 400 }
      );
    }

    // Get order with all necessary data
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        tenant: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate order is in correct status
    if (order.paymentStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: "Order payment must be completed before generating shipping label" },
        { status: 400 }
      );
    }

    // Check if label already exists
    const existingLabel = await db.shippingLabel.findFirst({
      where: {
        orderId: params.id,
        isReturnLabel: false,
      },
    });

    if (existingLabel) {
      return NextResponse.json(
        { error: "Shipping label already exists for this order", label: existingLabel },
        { status: 400 }
      );
    }

    // Get provider instance
    const providerInstance = getProvider(provider as ShippingProviderType);

    // Create label via provider
    const label = await providerInstance.createLabel({
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        weight: Number(item.product.weight || 0),
      })),
      shippingAddress: {
        name: order.customerName || "",
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country,
      },
      totalWeight: order.items.reduce(
        (sum, item) => sum + Number(item.product.weight || 0) * item.quantity,
        0
      ),
    });

    // Save to database
    const shippingLabel = await db.shippingLabel.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        provider: provider,
        labelId: label.id,
        trackingNumber: label.trackingNumber,
        labelUrl: label.labelUrl,
        cost: label.cost,
        status: "pending",
      },
    });

    // Update order status and tracking number
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "PROCESSING",
        trackingNumber: label.trackingNumber,
      },
    });

    return NextResponse.json({
      success: true,
      label: {
        id: shippingLabel.id,
        trackingNumber: shippingLabel.trackingNumber,
        labelUrl: shippingLabel.labelUrl,
        cost: shippingLabel.cost.toString(),
        provider: shippingLabel.provider,
      },
    });
  } catch (error) {
    console.error("Error generating shipping label:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate shipping label", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing label
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const labels = await db.shippingLabel.findMany({
      where: {
        orderId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (labels.length === 0) {
      return NextResponse.json(
        { error: "No shipping labels found for this order" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      labels: labels.map((label) => ({
        id: label.id,
        trackingNumber: label.trackingNumber,
        labelUrl: label.labelUrl,
        cost: label.cost.toString(),
        provider: label.provider,
        status: label.status,
        isReturnLabel: label.isReturnLabel,
        createdAt: label.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error retrieving shipping labels:", error);
    return NextResponse.json(
      { error: "Failed to retrieve shipping labels" },
      { status: 500 }
    );
  }
}
