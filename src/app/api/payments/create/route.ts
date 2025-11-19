import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateOXXOReference,
  generateOrderReference,
  calculateOXXOExpiration,
  BANK_TRANSFER_CONFIG,
  isAmountValidForMethod,
} from "@/lib/payments";

const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID es requerido"),
  amount: z.number().positive("El monto debe ser positivo"),
  paymentMethod: z.enum(["card", "mercadopago", "oxxo", "transfer"]),
  cardData: z
    .object({
      number: z.string(),
      name: z.string(),
      expiry: z.string(),
      cvc: z.string(),
      saveCard: z.boolean().optional(),
    })
    .optional(),
  customerEmail: z.string().email("Email inválido"),
  customerName: z.string().min(1, "Nombre es requerido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = createPaymentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de pago inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      orderId,
      amount,
      paymentMethod,
      cardData,
      customerEmail,
      customerName,
    } = validationResult.data;

    // Check if amount is valid for payment method
    if (!isAmountValidForMethod(amount, paymentMethod)) {
      return NextResponse.json(
        { error: "El monto no es válido para este método de pago" },
        { status: 400 },
      );
    }

    // Process based on payment method
    let paymentResult: any = {
      success: true,
      paymentId: `pay_${Date.now().toString(36)}`,
      orderId,
      amount,
      paymentMethod,
      status: "pending",
    };

    switch (paymentMethod) {
      case "card":
        // In production: Process with Stripe/Conekta
        paymentResult = {
          ...paymentResult,
          status: "processing",
          message: "Procesando pago con tarjeta",
          // Would return client_secret for Stripe Elements
        };
        break;

      case "mercadopago":
        // In production: Create MercadoPago preference
        paymentResult = {
          ...paymentResult,
          status: "pending",
          redirectUrl: "https://www.mercadopago.com.mx/checkout/v1/redirect",
          message: "Redirigiendo a Mercado Pago",
        };
        break;

      case "oxxo":
        const oxxoReference = generateOXXOReference();
        const oxxoExpiration = calculateOXXOExpiration();
        paymentResult = {
          ...paymentResult,
          status: "pending",
          oxxoData: {
            reference: oxxoReference,
            barcode: `646180${oxxoReference}`,
            expiresAt: oxxoExpiration.toISOString(),
            amount: amount + 15, // Include commission
            instructions: [
              "1. Acude a cualquier tienda OXXO",
              "2. Indica que realizarás un pago de servicio",
              "3. Proporciona la referencia de pago",
              "4. Realiza el pago en efectivo",
              "5. Conserva tu ticket como comprobante",
            ],
          },
          message: "Código de pago OXXO generado",
        };
        break;

      case "transfer":
        const orderReference = generateOrderReference(orderId);
        paymentResult = {
          ...paymentResult,
          status: "pending",
          transferData: {
            ...BANK_TRANSFER_CONFIG,
            reference: orderReference,
            concept: `Orden ${orderReference}`,
            amount,
          },
          message: "Datos de transferencia generados",
        };
        break;
    }

    // In production: Save payment intent to database
    // await db.paymentIntent.create({ data: paymentResult })

    return NextResponse.json(paymentResult);
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Error al crear el pago" },
      { status: 500 },
    );
  }
}
