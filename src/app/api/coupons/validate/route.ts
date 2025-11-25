import { NextResponse } from "next/server";
import { z } from "zod";
import { applyCoupon, ValidationError } from "@/lib/payments/coupons";
import { auth } from "@/lib/auth/auth"; // Corrected import

const validateSchema = z.object({
  code: z.string().min(1, "El código del cupón no puede estar vacío."),
  cartTotal: z.number().positive("El total del carrito debe ser un número positivo."),
});

export async function POST(request: Request) {
  try {
    const session = await auth(); // Use auth() to get session
    if (!session) { // Manually check if session exists
        return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    const body = await request.json();

    const validation = validateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }

    const { code, cartTotal } = validation.data;

    const { discount, coupon } = await applyCoupon(code, cartTotal);

    return NextResponse.json({
      success: true,
      discount,
      code: coupon.code,
      discountType: coupon.type, // Corrected property name
      discountValue: coupon.value.toNumber(), // Corrected property name and type conversion
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
     if (error instanceof Error && error.message.includes("No autenticado")) {
        return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    console.error("Coupon validation error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}