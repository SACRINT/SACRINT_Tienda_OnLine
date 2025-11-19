import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateShippingRates, validatePostalCode } from "@/lib/shipping";

const shippingRatesSchema = z.object({
  postalCode: z.string().length(5, "El código postal debe tener 5 dígitos"),
  state: z.string().optional(),
  subtotal: z.number().positive("El subtotal debe ser positivo"),
  package: z
    .object({
      weight: z.number().positive(),
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = shippingRatesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de solicitud inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { postalCode, state, subtotal, package: pkg } = validationResult.data;

    // Validate postal code format
    if (!validatePostalCode(postalCode)) {
      return NextResponse.json(
        { error: "Código postal inválido" },
        { status: 400 },
      );
    }

    // Calculate shipping rates
    const rates = calculateShippingRates({
      postalCode,
      state,
      subtotal,
      package: pkg,
    });

    return NextResponse.json({
      success: true,
      rates,
      freeShippingThreshold: subtotal >= 999 ? null : 999 - subtotal,
    });
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    return NextResponse.json(
      { error: "Error al calcular tarifas de envío" },
      { status: 500 },
    );
  }
}
