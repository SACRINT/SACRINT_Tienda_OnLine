/**
 * Payment Charge API Endpoint
 * Semana 35, Tarea 35.1: Payment API Routes & Endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getPaymentOrchestrator } from "@/lib/payments";
import { getAdvancedFraudDetector } from "@/lib/payments";
import { getInvoiceGenerator } from "@/lib/payments";
import { logger } from "@/lib/monitoring";
import { z } from "zod";

const chargeSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethod: z.string(),
  customerId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
});

type ChargeRequest = z.infer<typeof chargeSchema>;

export async function POST(request: NextRequest) {
  try {
    // Autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validar request
    const body = await request.json();
    const chargeData = chargeSchema.parse(body);

    logger.info(
      { type: "charge_api_request", orderId: chargeData.orderId, amount: chargeData.amount },
      `API de pago solicitado: ${chargeData.amount} ${chargeData.currency}`,
    );

    // Detección de fraude
    const fraudDetector = getAdvancedFraudDetector();
    const fraudScore = fraudDetector.analyzeFraudRisk(chargeData.customerId, {
      amount: chargeData.amount,
      currency: chargeData.currency,
      country: request.headers.get("cf-ipcountry") || "US",
      device: request.headers.get("user-agent") || "unknown",
      ip: request.headers.get("x-forwarded-for") || request.ip || "unknown",
      paymentMethod: chargeData.paymentMethod,
      email: session.user?.email || "unknown",
      timestamp: new Date(),
    });

    if (fraudScore.recommendedAction === "block") {
      logger.warn(
        { type: "fraud_blocked", orderId: chargeData.orderId, score: fraudScore.score },
        `Transacción bloqueada por fraude`,
      );

      return NextResponse.json(
        { error: "Transaction blocked due to fraud detection" },
        { status: 403 },
      );
    }

    if (fraudScore.recommendedAction === "review") {
      logger.warn(
        { type: "fraud_review", orderId: chargeData.orderId, score: fraudScore.score },
        `Transacción requiere revisión manual`,
      );
    }

    // Procesar pago
    const paymentGateway = getPaymentOrchestrator();
    const paymentResult = await paymentGateway.processPayment(
      chargeData.orderId,
      chargeData.amount,
      chargeData.currency,
      chargeData.paymentMethod as any,
    );

    if (!paymentResult.success) {
      logger.error(
        { type: "payment_failed", orderId: chargeData.orderId, error: paymentResult.error },
        `Error al procesar pago`,
      );

      return NextResponse.json(
        { error: paymentResult.error?.message || "Payment processing failed" },
        { status: 400 },
      );
    }

    // Generar factura
    const invoiceGenerator = getInvoiceGenerator();
    const invoice = invoiceGenerator.generateInvoice(
      chargeData.orderId,
      chargeData.customerId,
      session.user?.id || "unknown",
      [
        {
          id: "1",
          description: `Payment for Order ${chargeData.orderId}`,
          quantity: 1,
          unitPrice: chargeData.amount,
          discount: 0,
          taxRate: 0,
          total: chargeData.amount,
        },
      ],
      chargeData.currency,
    );

    logger.info(
      {
        type: "payment_successful",
        orderId: chargeData.orderId,
        transactionId: paymentResult.transaction?.id,
      },
      `Pago procesado exitosamente`,
    );

    return NextResponse.json({
      success: true,
      transaction: paymentResult.transaction,
      invoice: {
        id: invoice.id,
        number: invoice.invoiceNumber,
        total: invoice.total,
      },
      fraudScore: {
        score: fraudScore.score,
        riskLevel: fraudScore.riskLevel,
      },
    });
  } catch (error) {
    logger.error({ type: "charge_api_error", error: String(error) }, "Error en API de pago");

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
