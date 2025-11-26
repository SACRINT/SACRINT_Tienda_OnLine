/**
 * Bulk Label Generation API - Task 16.6
 * POST /api/shipping/bulk-labels
 * Generate multiple shipping labels for PAID orders
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProvider, isProviderSupported, ShippingProviderType } from "@/lib/shipping/provider-manager";
import { z } from "zod";

const BulkLabelRequestSchema = z.object({
  tenantId: z.string(),
  orderIds: z.array(z.string()).min(1).max(100), // Max 100 orders at once
  provider: z.enum(["ESTAFETA", "MERCADO_ENVIOS", "FEDEX", "DHL", "UPS", "CUSTOM"]),
  sendEmail: z.boolean().optional().default(false),
});

interface LabelResult {
  orderId: string;
  orderNumber: string;
  success: boolean;
  labelId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, orderIds, provider, sendEmail } = BulkLabelRequestSchema.parse(body);

    // Validate provider
    if (!isProviderSupported(provider)) {
      return NextResponse.json(
        { error: `Provider ${provider} is not yet supported` },
        { status: 400 }
      );
    }

    // Get all orders with necessary data
    const orders = await db.order.findMany({
      where: {
        id: { in: orderIds },
        tenantId,
        paymentStatus: "COMPLETED",
        status: { in: ["PAID", "PENDING"] },
      },
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

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No eligible orders found. Orders must be PAID and have COMPLETED payment status." },
        { status: 400 }
      );
    }

    // Check for existing labels
    const existingLabels = await db.shippingLabel.findMany({
      where: {
        orderId: { in: orders.map((o) => o.id) },
        isReturnLabel: false,
      },
    });

    const existingLabelOrderIds = new Set(existingLabels.map((l) => l.orderId));

    // Filter out orders that already have labels
    const ordersToProcess = orders.filter((o) => !existingLabelOrderIds.has(o.id));

    if (ordersToProcess.length === 0) {
      return NextResponse.json(
        {
          error: "All orders already have shipping labels",
          skipped: orders.length,
        },
        { status: 400 }
      );
    }

    // Get provider instance
    const providerInstance = getProvider(provider as ShippingProviderType);

    // Generate labels for all orders
    const results: LabelResult[] = [];
    const labelUrls: string[] = [];

    for (const order of ordersToProcess) {
      try {
        // Create label
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
        await db.shippingLabel.create({
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

        // Update order
        await db.order.update({
          where: { id: order.id },
          data: {
            status: "PROCESSING",
            trackingNumber: label.trackingNumber,
          },
        });

        labelUrls.push(label.labelUrl);

        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: true,
          labelId: label.id,
          trackingNumber: label.trackingNumber,
          labelUrl: label.labelUrl,
        });
      } catch (error) {
        console.error(`Error generating label for order ${order.id}:`, error);
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    // Generate ZIP file with all PDFs (in production)
    // For now, return array of URLs
    const zipUrl = await generateZipFile(labelUrls);

    // Send email if requested
    if (sendEmail && successCount > 0) {
      await sendBulkLabelsEmail({
        tenantId,
        zipUrl,
        successCount,
        failedCount,
      });
    }

    return NextResponse.json({
      success: true,
      processed: ordersToProcess.length,
      successful: successCount,
      failed: failedCount,
      skipped: orders.length - ordersToProcess.length,
      zipUrl,
      results,
    });
  } catch (error) {
    console.error("Error generating bulk labels:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate bulk labels", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Helper: Generate ZIP file with all label PDFs
async function generateZipFile(labelUrls: string[]): Promise<string> {
  // In production: Use archiver or JSZip to create ZIP file
  // Upload to S3/Vercel Blob and return URL
  // For now, return mock URL
  return `https://storage.example.com/labels-${Date.now()}.zip`;
}

// Helper: Send email with ZIP download link
async function sendBulkLabelsEmail(params: {
  tenantId: string;
  zipUrl: string;
  successCount: number;
  failedCount: number;
}): Promise<void> {
  // In production: Use Resend to send email
  console.log(`Sending bulk labels email to tenant ${params.tenantId}`);
  console.log(`ZIP URL: ${params.zipUrl}`);
  console.log(`Successful: ${params.successCount}, Failed: ${params.failedCount}`);
}
