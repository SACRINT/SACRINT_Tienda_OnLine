/**
 * Return Shipping Label API - Task 16.11
 * POST /api/orders/[id]/return-label
 * Generate return shipping labels for customer returns
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProvider,
  isProviderSupported,
  ShippingProviderType,
} from "@/lib/shipping/provider-manager";
import { getShippingSettings } from "@/lib/shipping/settings";
import { z } from "zod";

const ReturnLabelRequestSchema = z.object({
  reason: z.string().optional(),
  provider: z.enum(["ESTAFETA", "MERCADO_ENVIOS", "FEDEX", "DHL", "UPS", "CUSTOM"]).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { reason, provider: requestedProvider } = ReturnLabelRequestSchema.parse(body);

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
        shippingLabels: {
          where: { isReturnLabel: false },
          take: 1,
        },
        tenant: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate order can have a return label
    if (!["DELIVERED", "SHIPPED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Return labels can only be generated for delivered or shipped orders" },
        { status: 400 },
      );
    }

    // Check if return label already exists
    const existingReturnLabel = await db.shippingLabel.findFirst({
      where: {
        orderId: params.id,
        isReturnLabel: true,
      },
    });

    if (existingReturnLabel) {
      return NextResponse.json(
        { error: "Return label already exists for this order", label: existingReturnLabel },
        { status: 400 },
      );
    }

    // Get shipping settings
    const settings = await getShippingSettings(order.tenantId);

    // Determine provider (use same as original shipment if not specified)
    const originalLabel = order.shippingLabels[0];
    const provider: ShippingProviderType =
      requestedProvider || originalLabel?.provider || settings.enabledProviders[0] || "ESTAFETA";

    if (!isProviderSupported(provider)) {
      return NextResponse.json(
        { error: `Provider ${provider} is not yet supported` },
        { status: 400 },
      );
    }

    // Get provider instance
    const providerInstance = getProvider(provider);

    // Create return label (customer → warehouse)
    const label = await providerInstance.createLabel({
      orderId: order.id,
      orderNumber: `RET-${order.orderNumber}`,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        weight: Number(item.product.weight || 0),
      })),
      // Reverse addresses: customer sends to warehouse
      shippingAddress: {
        name: order.tenant.name,
        street: settings.originAddress.street,
        city: settings.originAddress.city,
        state: settings.originAddress.state,
        zipCode: settings.originAddress.zipCode,
        country: settings.originAddress.country,
      },
      totalWeight: order.items.reduce(
        (sum, item) => sum + Number(item.product.weight || 0) * item.quantity,
        0,
      ),
    });

    // Save to database as return label
    const returnLabel = await db.shippingLabel.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        provider: provider,
        labelId: label.id,
        trackingNumber: label.trackingNumber,
        labelUrl: label.labelUrl,
        cost: label.cost,
        status: "pending",
        isReturnLabel: true,
      },
    });

    // Create order note about return
    await db.orderNote.create({
      data: {
        orderId: order.id,
        content: `Return shipping label generated\nReason: ${reason || "Not specified"}\nTracking: ${label.trackingNumber}`,
        isPublic: false,
        createdBy: "system",
      },
    });

    // Send email to customer with return instructions
    await sendReturnLabelEmail({
      customerEmail: order.customerEmail || "",
      orderNumber: order.orderNumber,
      labelUrl: label.labelUrl,
      trackingNumber: label.trackingNumber,
      reason,
    });

    return NextResponse.json({
      success: true,
      label: {
        id: returnLabel.id,
        trackingNumber: returnLabel.trackingNumber,
        labelUrl: returnLabel.labelUrl,
        cost: returnLabel.cost.toString(),
        provider: returnLabel.provider,
        isReturnLabel: true,
      },
      instructions: generateReturnInstructions(label.trackingNumber),
    });
  } catch (error) {
    console.error("Error generating return label:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate return label",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Helper: Send return label email to customer
async function sendReturnLabelEmail(params: {
  customerEmail: string;
  orderNumber: string;
  labelUrl: string;
  trackingNumber: string;
  reason?: string;
}): Promise<void> {
  console.log(`[EMAIL] Sending return label to ${params.customerEmail}`);

  // TODO: Implement via Resend
  const emailContent = {
    to: params.customerEmail,
    subject: `Return Label for Order ${params.orderNumber}`,
    html: `
      <h2>Return Shipping Label</h2>
      <p>Your return label for order ${params.orderNumber} is ready.</p>
      <p><strong>Tracking Number:</strong> ${params.trackingNumber}</p>
      <p><strong>Download Label:</strong> <a href="${params.labelUrl}">Click here</a></p>
      ${params.reason ? `<p><strong>Return Reason:</strong> ${params.reason}</p>` : ""}

      <h3>Return Instructions:</h3>
      <ol>
        <li>Print the attached return label</li>
        <li>Securely package your items</li>
        <li>Attach the label to the outside of the package</li>
        <li>Drop off at any authorized carrier location</li>
      </ol>

      <p>Your refund will be processed once we receive and inspect the returned items.</p>
    `,
  };

  console.log("Return label email:", emailContent);
}

// Helper: Generate return instructions
function generateReturnInstructions(trackingNumber: string): string[] {
  return [
    "1. Print the return shipping label",
    "2. Securely package all items you wish to return",
    "3. Attach the printed label to the outside of the package",
    "4. Drop off the package at any authorized carrier location",
    `5. Track your return using tracking number: ${trackingNumber}`,
    "6. Your refund will be processed within 5-7 business days after we receive your return",
  ];
}
